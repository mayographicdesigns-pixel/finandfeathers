"""Locations router — locations CRUD, seed, promo videos."""
from fastapi import APIRouter, HTTPException, Depends
from database import db, get_current_admin
from models import (
    Location, LocationCreate, LocationUpdate,
    PromoVideo, PromoVideoCreate, PromoVideoUpdate
)
from timezone_utils import get_location_tz_name
from typing import List
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api")


# ==================== HELPER ====================

def ensure_suite_placeholder(address: str):
    return address


def normalize_location_response(location: dict):
    if not location:
        return location
    address = location.get("address")
    if address:
        location["address"] = ensure_suite_placeholder(address)
    slug = location.get("slug", "")
    if slug and "timezone" not in location:
        location["timezone"] = get_location_tz_name(slug)
    return location


# ==================== PUBLIC LOCATIONS ====================

@router.get("/locations")
async def get_public_locations():
    """Get all active locations for public display"""
    locations = await db.locations.find(
        {"is_active": True},
        {"_id": 0}
    ).sort("display_order", 1).to_list(100)
    locations = [normalize_location_response(loc) for loc in locations]
    return locations


@router.get("/locations/{slug}")
async def get_location_by_slug(slug: str):
    """Get a single location by slug"""
    location = await db.locations.find_one(
        {"slug": slug},
        {"_id": 0}
    )
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    location = normalize_location_response(location)
    return location


# ==================== ADMIN LOCATIONS ====================

@router.get("/admin/locations")
async def get_all_locations(admin: str = Depends(get_current_admin)):
    """Get all locations (including inactive) for admin"""
    locations = await db.locations.find({}, {"_id": 0}).sort("display_order", 1).to_list(100)
    locations = [normalize_location_response(loc) for loc in locations]
    return locations


@router.post("/admin/locations")
async def create_location(location: LocationCreate, admin: str = Depends(get_current_admin)):
    """Create a new location"""
    existing = await db.locations.find_one({"slug": location.slug})
    if existing:
        raise HTTPException(status_code=400, detail="A location with this slug already exists")

    location_data = Location(
        slug=location.slug,
        name=location.name,
        address=location.address,
        phone=location.phone,
        reservation_phone=location.reservation_phone,
        coordinates=location.coordinates,
        image=location.image,
        hours=location.hours,
        online_ordering=location.online_ordering,
        reservations=location.reservations,
        delivery=location.delivery,
        social_media=location.social_media,
        weekly_specials=location.weekly_specials,
        display_order=location.display_order
    )

    await db.locations.insert_one(location_data.model_dump())
    return {"id": location_data.id, "message": "Location created successfully"}


