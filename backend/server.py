"""Fin & Feathers API — Main application entry point.
All feature endpoints live in routes/. This file handles:
- App creation and CORS
- Media file serving (MongoDB + local fallback)
- Scheduler for automated cleanup
- Router registration
"""
from fastapi import FastAPI, APIRouter, Request
from fastapi.responses import Response
from pathlib import Path
from dotenv import load_dotenv
import base64
import os
import logging

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from starlette.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timezone, timedelta

from database import db, UPLOAD_DIR, ensure_default_admin_user, ensure_menu_items, ensure_merchandise, ensure_events, fix_daily_specials_hours

# Create the main app
app = FastAPI()

# Core API router for infrastructure endpoints only
api_router = APIRouter(prefix="/api")


# ==================== MEDIA SERVING ====================

@api_router.get("/media/{file_id}")
async def get_media_file(file_id: str):
    """Serve media files stored in MongoDB as Base64"""
    media = await db.media_files.find_one({"file_id": file_id}, {"_id": 0})
    if not media:
        raise Exception("File not found")
    file_data = base64.b64decode(media["data"])
    content_type = media.get("content_type", "image/jpeg")
    return Response(content=file_data, media_type=content_type)


@api_router.get("/uploads/{filename}")
async def get_upload_file(filename: str):
    """Serve uploaded files - checks local disk first, then MongoDB by filename"""
    try:
        file_path = UPLOAD_DIR / filename
        if file_path.exists():
            content_type = "image/jpeg"
            if filename.endswith(".png"):
                content_type = "image/png"
            elif filename.endswith(".gif"):
                content_type = "image/gif"
            elif filename.endswith(".webp"):
                content_type = "image/webp"
            with open(file_path, "rb") as f:
                return Response(content=f.read(), media_type=content_type)
    except Exception:
        pass

    media = await db.media_files.find_one({"filename": filename}, {"_id": 0})
    if media:
        file_data = base64.b64decode(media["data"])
        content_type = media.get("content_type", "image/jpeg")
        return Response(content=file_data, media_type=content_type)

    file_id = filename.split('.')[0] if '.' in filename else filename
    media = await db.media_files.find_one({"file_id": file_id}, {"_id": 0})
    if media:
        file_data = base64.b64decode(media["data"])
        content_type = media.get("content_type", "image/jpeg")
        return Response(content=file_data, media_type=content_type)

    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="File not found")


# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "Fin & Feathers API is running"}


# ==================== MIDDLEWARE ====================

