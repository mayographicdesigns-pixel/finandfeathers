"""DJ, Karaoke, and Song Request router."""
from fastapi import APIRouter, HTTPException, Request, Depends
from database import db, get_current_admin
from datetime import datetime, timezone
from typing import Optional
import os
import uuid
import logging
from models import (
    DJTip, DJTipCreate, DJTipResponse,
    DJProfile, DJProfileCreate, DJProfileUpdate, DJProfileResponse,
    DJSchedule, DJScheduleCreate, DJScheduleUpdate, DJScheduleResponse,
    SongRequestCreate, SongRequestResponse,
    DrinkOrder, DrinkOrderCreate, DrinkOrderResponse,
)
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest

router = APIRouter(prefix="/api")


# =====================================================
# OLD SOCIAL DJ TIPS (check-in based)
# =====================================================

@router.post("/social/dj-tip", response_model=DJTipResponse)
async def send_dj_tip(tip: DJTipCreate):
    checkin = await db.checkins.find_one({"id": tip.checkin_id})
    if not checkin:
        raise HTTPException(status_code=400, detail="You must be checked in to tip the DJ")
    if tip.amount < 1:
        raise HTTPException(status_code=400, detail="Minimum tip is $1")
    tip_dict = tip.dict()
    tip_dict["id"] = str(uuid.uuid4())
    tip_dict["created_at"] = datetime.now(timezone.utc)
    await db.dj_tips.insert_one(tip_dict)
    return DJTipResponse(
        id=tip_dict["id"], location_slug=tip_dict["location_slug"],
        tipper_name=tip_dict["tipper_name"], tipper_emoji=tip_dict["tipper_emoji"],
        amount=tip_dict["amount"], message=tip_dict.get("message"),
        song_request=tip_dict.get("song_request"), created_at=tip_dict["created_at"]
    )


