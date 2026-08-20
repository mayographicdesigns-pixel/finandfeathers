"""Events router — events CRUD, free reservations, AI flyer extraction."""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from database import db, get_current_admin
from models import EventCreate, EventUpdate
from timezone_utils import get_location_tz_name
from typing import Optional
from datetime import datetime, timezone
from pathlib import Path
import base64
import uuid
import os
import json
import logging

router = APIRouter(prefix="/api")

# Path to git-tracked snapshot used by the startup sync migration
EVENTS_SYNC_FILE = Path(__file__).resolve().parent.parent / "migrations" / "events_sync.json"


def _serialize_for_snapshot(event: dict) -> dict:
    """Copy event, drop internal-only fields, convert datetimes to ISO strings."""
    out = {}
    for k, v in event.items():
        if k in ("_id",):
            continue
        if isinstance(v, datetime):
            out[k] = v.isoformat()
        else:
            out[k] = v
    return out


def _append_event_snapshot(event: dict) -> None:
    """Append/replace an event in the git-tracked events_sync.json snapshot.

    Matched by `id`. Safe to call on every create/bulk-create. Failures are
    logged but never raised so the API stays green.
    """
    try:
        EVENTS_SYNC_FILE.parent.mkdir(parents=True, exist_ok=True)
        if EVENTS_SYNC_FILE.exists():
            data = json.loads(EVENTS_SYNC_FILE.read_text() or "{}")
        else:
            data = {}
        events = data.get("events") or []
        snap = _serialize_for_snapshot(event)
        # Replace existing entry with same id, else append
        replaced = False
        for i, e in enumerate(events):
            if e.get("id") == snap.get("id"):
                events[i] = snap
                replaced = True
                break
        if not replaced:
            events.append(snap)
        data["events"] = events
        data["description"] = data.get("description") or (
            "Auto-generated event snapshot. Startup migration `apply_events_sync_migration()` "
            "upserts these into the production DB on the next deploy."
        )
        EVENTS_SYNC_FILE.write_text(json.dumps(data, indent=2, default=str))
    except Exception as e:
        logging.warning(f"Failed to write events_sync.json: {e}")


async def _auto_post_event_to_wall(event: dict) -> list:
    """
    When an event flips to Active, drop a promo post on the Social Wall.
    - "all-locations" or blank slug → broadcasts to all active non-hibachi locations
    - specific slug → single-location post
    Returns list of created wall_post ids (also stored on the event).
    """
    try:
        image_url = (event.get("image") or "").strip()
        if not image_url:
            return []

        name = event.get("name") or "New Event"
        date = event.get("date") or ""
        time = event.get("time") or ""
        location_text = event.get("location") or ""
        description = (event.get("description") or "").strip()

        # Build a compact caption line
        meta_bits = [b for b in [date, time, location_text] if b and b.upper() != "TBD"]
        meta_line = " · ".join(meta_bits)
        caption = f"🎉 {name}"
        if meta_line:
            caption += f"\n{meta_line}"
        if description:
            caption += f"\n\n{description}"

        # Determine target locations
        slug = (event.get("location_slug") or "").strip()
        targets = []
        if slug and slug != "all-locations":
            targets = [slug]
        else:
            locs = await db.locations.find(
                {"is_active": True, "slug": {"$ne": "hibachi-food-truck"}},
                {"_id": 0, "slug": 1},
            ).to_list(length=50)
            targets = [l["slug"] for l in locs if l.get("slug")]

        if not targets:
            return []

        now_iso = datetime.now(timezone.utc).isoformat()
        created_ids = []
        for loc_slug in targets:
            post_id = str(uuid.uuid4())
            post = {
                "id": post_id,
                "location_slug": loc_slug,
                "user_id": "system-events",
                "user_name": "Fin & Feathers",
                "user_avatar": "",
                "user_photo": "",
                "post_type": "photo",
                "content": caption,
                "image_url": image_url,
                "likes": [],
                "comments": [],
                "source": "event_auto_post",
                "source_event_id": event.get("id"),
                "created_at": now_iso,
            }
            if len(targets) > 1:
                # Group all fan-out posts under a single broadcast_id
                post["broadcast_id"] = post.get("broadcast_id") or f"event_{event.get('id')}"
                post["is_broadcast"] = True
            await db.wall_posts.insert_one(post)

            # Mirror to gallery (matches how DJ posts flow)
            await db.gallery_items.insert_one({
                "id": str(uuid.uuid4()),
                "title": name[:100],
                "image_url": image_url,
                "category": "social",
                "is_active": True,
                "display_order": 999,
                "location_slug": loc_slug,
                "posted_by": "Fin & Feathers",
                "posted_by_id": "system-events",
                "source": "event_auto_post",
                "source_post_id": post_id,
                "source_event_id": event.get("id"),
                "created_at": now_iso,
            })
            created_ids.append(post_id)

        logging.info(f"Auto-posted event {event.get('id')} to {len(created_ids)} location(s)")
        return created_ids
    except Exception as e:
        logging.error(f"Auto-post event to wall failed: {e}")
        return []

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
    for event in events:
        slug = event.get("location_slug", "")
        if slug:
            event["timezone"] = get_location_tz_name(slug)
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
    return events


