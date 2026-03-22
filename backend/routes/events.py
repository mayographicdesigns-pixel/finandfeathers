"""Events router — events CRUD, free reservations, AI flyer extraction."""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from database import db, get_current_admin
from models import EventCreate, EventUpdate
from typing import Optional
from datetime import datetime, timezone
import base64
import uuid
import os
import logging

router = APIRouter(prefix="/api")

# Event ticket packages (predefined on backend for security)
EVENT_PACKAGES = {
    "general": {"amount": 25.00, "name": "General Admission", "description": "General admission ticket"},
    "vip": {"amount": 75.00, "name": "VIP Experience", "description": "VIP admission with perks"},
    "table": {"amount": 200.00, "name": "Table Reservation", "description": "Reserved table for 4"},
}

# Default events if none in database
DEFAULT_EVENTS = [
    {
        "id": "friday-night-live",
        "name": "Friday Night Live",
        "description": "Live DJ, dancing, and signature cocktails every Friday night! Experience the best nightlife in Atlanta.",
        "date": "Every Friday",
        "time": "9PM - 2AM",
        "location": "Edgewood (Atlanta)",
        "location_slug": "edgewood-atlanta",
        "image": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6657.jpg",
        "featured": True,
        "packages": ["general", "vip", "table"],
        "package_prices": {"general": 25.00, "vip": 75.00, "table": 200.00},
        "is_active": True,
        "display_order": 0
    },
    {
        "id": "brunch-beats",
        "name": "Brunch & Beats",
        "description": "Sunday brunch with a twist! Live DJ spinning feel-good music while you enjoy our famous chicken & waffles.",
        "date": "Every Sunday",
        "time": "11AM - 4PM",
        "location": "All Locations",
        "location_slug": None,
        "image": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/a3e08521f140462cbedf10dedd32f879.jpeg",
        "featured": False,
        "packages": ["general", "vip"],
        "package_prices": {"general": 25.00, "vip": 75.00},
        "is_active": True,
        "display_order": 1
    },
    {
        "id": "wine-wednesday",
        "name": "Wine Down Wednesday",
        "description": "Half-price bottles of wine paired with live acoustic performances. The perfect midweek escape.",
        "date": "Every Wednesday",
        "time": "6PM - 10PM",
        "location": "Midtown (Atlanta)",
        "location_slug": "midtown-atlanta",
        "image": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6656.jpg",
        "featured": False,
        "packages": ["general"],
        "package_prices": {"general": 25.00},
        "is_active": True,
        "display_order": 2
    }
]


class FreeEventReservationRequest(BaseModel):
    event_id: str
    package_id: str
    quantity: int = 1
    email: Optional[str] = None
    phone: Optional[str] = None


async def fetch_event_by_id(event_id: str):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if event:
        return event
    for default_event in DEFAULT_EVENTS:
        if default_event["id"] == event_id:
            return default_event
    return None


async def resolve_event_reservation_link(event: dict):
    location_slug = event.get("location_slug")
    if location_slug:
        location = await db.locations.find_one({"slug": location_slug}, {"_id": 0})
        if location and location.get("reservations"):
            return location.get("reservations"), location

    event_location = (event.get("location") or "").strip().lower()
    if not event_location:
        return None, None
    if "all locations" in event_location:
        return "/locations", None

    locations = await db.locations.find({}, {"_id": 0, "name": 1, "slug": 1, "reservations": 1}).to_list(100)
    for location in locations:
        name = (location.get("name") or "").lower()
        if event_location in name or name in event_location:
            if location.get("reservations"):
                return location.get("reservations"), location
    return None, None


# ==================== PUBLIC EVENTS ====================

@router.get("/events")
async def get_public_events():
    """Get all active events for public display"""
    events = await db.events.find({"is_active": True}, {"_id": 0}).sort("display_order", 1).to_list(100)
    if not events:
        return DEFAULT_EVENTS
    return events


@router.get("/events/packages")
async def get_event_packages():
    """Get available event ticket packages"""
    return EVENT_PACKAGES