@router.put("/admin/locations/{location_id}")
async def update_location(location_id: str, location: LocationUpdate, admin: str = Depends(get_current_admin)):
    """Update a location"""
    existing = await db.locations.find_one({"id": location_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Location not found")

    if location.slug and location.slug != existing.get("slug"):
        slug_exists = await db.locations.find_one({"slug": location.slug, "id": {"$ne": location_id}})
        if slug_exists:
            raise HTTPException(status_code=400, detail="A location with this slug already exists")

    update_data = {k: v for k, v in location.model_dump().items() if v is not None}

    if "coordinates" in update_data and update_data["coordinates"]:
        update_data["coordinates"] = update_data["coordinates"].model_dump() if hasattr(update_data["coordinates"], 'model_dump') else update_data["coordinates"]
    if "hours" in update_data and update_data["hours"]:
        update_data["hours"] = update_data["hours"].model_dump() if hasattr(update_data["hours"], 'model_dump') else update_data["hours"]
    if "social_media" in update_data and update_data["social_media"]:
        update_data["social_media"] = update_data["social_media"].model_dump() if hasattr(update_data["social_media"], 'model_dump') else update_data["social_media"]
    if "weekly_specials" in update_data:
        update_data["weekly_specials"] = [
            ws.model_dump() if hasattr(ws, 'model_dump') else ws
            for ws in update_data["weekly_specials"]
        ]

    update_data["updated_at"] = datetime.now(timezone.utc)

    await db.locations.update_one({"id": location_id}, {"$set": update_data})
    return {"message": "Location updated successfully"}


@router.delete("/admin/locations/{location_id}")
async def delete_location(location_id: str, admin: str = Depends(get_current_admin)):
    """Delete a location"""
    result = await db.locations.delete_one({"id": location_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")
    return {"message": "Location deleted successfully"}


@router.post("/admin/locations/reorder")
async def reorder_locations(order: List[dict], admin: str = Depends(get_current_admin)):
    """Reorder locations via drag-and-drop"""
    for item in order:
        await db.locations.update_one(
            {"id": item["id"]},
            {"$set": {"display_order": item["display_order"], "updated_at": datetime.now(timezone.utc)}}
        )
    return {"message": "Locations reordered successfully"}


@router.post("/admin/locations/seed")
async def seed_locations(admin: str = Depends(get_current_admin)):
    """Seed the database with initial location data (run once)"""
    existing_count = await db.locations.count_documents({})
    if existing_count > 0:
        return {"message": f"Database already has {existing_count} locations. Skipping seed."}

    initial_locations = [
        {
            "id": str(uuid.uuid4()),
            "slug": "edgewood-atlanta",
            "name": "Fin & Feathers - Edgewood (Atlanta)",
            "address": "345 Edgewood Ave SE, Atlanta, GA 30312",
            "phone": "(404) 855-5524",
            "reservation_phone": "(404) 692-1252",
            "coordinates": {"lat": 33.7547, "lng": -84.3733},
            "image": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6657.jpg",
            "hours": {
                "monday": "11am-1am", "tuesday": "11am-1am", "wednesday": "11am-1am",
                "thursday": "11am-1am", "friday": "11am-3am", "saturday": "10am-3am", "sunday": "10am-12am"
            },
            "online_ordering": "https://order.toasttab.com/online/fin-feathers-edgewood-2nd-location-345-edgewood-ave-se",
            "reservations": "sms:14046921252?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested",
            "delivery": "https://order.toasttab.com/online/fin-feathers-edgewood-2nd-location-345-edgewood-ave-se",
            "social_media": {"instagram": "https://instagram.com/finandfeathers_edgewood", "facebook": "https://facebook.com/finandfeathers", "twitter": "https://twitter.com/finandfeathers"},
            "weekly_specials": [
                {"day": "Monday", "special": "$5 Wings & $5 Margaritas"},
                {"day": "Tuesday", "special": "Taco Tuesday - $2 Tacos"},
                {"day": "Wednesday", "special": "Wine Down Wednesday - Half Price Wine"},
                {"day": "Thursday", "special": "Thirsty Thursday - $10 Long Islands"},
                {"day": "Friday", "special": "Fresh Fish Friday - Market Price"},
                {"day": "Saturday", "special": "Brunch & Bottomless Mimosas"},
                {"day": "Sunday", "special": "Sunday Funday - Kids Eat Free"}
            ],
            "is_active": True, "display_order": 0, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "midtown-atlanta",
            "name": "Fin & Feathers - Midtown (Atlanta)",
            "address": "1136 Crescent Ave NE, Atlanta, GA 30309",
            "phone": "(404) 549-7555",
            "reservation_phone": "(678) 421-4083",
            "coordinates": {"lat": 33.7812, "lng": -84.3838},
            "image": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6656.jpg",
            "hours": {
                "monday": "11am-10pm", "tuesday": "11am-10pm", "wednesday": "11am-10pm",
                "thursday": "11am-11pm", "friday": "11am-12am", "saturday": "10am-12am", "sunday": "10am-10pm"
            },
            "online_ordering": "https://www.toasttab.com/local/order/fin-feathers-midtown-1136-crescent-ave-ne/r-94f8c8b0-51bd-4f67-a787-68f7f39f0eb9",
            "reservations": "sms:16784214083?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested",
            "delivery": "https://www.toasttab.com/local/order/fin-feathers-midtown-1136-crescent-ave-ne/r-94f8c8b0-51bd-4f67-a787-68f7f39f0eb9",
            "social_media": {"instagram": "https://instagram.com/finandfeathers_midtown", "facebook": "https://facebook.com/finandfeathers", "twitter": "https://twitter.com/finandfeathers"},
            "weekly_specials": [
                {"day": "Monday", "special": "Margarita Madness - $7 Margaritas"},
                {"day": "Tuesday", "special": "$1 Oysters All Day"},
                {"day": "Wednesday", "special": "Wings & Things - $6 Wings"},
                {"day": "Thursday", "special": "Steak Night - $25 Ribeye"},
                {"day": "Friday", "special": "Lobster Special - Market Price"},
                {"day": "Saturday", "special": "Weekend Brunch 10am-3pm"},
                {"day": "Sunday", "special": "Live Music & Happy Hour"}
            ],
            "is_active": True, "display_order": 1, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "douglasville",
            "name": "Fin & Feathers - Douglasville",
            "address": "7430 Douglas Blvd, Douglasville, GA 30135",
            "phone": "(678) 653-9577",
            "reservation_phone": "(404) 458-1958",
            "coordinates": {"lat": 33.7515, "lng": -84.7477},
            "image": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/fin_and_feathers_shrimp_and_grits_2-e1666107985403.jpg",
            "hours": {
                "monday": "12pm-10pm", "tuesday": "12pm-10pm", "wednesday": "12pm-10pm",
                "thursday": "12pm-11pm", "friday": "12pm-12am", "saturday": "11am-12am", "sunday": "11am-9pm"
            },
            "online_ordering": "https://order.toasttab.com/online/fins-feathers-douglasville-7430-douglas-blvd-zmrgr",
            "reservations": "sms:14044581958?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested",
            "delivery": "https://order.toasttab.com/online/fins-feathers-douglasville-7430-douglas-blvd-zmrgr",
            "social_media": {"instagram": "https://instagram.com/finandfeathers_douglasville", "facebook": "https://facebook.com/finandfeathers", "twitter": "https://twitter.com/finandfeathers"},
            "weekly_specials": [
                {"day": "Monday", "special": "Family Night - Kids Eat Free"},
                {"day": "Tuesday", "special": "Taco & Tequila Tuesday"},
                {"day": "Wednesday", "special": "Wine & Dine - 50% Off Bottles"},
                {"day": "Thursday", "special": "Craft Beer Night"},
                {"day": "Friday", "special": "Seafood Boil Special"},
                {"day": "Saturday", "special": "Brunch Party 11am-3pm"},
                {"day": "Sunday", "special": "Sunday Roast Special"}
            ],
            "is_active": True, "display_order": 2, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "riverdale",
            "name": "Fin & Feathers - Riverdale",
            "address": "6340 Hwy 85, Riverdale, GA 30274",
            "phone": "(770) 703-2282",
            "reservation_phone": "(678) 304-8191",
            "coordinates": {"lat": 33.5726, "lng": -84.4132},
            "image": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/augies_cafe_smb_parent__atlanta__new_business__86_hero-e1666179925108.jpg",
            "hours": {
                "monday": "11am-10pm", "tuesday": "11am-10pm", "wednesday": "11am-10pm",
                "thursday": "11am-11pm", "friday": "11am-12am", "saturday": "10am-12am", "sunday": "10am-10pm"
            },
            "online_ordering": "https://www.toasttab.com/local/order/fin-feathers-riverdale-6340-ga-85",
            "reservations": "sms:16783048191?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested",
            "delivery": "https://www.toasttab.com/local/order/fin-feathers-riverdale-6340-ga-85",
            "social_media": {"instagram": "https://instagram.com/finandfeathers_riverdale", "facebook": "https://facebook.com/finandfeathers", "twitter": "https://twitter.com/finandfeathers"},
            "weekly_specials": [
                {"day": "Monday", "special": "$5 Daily Specials All Day"},
                {"day": "Tuesday", "special": "Two for Tuesday - BOGO Entrees"},
                {"day": "Wednesday", "special": "Wine Wednesday - $5 Glasses"},
                {"day": "Thursday", "special": "Throwback Thursday - Classic Menu"},
                {"day": "Friday", "special": "Fried Fish Friday"},
                {"day": "Saturday", "special": "All Day Brunch & Cocktails"},
                {"day": "Sunday", "special": "Southern Sunday Dinner"}
            ],
            "is_active": True, "display_order": 3, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "valdosta",
            "name": "Fin & Feathers - Valdosta",
            "address": "1700 Norman Dr, Valdosta, GA 31601",
            "phone": "(229) 474-4049",
            "reservation_phone": "(229) 231-4653",
            "coordinates": {"lat": 30.8327, "lng": -83.2785},
            "image": "https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Catfish-Grits-scaled.jpg",
            "hours": {
                "monday": "12pm-9pm", "tuesday": "12pm-9pm", "wednesday": "12pm-9pm",
                "thursday": "12pm-10pm", "friday": "12pm-11pm", "saturday": "11am-11pm", "sunday": "11am-9pm"
            },
            "online_ordering": "https://www.toasttab.com/local/order/fin-feathers-valdosta-1700-norman-drive/r-2f4566e8-677d-42d2-93d3-9aa6d2687fcd",
            "reservations": "sms:2292314653?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested",
            "delivery": "https://www.toasttab.com/local/order/fin-feathers-valdosta-1700-norman-drive/r-2f4566e8-677d-42d2-93d3-9aa6d2687fcd",
            "social_media": {"instagram": "https://instagram.com/finandfeathers_valdosta", "facebook": "https://facebook.com/finandfeathers", "twitter": "https://twitter.com/finandfeathers"},
            "weekly_specials": [
                {"day": "Monday", "special": "Manic Monday - $8 Burgers"},
                {"day": "Tuesday", "special": "Taco Tuesday Fiesta"},
                {"day": "Wednesday", "special": "Wine Down Wednesday"},
                {"day": "Thursday", "special": "Thirsty Thursday - $3 Drafts"},
                {"day": "Friday", "special": "Fresh Catch Friday"},
                {"day": "Saturday", "special": "Brunch & Bubbles"},
                {"day": "Sunday", "special": "Family Sunday Feast"}
            ],
            "is_active": True, "display_order": 4, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "albany",
            "name": "Fin & Feathers - Albany",
            "address": "2800 Old Dawson Rd Unit 5, Albany, GA 31707",
            "phone": "(229) 231-2101",
            "reservation_phone": "(229) 231-2101",
            "coordinates": {"lat": 31.5785, "lng": -84.1558},
            "image": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/1ddbe3ac887b406aa6277a86d551faae-1024x1024.jpeg",
            "hours": {
                "monday": "11am-9pm", "tuesday": "11am-9pm", "wednesday": "11am-9pm",
                "thursday": "11am-10pm", "friday": "11am-11pm", "saturday": "10am-11pm", "sunday": "10am-9pm"
            },
            "online_ordering": "https://www.toasttab.com/local/order/fin-and-feathers-albany-llc",
            "reservations": "sms:12292312101?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested",
            "delivery": "https://www.toasttab.com/local/order/fin-and-feathers-albany-llc",
            "social_media": {"instagram": "https://instagram.com/finandfeathers_albany", "facebook": "https://facebook.com/finandfeathers", "twitter": "https://twitter.com/finandfeathers"},
            "weekly_specials": [
                {"day": "Monday", "special": "Monday Blues Buster - Live Music"},
                {"day": "Tuesday", "special": "$2 Taco & $2 Tecate"},
                {"day": "Wednesday", "special": "Wing Wednesday - 50¢ Wings"},
                {"day": "Thursday", "special": "Thirsty Thursday Cocktails"},
                {"day": "Friday", "special": "Fish Fry Friday"},
                {"day": "Saturday", "special": "Weekend Brunch Extravaganza"},
                {"day": "Sunday", "special": "Sunday Funday - All Day Happy Hour"}
            ],
            "is_active": True, "display_order": 5, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "stone-mountain",
            "name": "Fin & Feathers - Stone Mountain",
            "address": "5370 Stone Mountain Hwy, Stone Mountain, GA 30087",
            "phone": "(470) 334-8255",
            "reservation_phone": "(470) 334-8255",
            "coordinates": {"lat": 33.8081, "lng": -84.1458},
            "image": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC06011_edited.jpg",
            "hours": {
                "monday": "11am-10pm", "tuesday": "11am-10pm", "wednesday": "11am-10pm",
                "thursday": "11am-11pm", "friday": "11am-12am", "saturday": "10am-12am", "sunday": "10am-10pm"
            },
            "online_ordering": "https://www.toasttab.com/local/order/fin-feathers-stone-mountain-5469-memorial-drive",
            "reservations": "sms:14703348255?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested",
            "delivery": "https://www.toasttab.com/local/order/fin-feathers-stone-mountain-5469-memorial-drive",
            "social_media": {"instagram": "https://instagram.com/finandfeathers_stonemountain", "facebook": "https://facebook.com/finandfeathers", "twitter": "https://twitter.com/finandfeathers"},
            "weekly_specials": [
                {"day": "Monday", "special": "$5 Wings & $5 Margaritas"},
                {"day": "Tuesday", "special": "Taco Tuesday - $2 Tacos"},
                {"day": "Wednesday", "special": "Wine Down Wednesday - Half Price Wine"},
                {"day": "Thursday", "special": "Thirsty Thursday - $10 Long Islands"},
                {"day": "Friday", "special": "Fresh Fish Friday - Market Price"},
                {"day": "Saturday", "special": "Brunch & Bottomless Mimosas"},
                {"day": "Sunday", "special": "Sunday Funday - Kids Eat Free"}
            ],
            "is_active": True, "display_order": 6, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "las-vegas",
            "name": "Fin & Feathers - Las Vegas",
            "address": "1229 S. Casino Center Blvd, Las Vegas, NV 89104",
            "phone": "(725) 204-9655",
            "reservation_phone": "(702) 546-6394",
            "coordinates": {"lat": 36.1622, "lng": -115.1505},
            "image": "https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Malibu-Ribeye-scaled.jpg",
            "hours": {
                "monday": "11am-12am", "tuesday": "11am-12am", "wednesday": "11am-12am",
                "thursday": "11am-12am", "friday": "11am-2am", "saturday": "10am-2am", "sunday": "10am-12am"
            },
            "online_ordering": "https://www.toasttab.com/local/order/fin-feathers-las-vegas-1229-s-casino-center-blvd",
            "reservations": "sms:17025466394?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested",
            "delivery": "https://www.toasttab.com/local/order/fin-feathers-las-vegas-1229-s-casino-center-blvd",
            "social_media": {"instagram": "https://instagram.com/finandfeathersrestaurants", "facebook": "https://facebook.com/finandfeathersrestaurants", "twitter": "https://twitter.com/finandfeathers"},
            "weekly_specials": [
                {"day": "Monday", "special": "Monday Night Madness - $20 All You Can Eat Wings"},
                {"day": "Tuesday", "special": "Taco Tuesday Vegas Style"},
                {"day": "Wednesday", "special": "Wine & Dine - Premium Bottles $30"},
                {"day": "Thursday", "special": "Vegas Thursday - Champagne Brunch"},
                {"day": "Friday", "special": "High Roller Friday - Lobster & Steak"},
                {"day": "Saturday", "special": "Saturday Night Party - DJ & Specials"},
                {"day": "Sunday", "special": "Recovery Sunday - Hangover Brunch"}
            ],
            "is_active": True, "display_order": 7, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
        }
    ]

    await db.locations.insert_many(initial_locations)
    return {"message": f"Successfully seeded {len(initial_locations)} locations"}


# ==================== PROMO VIDEOS ====================

@router.get("/promo-videos")
async def get_promo_videos():
    """Get all active promo videos for the carousel"""
    videos = await db.promo_videos.find(
        {"is_active": True},
        {"_id": 0}
    ).sort("display_order", 1).to_list(100)
    return videos


@router.get("/promo-videos/by-day/{day_of_week}")
async def get_promo_videos_by_day(day_of_week: int):
    """Get videos for a specific day (0=Sunday to 6=Saturday)"""
    day_videos = await db.promo_videos.find(
        {"is_active": True, "day_of_week": day_of_week, "is_common": False},
        {"_id": 0}
    ).sort("display_order", 1).to_list(50)

    common_videos = await db.promo_videos.find(
        {"is_active": True, "is_common": True},
        {"_id": 0}
    ).sort("display_order", 1).to_list(50)

    return day_videos + common_videos


@router.get("/admin/promo-videos")
async def admin_get_promo_videos(admin: str = Depends(get_current_admin)):
    """Get all promo videos for admin"""
    videos = await db.promo_videos.find({}, {"_id": 0}).sort("display_order", 1).to_list(100)
    return videos


@router.post("/admin/promo-videos")
async def admin_create_promo_video(video: PromoVideoCreate, admin: str = Depends(get_current_admin)):
    """Create a new promo video"""
    video_data = PromoVideo(
        title=video.title,
        url=video.url,
        day_of_week=video.day_of_week,
        is_common=video.is_common,
        display_order=video.display_order
    )
    await db.promo_videos.insert_one(video_data.model_dump())
    return {"id": video_data.id, "message": "Promo video created successfully"}


@router.put("/admin/promo-videos/{video_id}")
async def admin_update_promo_video(video_id: str, video: PromoVideoUpdate, admin: str = Depends(get_current_admin)):
    """Update a promo video"""
    existing = await db.promo_videos.find_one({"id": video_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Promo video not found")

    update_data = {k: v for k, v in video.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)

    await db.promo_videos.update_one({"id": video_id}, {"$set": update_data})
    return {"message": "Promo video updated successfully"}


@router.delete("/admin/promo-videos/{video_id}")
async def admin_delete_promo_video(video_id: str, admin: str = Depends(get_current_admin)):
    """Delete a promo video"""
    result = await db.promo_videos.delete_one({"id": video_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Promo video not found")
    return {"message": "Promo video deleted successfully"}


@router.post("/admin/promo-videos/seed")
async def seed_promo_videos(admin: str = Depends(get_current_admin)):
    """Seed the database with initial promo videos"""
    existing_count = await db.promo_videos.count_documents({})
    if existing_count > 0:
        return {"message": f"Database already has {existing_count} promo videos. Skipping seed."}

    initial_videos = [
        {"id": str(uuid.uuid4()), "title": "M-F $5 Specials", "url": "https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/gguqbaki_m-f%205%20specials.mp4", "day_of_week": -1, "is_common": True, "display_order": 100, "is_active": True, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "title": "Hookah Lounge", "url": "https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/5lk2zci7_Hookah.mp4", "day_of_week": -1, "is_common": True, "display_order": 101, "is_active": True, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "title": "Monday Special", "url": "https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/72qd1ab8_Monday.mp4", "day_of_week": 1, "is_common": False, "display_order": 0, "is_active": True, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "title": "Tuesday Special", "url": "https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/wvi3jxji_Tuesday.mp4", "day_of_week": 2, "is_common": False, "display_order": 0, "is_active": True, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "title": "Wednesday Special", "url": "https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/d6juf8fz_Wednesday.mp4", "day_of_week": 3, "is_common": False, "display_order": 0, "is_active": True, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "title": "Wednesday Special 2", "url": "https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/jzr5vp5d_Wednesday%20%282%29.mp4", "day_of_week": 3, "is_common": False, "display_order": 1, "is_active": True, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "title": "Thursday Special", "url": "https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/w9nk5dsp_Thursday.mp4", "day_of_week": 4, "is_common": False, "display_order": 0, "is_active": True, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "title": "Friday Special", "url": "https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/s5myd3mu_Friday.mp4", "day_of_week": 5, "is_common": False, "display_order": 0, "is_active": True, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "title": "Saturday Special", "url": "https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/lrdt4s1h_Saturday.mp4", "day_of_week": 6, "is_common": False, "display_order": 0, "is_active": True, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
    ]

    await db.promo_videos.insert_many(initial_videos)
    return {"message": f"Successfully seeded {len(initial_videos)} promo videos"}


@router.post("/admin/locations/{slug}/sync-specials-to-all")
async def sync_weekly_specials_to_all(slug: str, admin: str = Depends(get_current_admin)):
    """Copy the given location's `weekly_specials` array to every other location.
    Idempotent — writes the same array everywhere, so re-running is a no-op.
    """
    source = await db.locations.find_one({"slug": slug}, {"_id": 0, "weekly_specials": 1, "name": 1})
    if not source:
        raise HTTPException(status_code=404, detail=f"Location '{slug}' not found")
    specials = source.get("weekly_specials") or []
    res = await db.locations.update_many(
        {"slug": {"$ne": slug}},
        {"$set": {"weekly_specials": specials, "updated_at": datetime.now(timezone.utc)}},
    )
    return {
        "source_location": source.get("name"),
        "source_slug": slug,
        "specials_count": len(specials),
        "other_locations_updated": res.modified_count,
    }