@router.post("/admin/events")
async def admin_create_event(event: EventCreate, username: str = Depends(get_current_admin)):
    """Create a new event. All text fields are optional — blanks default to placeholders."""
    event_dict = event.dict()
    event_dict["id"] = str(uuid.uuid4())
    # Placeholder defaults so UI doesn't break on blanks
    event_dict["name"] = (event_dict.get("name") or "").strip() or "Untitled Event"
    event_dict["description"] = (event_dict.get("description") or "").strip() or ""
    event_dict["date"] = (event_dict.get("date") or "").strip() or "TBD"
    event_dict["time"] = (event_dict.get("time") or "").strip() or "TBD"
    event_dict["location"] = (event_dict.get("location") or "").strip() or ""
    event_dict["image"] = (event_dict.get("image") or "").strip() or ""
    # is_active: default True if omitted
    if event_dict.get("is_active") is None:
        event_dict["is_active"] = True
    event_dict["created_at"] = datetime.now(timezone.utc)
    event_dict["updated_at"] = datetime.now(timezone.utc)
    await db.events.insert_one(event_dict)
    event_dict.pop("_id", None)
    _append_event_snapshot(event_dict)
    return event_dict


@router.put("/admin/events/{event_id}")
async def admin_update_event(event_id: str, update: EventUpdate, username: str = Depends(get_current_admin)):
    """Update an existing event. Auto-posts to the Social Wall on Active flip."""
    existing = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Event not found")

    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)

    # Detect transition to Active for auto-post
    will_activate = (
        update_data.get("is_active") is True
        and existing.get("is_active") is not True
        and not existing.get("wall_post_ids")
    )

    await db.events.update_one({"id": event_id}, {"$set": update_data})
    updated = await db.events.find_one({"id": event_id}, {"_id": 0})

    if will_activate:
        post_ids = await _auto_post_event_to_wall(updated)
        if post_ids:
            await db.events.update_one(
                {"id": event_id},
                {"$set": {"wall_post_ids": post_ids, "wall_posted_at": datetime.now(timezone.utc)}},
            )
            updated = await db.events.find_one({"id": event_id}, {"_id": 0})

    _append_event_snapshot(updated)
    return updated


@router.delete("/admin/events/{event_id}")
async def admin_delete_event(event_id: str, username: str = Depends(get_current_admin)):
    """Delete an event"""
    result = await db.events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    # Remove from git-tracked snapshot too so it doesn't resurrect on next deploy
    try:
        if EVENTS_SYNC_FILE.exists():
            data = json.loads(EVENTS_SYNC_FILE.read_text() or "{}")
            events = [e for e in (data.get("events") or []) if e.get("id") != event_id]
            data["events"] = events
            EVENTS_SYNC_FILE.write_text(json.dumps(data, indent=2, default=str))
    except Exception as e:
        logging.warning(f"Failed to purge event {event_id} from events_sync.json: {e}")
    return {"success": True, "message": "Event deleted"}