@app.middleware("http")
async def add_cache_control_headers(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response


# ==================== LOGGING ====================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ==================== SCHEDULED TASKS ====================

scheduler = AsyncIOScheduler()


async def checkout_all_at_location(tz_name: str, location_slugs: list):
    """Check out everyone at locations in a specific timezone (runs at 4am local)."""
    try:
        result = await db.checkins.delete_many({
            "location_slug": {"$in": location_slugs}
        })
        logging.info(f"4am checkout ({tz_name}): Cleared {result.deleted_count} check-ins at {', '.join(location_slugs)}")
    except Exception as e:
        logging.error(f"4am checkout error ({tz_name}): {e}")


async def auto_disable_karaoke(tz_name: str, location_slugs: list):
    """Auto-disable karaoke mode at 3am local time for all locations in this timezone."""
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        # Turn off any active karaoke sessions
        result = await db.karaoke_sessions.update_many(
            {"location_slug": {"$in": location_slugs}, "active": True},
            {"$set": {"active": False, "ended_at": now_iso, "auto_disabled": True}}
        )
        # Mark all pending karaoke signups as skipped
        await db.song_requests.update_many(
            {"location_slug": {"$in": location_slugs}, "status": "pending", "request_type": "karaoke"},
            {"$set": {"status": "skipped"}}
        )
        if result.modified_count:
            logging.info(f"3am karaoke auto-off ({tz_name}): Disabled {result.modified_count} session(s) at {', '.join(location_slugs)}")
    except Exception as e:
        logging.error(f"3am karaoke auto-off error ({tz_name}): {e}")


async def auto_logout_djs_after_close():
    """Every 15 minutes, log out any DJ whose location closed 30+ mins ago in local time.
    Clears current_location, checked_in_at, and live_stream_url on dj_profiles so the
    location shows no live DJ until a new one checks in.

    Decision rule:
      logout if  (now_local >= last_close + 30 min)
             AND (dj.checked_in_at < last_close)

    This guarantees we never log out a DJ that checked in for the *current* business day
    (e.g. a private daytime event), while still clearing any stale session from a prior
    night — even if the scheduler missed a window due to downtime.
    """
    from timezone_utils import get_location_tz, get_most_recent_past_close
    from datetime import timezone as _tz
    try:
        live_djs = await db.dj_profiles.find(
            {"current_location": {"$ne": None}, "is_active": True},
            {"_id": 0, "id": 1, "name": 1, "stage_name": 1, "current_location": 1, "checked_in_at": 1}
        ).to_list(200)
        if not live_djs:
            return
        for dj in live_djs:
            slug = dj.get("current_location")
            if not slug:
                continue
            loc = await db.locations.find_one({"slug": slug}, {"_id": 0, "hours": 1})
            if not loc or not loc.get("hours"):
                continue
            tz = get_location_tz(slug)
            now_local = datetime.now(tz)
            last_close = get_most_recent_past_close(loc["hours"], now_local)
            if last_close is None:
                continue
            minutes_since_close = (now_local - last_close).total_seconds() / 60.0
            if minutes_since_close < 30:
                continue
            # Only logout if DJ checked in BEFORE the most recent close
            checked_in_at = dj.get("checked_in_at")
            if checked_in_at:
                # Normalize tz: stored as UTC datetime in mongo
                if checked_in_at.tzinfo is None:
                    checked_in_at = checked_in_at.replace(tzinfo=_tz.utc)
                if checked_in_at >= last_close.astimezone(_tz.utc):
                    # DJ checked in after the last close — they're working today's shift,
                    # don't auto-logout yet.
                    continue
            await db.dj_profiles.update_one(
                {"id": dj["id"]},
                {"$set": {"current_location": None, "checked_in_at": None, "live_stream_url": None}}
            )
            # Also auto-turn off karaoke at that location if still active
            await db.karaoke_sessions.update_many(
                {"location_slug": slug, "active": True},
                {"$set": {"active": False, "ended_at": datetime.now(timezone.utc).isoformat(), "auto_disabled": True}}
            )
            stage = dj.get("stage_name") or dj.get("name") or "DJ"
            logging.info(
                f"Auto DJ logout: {stage} cleared from {slug} ({minutes_since_close:.0f} min after close)"
            )
    except Exception as e:
        logging.error(f"auto_logout_djs_after_close error: {e}")


async def scheduled_cleanup_old_posts():
    """Scheduled task — posts are now kept permanently (Facebook-style feed)."""
    pass


# ==================== FEATURE ROUTERS ====================

from routes.wall import router as wall_router
from routes.careers import router as careers_router
from routes.dj import router as dj_router
from routes.auth import router as auth_router
from routes.events import router as events_router
from routes.payments import router as payments_router
from routes.stream import router as stream_router
from routes.menu import router as menu_router
from routes.content import router as content_router
from routes.social import router as social_router
from routes.user import router as user_router
from routes.locations import router as locations_router
from routes.merchandise import router as merchandise_router
from routes.admin import router as admin_router

app.include_router(wall_router)
app.include_router(careers_router)
app.include_router(dj_router)
app.include_router(auth_router)
app.include_router(events_router)
app.include_router(payments_router)
app.include_router(stream_router)
app.include_router(menu_router)
app.include_router(content_router)
app.include_router(social_router)
app.include_router(user_router)
app.include_router(locations_router)
app.include_router(merchandise_router)
app.include_router(admin_router)

# Include the core infrastructure router last
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_scheduler():
    """Start the background scheduler on app startup"""
    from timezone_utils import LOCATION_TIMEZONES

    # Post cleanup at 4am EST
    scheduler.add_job(
        scheduled_cleanup_old_posts,
        CronTrigger(hour=9, minute=0, timezone='UTC'),
        id='cleanup_old_posts',
        replace_existing=True
    )

    # Group locations by timezone for 4am local checkout
    tz_groups = {}
    for slug, tz_name in LOCATION_TIMEZONES.items():
        tz_groups.setdefault(tz_name, []).append(slug)

    for tz_name, slugs in tz_groups.items():
        scheduler.add_job(
            checkout_all_at_location,
            CronTrigger(hour=4, minute=0, timezone=tz_name),
            args=[tz_name, slugs],
            id=f'checkout_{tz_name.replace("/", "_")}',
            replace_existing=True
        )
        scheduler.add_job(
            auto_disable_karaoke,
            CronTrigger(hour=3, minute=0, timezone=tz_name),
            args=[tz_name, slugs],
            id=f'karaoke_off_{tz_name.replace("/", "_")}',
            replace_existing=True
        )
        logging.info(f"Scheduled 4am checkout + 3am karaoke-off for {tz_name}: {', '.join(slugs)}")

    # Auto-logout DJs 30 mins after each location's local closing time.
    # Runs every 15 minutes — each run inspects all live DJs and checks against their
    # location's hours individually, so it handles every timezone and every close time.
    scheduler.add_job(
        auto_logout_djs_after_close,
        CronTrigger(minute="*/15", timezone='UTC'),
        id='auto_logout_djs_after_close',
        replace_existing=True
    )
    logging.info("Scheduled DJ auto-logout (every 15 min, 30 min post-close per location)")

    scheduler.start()
    await ensure_default_admin_user()
    await ensure_menu_items()
    await ensure_merchandise()
    await ensure_events()
    await fix_daily_specials_hours()
    logging.info("Scheduler started")


@app.on_event("shutdown")
async def shutdown_db_client():
    scheduler.shutdown()
    from database import client
    client.close()