@router.post("/events/free-reserve")
async def free_reserve_event(reservation: FreeEventReservationRequest):
    event = await fetch_event_by_id(reservation.event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if reservation.package_id not in EVENT_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid event package")

    package_prices = event.get("package_prices") or {}
    package_amount = float(package_prices.get(reservation.package_id, EVENT_PACKAGES[reservation.package_id]["amount"]))
    if package_amount > 0:
        raise HTTPException(status_code=400, detail="Selected package requires payment")

    quantity = max(1, reservation.quantity)
    reservation_id = f"free_evt_{uuid.uuid4().hex[:12]}"
    record = {
        "id": reservation_id,
        "event_id": reservation.event_id,
        "event_name": event.get("name"),
        "event_date": event.get("date"),
        "event_time": event.get("time"),
        "event_location": event.get("location"),
        "package_id": reservation.package_id,
        "quantity": quantity,
        "amount": 0.0,
        "email": reservation.email,
        "phone": reservation.phone,
        "status": "reserved",
        "created_at": datetime.now(timezone.utc)
    }
    await db.event_reservations.insert_one(record)

    reservation_link, location = await resolve_event_reservation_link(event)
    if not reservation_link:
        reservation_link = "/locations"
    receipt_status = "pending_setup" if reservation.email else "not_requested"
    return {
        "success": True,
        "reservation_id": reservation_id,
        "reservation_link": reservation_link,
        "reservation_location": location.get("name") if location else None,
        "receipt_status": receipt_status,
        "message": "Reservation confirmed. Email receipts will send once Gmail is configured."
    }


# ==================== ADMIN EVENTS ====================

@router.get("/admin/events")
async def admin_get_events(username: str = Depends(get_current_admin)):
    """Get all events including inactive (admin only)"""
    events = await db.events.find({}, {"_id": 0}).sort("display_order", 1).to_list(100)
    if not events:
        for event in DEFAULT_EVENTS:
            event_copy = event.copy()
            event_copy["created_at"] = datetime.now(timezone.utc)
            event_copy["updated_at"] = datetime.now(timezone.utc)
            await db.events.insert_one(event_copy)
        events = await db.events.find({}, {"_id": 0}).sort("display_order", 1).to_list(100)
    return events


@router.post("/admin/events")
async def admin_create_event(event: EventCreate, username: str = Depends(get_current_admin)):
    """Create a new event"""
    event_dict = event.dict()
    event_dict["id"] = str(uuid.uuid4())
    event_dict["is_active"] = True
    event_dict["created_at"] = datetime.now(timezone.utc)
    event_dict["updated_at"] = datetime.now(timezone.utc)
    await db.events.insert_one(event_dict)
    event_dict.pop("_id", None)
    return event_dict


@router.put("/admin/events/{event_id}")
async def admin_update_event(event_id: str, update: EventUpdate, username: str = Depends(get_current_admin)):
    """Update an existing event"""
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    result = await db.events.update_one({"id": event_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    updated = await db.events.find_one({"id": event_id}, {"_id": 0})
    return updated


@router.delete("/admin/events/{event_id}")
async def admin_delete_event(event_id: str, username: str = Depends(get_current_admin)):
    """Delete an event"""
    result = await db.events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"success": True, "message": "Event deleted"}


@router.post("/admin/events/extract-flyer")
async def extract_event_from_flyer(file: UploadFile = File(...)):
    """Use AI to read an event flyer image and extract event details"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    image_b64 = base64.b64encode(contents).decode('utf-8')
    api_key = os.environ.get('EMERGENT_LLM_KEY', '')
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")

    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"flyer_{uuid.uuid4().hex[:8]}",
            system_message="You are an event data extractor. Extract event information from flyer images and return ONLY a valid JSON object. No markdown, no explanation."
        ).with_model("openai", "gpt-4o")

        image_content = ImageContent(image_base64=image_b64)
        response = await chat.send_message(UserMessage(
            text="""Extract the following event details from this flyer image. Return ONLY a valid JSON object with these fields:
{
  "name": "Event name/title",
  "description": "Brief description of the event",
  "date": "Date(s) of the event (e.g., 'March 25, 2026' or 'Every Friday')",
  "time": "Time of the event (e.g., '9PM - 2AM')",
  "location": "Venue/location name if visible",
  "featured": false
}
If a field is not visible in the flyer, use an empty string. Return ONLY the JSON, no other text.""",
            file_contents=[image_content]
        ))

        import json as json_lib
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
        extracted = json_lib.loads(cleaned)
        return extracted
    except Exception as e:
        logging.error(f"AI flyer extraction error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to extract event details: {str(e)}")