@router.post("/admin/events/extract-flyer")
async def extract_event_from_flyer(file: UploadFile = File(...), username: str = Depends(get_current_admin)):
    """Use AI to read an event flyer image and extract event details"""
    return await _extract_flyer_details(file)


async def _extract_flyer_details(file: UploadFile) -> dict:
    """Shared helper: extract event fields from an uploaded flyer image using AI."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    import json as json_lib
    import re

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    image_b64 = base64.b64encode(contents).decode('utf-8')
    api_key = os.environ.get('EMERGENT_LLM_KEY', '')
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")

    empty_result = {"name": "", "description": "", "date": "", "time": "", "location": "", "featured": False}

    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"flyer_{uuid.uuid4().hex[:8]}",
            system_message=(
                "You are an event data extractor. Read event flyer images and return ONLY a valid JSON "
                "object with the requested fields. Never include markdown fences, explanations, or extra text."
            )
        ).with_model("openai", "gpt-4o")

        image_content = ImageContent(image_base64=image_b64)
        prompt = (
            "Extract event details from this flyer image. Return ONLY a JSON object with these exact keys: "
            '{"name": "", "description": "", "date": "", "time": "", "location": "", "featured": false}. '
            "Rules: "
            "- name: the event title/headline. "
            "- description: 1-2 sentence summary of what's happening (DJs, performers, theme). "
            "- date: exact date(s) as printed (e.g., 'March 25, 2026', 'Every Friday', 'Sat Feb 8'). "
            "- time: start-end times as printed (e.g., '9PM - 2AM', 'Doors 8PM'). "
            "- location: venue name or address if shown, otherwise empty string. "
            "- featured: always false. "
            "If a field is not clearly visible, return an empty string for it. "
            "Return ONLY the JSON object, no code fences, no commentary."
        )
        response = await chat.send_message(UserMessage(text=prompt, file_contents=[image_content]))

        # Robust JSON extraction
        cleaned = (response or "").strip()
        # Strip markdown code fences if present
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
        # If still not clean JSON, grab first {...} block
        if not cleaned.startswith("{"):
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                cleaned = match.group(0)

        try:
            extracted = json_lib.loads(cleaned)
        except Exception:
            logging.warning(f"Flyer JSON parse fallback. Raw response: {response!r}")
            return empty_result

        # Normalize: coerce all string fields to strings, featured to bool
        result = {**empty_result}
        for key in ["name", "description", "date", "time", "location"]:
            val = extracted.get(key, "")
            result[key] = str(val).strip() if val is not None else ""
        result["featured"] = bool(extracted.get("featured", False))
        return result
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"AI flyer extraction error: {e}")
        # Return empty rather than 500 so bulk uploads still create the event with just the image
        return empty_result


@router.post("/admin/events/bulk-upload")
async def admin_bulk_upload_flyers(
    files: list[UploadFile] = File(...),
    username: str = Depends(get_current_admin)
):
    """
    Bulk upload multiple event flyer images. For each file:
      1. Save the image to disk (via existing upload flow)
      2. Try AI extraction to auto-fill name/date/time/etc.
      3. Create an event (hidden by default) even if AI fails.
    Returns a per-file result list.
    """
    from pathlib import Path

    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    if len(files) > 25:
        raise HTTPException(status_code=400, detail="Maximum 25 flyers per bulk upload")

    uploads_dir = Path("/app/backend/uploads")
    uploads_dir.mkdir(parents=True, exist_ok=True)

    results = []
    # Determine starting display_order (append to end)
    last = await db.events.find({}, {"display_order": 1}).sort("display_order", -1).limit(1).to_list(1)
    next_order = ((last[0].get("display_order", 0) if last else 0) + 1)

    for idx, upload in enumerate(files):
        entry = {"filename": upload.filename, "success": False, "event_id": None, "extracted": False, "error": None}
        try:
            # Read once, reuse for both save and AI
            content = await upload.read()
            if not content:
                entry["error"] = "Empty file"
                results.append(entry)
                continue
            if len(content) > 10 * 1024 * 1024:
                entry["error"] = "File too large (max 10MB)"
                results.append(entry)
                continue

            ext = os.path.splitext(upload.filename or "")[1].lower() or ".jpg"
            if ext not in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
                ext = ".jpg"
            unique_filename = f"event_{uuid.uuid4().hex[:12]}{ext}"
            file_path = uploads_dir / unique_filename
            with open(file_path, "wb") as f:
                f.write(content)
            image_url = f"/api/uploads/{unique_filename}"

            # AI extraction (best-effort). Build an ad-hoc UploadFile-like object.
            extracted = {"name": "", "description": "", "date": "", "time": "", "location": "", "featured": False}
            try:
                from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
                import json as json_lib
                import re
                image_b64 = base64.b64encode(content).decode('utf-8')
                api_key = os.environ.get('EMERGENT_LLM_KEY', '')
                if api_key:
                    chat = LlmChat(
                        api_key=api_key,
                        session_id=f"bulkflyer_{uuid.uuid4().hex[:8]}",
                        system_message="You are an event data extractor. Return ONLY a JSON object. No markdown, no commentary."
                    ).with_model("openai", "gpt-4o")
                    response = await chat.send_message(UserMessage(
                        text=(
                            'Extract event details as JSON with keys: {"name":"","description":"","date":"","time":"","location":"","featured":false}. '
                            "Use empty strings for missing fields. Return ONLY the JSON."
                        ),
                        file_contents=[ImageContent(image_base64=image_b64)]
                    ))
                    cleaned = (response or "").strip()
                    if cleaned.startswith("```"):
                        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
                        cleaned = re.sub(r"\s*```$", "", cleaned)
                    if not cleaned.startswith("{"):
                        m = re.search(r"\{.*\}", cleaned, re.DOTALL)
                        if m:
                            cleaned = m.group(0)
                    parsed = json_lib.loads(cleaned)
                    for key in ["name", "description", "date", "time", "location"]:
                        v = parsed.get(key, "")
                        extracted[key] = str(v).strip() if v is not None else ""
                    extracted["featured"] = bool(parsed.get("featured", False))
                    if extracted["name"] or extracted["date"]:
                        entry["extracted"] = True
            except Exception as ai_err:
                logging.warning(f"Bulk flyer AI extract failed for {upload.filename}: {ai_err}")
                # continue — we still create the event with just the image

            # Create event doc — always hidden by default for bulk (user chose option b-A)
            event_doc = {
                "id": str(uuid.uuid4()),
                "name": extracted["name"] or "Untitled Event",
                "description": extracted["description"] or "",
                "date": extracted["date"] or "TBD",
                "time": extracted["time"] or "TBD",
                "location": extracted["location"] or "",
                "location_slug": None,
                "image": image_url,
                "featured": False,
                "free_entry": False,
                "packages": ["general"],
                "package_prices": {"general": 25.0, "vip": 75.0, "table": 200.0},
                "is_active": False,  # Hidden by default per user request
                "display_order": next_order + idx,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
            await db.events.insert_one(event_doc)
            event_doc.pop("_id", None)
            _append_event_snapshot(event_doc)

            entry["success"] = True
            entry["event_id"] = event_doc["id"]
            entry["event"] = {
                "id": event_doc["id"],
                "name": event_doc["name"],
                "date": event_doc["date"],
                "time": event_doc["time"],
                "image": event_doc["image"],
            }
        except Exception as e:
            logging.error(f"Bulk flyer error for {upload.filename}: {e}")
            entry["error"] = str(e)
        results.append(entry)

    successes = sum(1 for r in results if r["success"])
    extracted_count = sum(1 for r in results if r["extracted"])
    return {
        "total": len(files),
        "created": successes,
        "extracted": extracted_count,
        "results": results,
    }