@router.get("/social/dj-tips/{location_slug}")
async def get_dj_tips(location_slug: str):
    tips = await db.dj_tips.find({"location_slug": location_slug}, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    result = []
    for t in tips:
        t["payment_method"] = t.get("payment_method", "cash_app")
        result.append(DJTipResponse(**t))
    return result


@router.get("/social/dj-tips/{location_slug}/total")
async def get_dj_tips_total(location_slug: str):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    pipeline = [
        {"$match": {"location_slug": location_slug, "created_at": {"$gte": today_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]
    result = await db.dj_tips.aggregate(pipeline).to_list(1)
    if result:
        return {"total": result[0]["total"], "count": result[0]["count"]}
    return {"total": 0, "count": 0}


# =====================================================
# SONG REQUEST & KARAOKE
# =====================================================

@router.post("/social/song-request", response_model=SongRequestResponse)
async def submit_song_request(request: SongRequestCreate):
    request_dict = request.dict()
    request_dict["id"] = str(uuid.uuid4())
    request_dict["status"] = "pending"
    request_dict["created_at"] = datetime.now(timezone.utc)
    await db.song_requests.insert_one(request_dict)
    return SongRequestResponse(**request_dict)


@router.get("/social/song-requests/{location_slug}")
async def get_song_requests(location_slug: str, request_type: Optional[str] = None):
    query = {"location_slug": location_slug, "status": "pending"}
    if request_type:
        query["request_type"] = request_type
    requests = await db.song_requests.find(query, {"_id": 0}).sort("created_at", 1).to_list(50)
    return [SongRequestResponse(**r) for r in requests]


@router.put("/social/song-request/{request_id}/status")
async def update_song_request_status(request_id: str, status: str):
    if status not in ["pending", "played", "skipped"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.song_requests.update_one({"id": request_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"message": f"Request status updated to {status}"}


@router.post("/karaoke/toggle/{location_slug}")
async def toggle_karaoke(location_slug: str, body: dict):
    active = body.get("active", False)
    dj_id = body.get("dj_id", "")
    if active:
        await db.karaoke_sessions.update_one(
            {"location_slug": location_slug},
            {"$set": {"location_slug": location_slug, "active": True, "dj_id": dj_id, "started_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
    else:
        await db.karaoke_sessions.update_one(
            {"location_slug": location_slug},
            {"$set": {"active": False, "ended_at": datetime.now(timezone.utc).isoformat()}}
        )
        await db.song_requests.update_many(
            {"location_slug": location_slug, "status": "pending", "request_type": "karaoke"},
            {"$set": {"status": "skipped"}}
        )
    return {"active": active, "location_slug": location_slug}


@router.get("/karaoke/status/{location_slug}")
async def get_karaoke_status(location_slug: str):
    session = await db.karaoke_sessions.find_one({"location_slug": location_slug}, {"_id": 0})
    if session and session.get("active"):
        return {"active": True, "dj_id": session.get("dj_id", ""), "started_at": session.get("started_at")}
    return {"active": False}


@router.get("/karaoke/queue/{location_slug}")
async def get_karaoke_queue(location_slug: str):
    pending = await db.song_requests.find(
        {"location_slug": location_slug, "request_type": "karaoke", "status": "pending"}, {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    played = await db.song_requests.find(
        {"location_slug": location_slug, "request_type": "karaoke", "status": "played"}, {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    return {"pending": pending, "played": played}


# =====================================================
# DJ PROFILES
# =====================================================

@router.post("/dj/login")
async def dj_login(body: dict):
    name = body.get("name", "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    profile = await db.dj_profiles.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}, "is_active": True}, {"_id": 0})
    if not profile:
        profile = {
            "id": str(uuid.uuid4()), "name": name, "stage_name": name, "avatar_emoji": "🎧",
            "is_active": True, "current_location": None, "checked_in_at": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.dj_profiles.insert_one(profile)
        del profile["_id"]
    return {"id": profile["id"], "name": profile["name"], "stage_name": profile.get("stage_name"), "current_location": profile.get("current_location")}


@router.post("/dj/register", response_model=DJProfileResponse)
async def register_dj(profile: DJProfileCreate):
    profile_dict = profile.dict()
    profile_dict["id"] = str(uuid.uuid4())
    profile_dict["is_active"] = True
    profile_dict["current_location"] = None
    profile_dict["checked_in_at"] = None
    profile_dict["created_at"] = datetime.now(timezone.utc)
    await db.dj_profiles.insert_one(profile_dict)
    return DJProfileResponse(**profile_dict)


@router.get("/dj/profiles")
async def get_all_dj_profiles():
    profiles = await db.dj_profiles.find({"is_active": True}, {"_id": 0}).to_list(100)
    return [DJProfileResponse(**p) for p in profiles]


@router.get("/dj/profile/{dj_id}", response_model=DJProfileResponse)
async def get_dj_profile(dj_id: str):
    profile = await db.dj_profiles.find_one({"id": dj_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="DJ profile not found")
    return DJProfileResponse(**profile)


@router.put("/dj/profile/{dj_id}", response_model=DJProfileResponse)
async def update_dj_profile(dj_id: str, update: DJProfileUpdate):
    profile = await db.dj_profiles.find_one({"id": dj_id})
    if not profile:
        raise HTTPException(status_code=404, detail="DJ profile not found")
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    if update_dict:
        await db.dj_profiles.update_one({"id": dj_id}, {"$set": update_dict})
    updated = await db.dj_profiles.find_one({"id": dj_id}, {"_id": 0})
    return DJProfileResponse(**updated)


@router.post("/dj/checkin/{dj_id}")
async def dj_checkin(dj_id: str, location_slug: str):
    profile = await db.dj_profiles.find_one({"id": dj_id})
    if not profile:
        raise HTTPException(status_code=404, detail="DJ profile not found")
    await db.dj_profiles.update_many({"current_location": location_slug}, {"$set": {"current_location": None, "checked_in_at": None}})
    await db.dj_profiles.update_one({"id": dj_id}, {"$set": {"current_location": location_slug, "checked_in_at": datetime.now(timezone.utc)}})
    return {"message": f"DJ checked in at {location_slug}"}


@router.post("/dj/checkout/{dj_id}")
async def dj_checkout(dj_id: str):
    await db.dj_profiles.update_one({"id": dj_id}, {"$set": {"current_location": None, "checked_in_at": None}})
    return {"message": "DJ checked out"}


@router.get("/dj/at-location/{location_slug}")
async def get_dj_at_location(location_slug: str):
    profile = await db.dj_profiles.find_one({"current_location": location_slug, "is_active": True}, {"_id": 0})
    if not profile:
        return {"checked_in": False, "dj_id": None, "dj_name": None}
    return {
        "checked_in": True, "dj_id": profile.get("id"), "dj_name": profile.get("name"),
        "stage_name": profile.get("stage_name"), "avatar_emoji": profile.get("avatar_emoji", "🎧"),
        "photo_url": profile.get("photo_url"), "cash_app_username": profile.get("cash_app_username"),
        "venmo_username": profile.get("venmo_username"), "zelle_info": profile.get("zelle_info")
    }


# =====================================================
# DJ TIPPING (new — no check-in required)
# =====================================================

@router.post("/dj/tip/stripe-checkout")
async def create_dj_tip_stripe_checkout(request: Request, body: dict):
    location_slug = body.get("location_slug")
    amount = body.get("amount")
    tipper_name = body.get("tipper_name", "Anonymous")
    song_request_id = body.get("song_request_id")
    origin_url = body.get("origin_url", str(request.base_url).rstrip('/'))
    if not location_slug or not amount or amount < 1:
        raise HTTPException(status_code=400, detail="Location and amount (min $1) required")
    profile = await db.dj_profiles.find_one({"current_location": location_slug, "is_active": True}, {"_id": 0})
    dj_name = profile.get("name", "the DJ") if profile else "the DJ"
    transaction_id = str(uuid.uuid4())
    transaction = {
        "id": transaction_id, "type": "dj_tip", "payment_provider": "stripe",
        "location_slug": location_slug, "dj_id": profile.get("id") if profile else None,
        "dj_name": dj_name, "tipper_name": tipper_name, "amount": float(amount),
        "currency": "usd", "song_request_id": song_request_id, "payment_status": "pending",
        "stripe_session_id": None, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
    }
    await db.payment_transactions.insert_one(transaction)
    try:
        stripe_api_key = os.environ.get("STRIPE_API_KEY")
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        checkout_request = CheckoutSessionRequest(
            amount=float(amount), currency="usd",
            success_url=f"{origin_url}/checkin?tip=success&transaction_id={transaction_id}",
            cancel_url=f"{origin_url}/checkin?tip=cancelled",
            metadata={"transaction_id": transaction_id, "type": "dj_tip", "dj_name": dj_name, "location_slug": location_slug, "tipper_name": tipper_name}
        )
        session = await stripe_checkout.create_checkout_session(checkout_request)
        await db.payment_transactions.update_one({"id": transaction_id}, {"$set": {"stripe_session_id": session.session_id, "updated_at": datetime.now(timezone.utc)}})
        return {"checkout_url": session.url, "session_id": session.session_id, "transaction_id": transaction_id}
    except Exception as e:
        logging.error(f"Stripe DJ tip checkout error: {e}")
        await db.payment_transactions.delete_one({"id": transaction_id})
        raise HTTPException(status_code=500, detail=f"Failed to create tip checkout: {str(e)}")


@router.post("/dj/tip/record")
async def record_dj_tip(body: dict):
    location_slug = body.get("location_slug")
    if not location_slug:
        raise HTTPException(status_code=400, detail="Location is required")
    profile = await db.dj_profiles.find_one({"current_location": location_slug, "is_active": True}, {"_id": 0})
    tip_record = {
        "id": str(uuid.uuid4()), "type": "dj_tip", "location_slug": location_slug,
        "dj_id": profile.get("id") if profile else None, "dj_name": profile.get("name") if profile else "Unknown",
        "tipper_name": body.get("tipper_name", "Anonymous"), "amount": float(body.get("amount", 0)),
        "payment_method": body.get("payment_method", "external"), "song_request_id": body.get("song_request_id"),
        "payment_status": "completed", "created_at": datetime.now(timezone.utc)
    }
    await db.dj_tips.insert_one(tip_record)
    return {"message": "Tip recorded", "id": tip_record["id"]}


# =====================================================
# DJ SCHEDULES
# =====================================================

@router.get("/dj/weekly-schedule")
async def get_weekly_dj_schedule():
    return await db.dj_schedule.find({"is_active": True}, {"_id": 0}).to_list(200)


@router.get("/dj/weekly-schedule/{location_slug}")
async def get_weekly_dj_schedule_by_location(location_slug: str):
    return await db.dj_schedule.find({"location_slug": location_slug, "is_active": True}, {"_id": 0}).to_list(50)


@router.get("/dj/weekly-schedule/names/all")
async def get_all_scheduled_dj_names():
    entries = await db.dj_schedule.find({"is_active": True}, {"_id": 0, "dj_name": 1}).to_list(200)
    return sorted(set(e["dj_name"] for e in entries))


@router.get("/dj/schedules")
async def get_all_dj_schedules():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    schedules = await db.dj_schedules.find(
        {"is_active": True, "$or": [{"scheduled_date": {"$gte": today}}, {"is_recurring": True}]}, {"_id": 0}
    ).sort("scheduled_date", 1).to_list(100)
    return [DJScheduleResponse(**s) for s in schedules]


@router.get("/dj/schedules/location/{location_slug}")
async def get_dj_schedules_for_location(location_slug: str):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    schedules = await db.dj_schedules.find(
        {"location_slug": location_slug, "is_active": True, "$or": [{"scheduled_date": {"$gte": today}}, {"is_recurring": True}]}, {"_id": 0}
    ).sort("scheduled_date", 1).to_list(50)
    return [DJScheduleResponse(**s) for s in schedules]


# =====================================================
# ADMIN DJ ENDPOINTS
# =====================================================

@router.get("/admin/dj/schedules")
async def admin_get_all_dj_schedules(username: str = Depends(get_current_admin)):
    schedules = await db.dj_schedules.find({}, {"_id": 0}).sort("scheduled_date", -1).to_list(200)
    return [DJScheduleResponse(**s) for s in schedules]


@router.get("/admin/dj/profiles")
async def admin_get_all_dj_profiles(username: str = Depends(get_current_admin)):
    profiles = await db.dj_profiles.find({}, {"_id": 0}).to_list(100)
    return [DJProfileResponse(**p) for p in profiles]


@router.post("/admin/dj/profiles")
async def admin_create_dj_profile(profile: DJProfileCreate, username: str = Depends(get_current_admin)):
    profile_dict = profile.dict()
    dj_profile = DJProfile(**profile_dict)
    profile_data = dj_profile.dict()
    await db.dj_profiles.insert_one(profile_data)
    return DJProfileResponse(**profile_data)


@router.put("/admin/dj/profiles/{dj_id}")
async def admin_update_dj_profile(dj_id: str, update: DJProfileUpdate, username: str = Depends(get_current_admin)):
    profile = await db.dj_profiles.find_one({"id": dj_id})
    if not profile:
        raise HTTPException(status_code=404, detail="DJ profile not found")
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    if update_dict:
        await db.dj_profiles.update_one({"id": dj_id}, {"$set": update_dict})
    updated = await db.dj_profiles.find_one({"id": dj_id}, {"_id": 0})
    return DJProfileResponse(**updated)


@router.delete("/admin/dj/profiles/{dj_id}")
async def admin_delete_dj_profile(dj_id: str, username: str = Depends(get_current_admin)):
    result = await db.dj_profiles.delete_one({"id": dj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="DJ profile not found")
    await db.dj_schedules.delete_many({"dj_id": dj_id})
    return {"message": "DJ profile deleted"}


@router.post("/admin/dj/schedules")
async def admin_create_dj_schedule(schedule: DJScheduleCreate, username: str = Depends(get_current_admin)):
    dj = await db.dj_profiles.find_one({"id": schedule.dj_id}, {"_id": 0})
    if not dj:
        raise HTTPException(status_code=404, detail="DJ profile not found")
    location = await db.locations.find_one({"slug": schedule.location_slug}, {"_id": 0})
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    schedule_dict = schedule.dict()
    schedule_dict["dj_name"] = dj.get("name", "Unknown DJ")
    schedule_dict["dj_stage_name"] = dj.get("stage_name")
    schedule_dict["dj_photo_url"] = dj.get("photo_url")
    schedule_dict["location_name"] = location.get("name", "Unknown Location")
    if schedule.is_recurring and schedule.scheduled_date:
        date_obj = datetime.strptime(schedule.scheduled_date, "%Y-%m-%d")
        schedule_dict["day_of_week"] = date_obj.weekday()
    dj_schedule = DJSchedule(**schedule_dict)
    schedule_data = dj_schedule.dict()
    await db.dj_schedules.insert_one(schedule_data)
    return DJScheduleResponse(**schedule_data)


@router.put("/admin/dj/schedules/{schedule_id}")
async def admin_update_dj_schedule(schedule_id: str, update: DJScheduleUpdate, username: str = Depends(get_current_admin)):
    schedule = await db.dj_schedules.find_one({"id": schedule_id})
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    if "dj_id" in update_dict:
        dj = await db.dj_profiles.find_one({"id": update_dict["dj_id"]}, {"_id": 0})
        if dj:
            update_dict["dj_name"] = dj.get("name", "Unknown DJ")
            update_dict["dj_stage_name"] = dj.get("stage_name")
            update_dict["dj_photo_url"] = dj.get("photo_url")
    if "location_slug" in update_dict:
        location = await db.locations.find_one({"slug": update_dict["location_slug"]}, {"_id": 0})
        if location:
            update_dict["location_name"] = location.get("name", "Unknown Location")
    if update_dict:
        await db.dj_schedules.update_one({"id": schedule_id}, {"$set": update_dict})
    updated = await db.dj_schedules.find_one({"id": schedule_id}, {"_id": 0})
    return DJScheduleResponse(**updated)


@router.delete("/admin/dj/schedules/{schedule_id}")
async def admin_delete_dj_schedule(schedule_id: str, username: str = Depends(get_current_admin)):
    result = await db.dj_schedules.delete_one({"id": schedule_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Schedule deleted"}


# =====================================================
# SEND A DRINK
# =====================================================

@router.post("/social/drinks", response_model=DrinkOrderResponse)
async def send_drink(order: DrinkOrderCreate):
    from_checkin = await db.checkins.find_one({"id": order.from_checkin_id})
    to_checkin = await db.checkins.find_one({"id": order.to_checkin_id})
    if not from_checkin:
        raise HTTPException(status_code=400, detail="You must be checked in to send drinks")
    if not to_checkin:
        raise HTTPException(status_code=400, detail="Recipient is no longer checked in")
    order_dict = order.dict()
    order_dict["id"] = str(uuid.uuid4())
    order_dict["status"] = "pending"
    order_dict["created_at"] = datetime.now(timezone.utc)
    await db.drink_orders.insert_one(order_dict)
    return DrinkOrderResponse(**order_dict)
