"""LiveKit Cloud token endpoint for DJ live streaming.

Mints short-lived JWT access tokens for DJs (publishers) and viewers (subscribers).
Room name is the location slug — one active stream per Fin & Feathers location.
"""
import os
import re
import logging
from datetime import datetime, timezone, timedelta
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from livekit import api

from database import db

router = APIRouter(prefix="/api")


class LiveKitTokenRequest(BaseModel):
    location_slug: str = Field(..., min_length=1, max_length=64)
    identity: str = Field(..., min_length=1, max_length=128)
    role: Literal["dj", "viewer"]
    display_name: Optional[str] = None


@router.post("/livekit/token")
async def create_livekit_token(body: LiveKitTokenRequest):
    """Create a LiveKit access token for a DJ (publisher) or a viewer (subscriber)."""
    lk_url = os.environ.get("LIVEKIT_URL")
    lk_api_key = os.environ.get("LIVEKIT_API_KEY")
    lk_api_secret = os.environ.get("LIVEKIT_API_SECRET")
    if not (lk_url and lk_api_key and lk_api_secret):
        raise HTTPException(status_code=500, detail="LiveKit is not configured")

    # Normalize room name to a safe slug
    room = re.sub(r"[^a-z0-9-]+", "-", body.location_slug.strip().lower())
    if not room:
        raise HTTPException(status_code=400, detail="Invalid location_slug")

    # Guardrail: viewers can only join rooms that are actively broadcasting
    if body.role == "viewer":
        live = await db.livekit_streams.find_one({"location_slug": room, "status": "live"})
        if not live:
            raise HTTPException(status_code=409, detail="This location is not live yet")

    grants = api.VideoGrants(
        room_join=True,
        room=room,
        can_publish=(body.role == "dj"),
        can_publish_data=(body.role == "dj"),
        can_subscribe=True,
    )

    token = (
        api.AccessToken(lk_api_key, lk_api_secret)
        .with_identity(body.identity)
        .with_name(body.display_name or body.identity)
        .with_grants(grants)
        .with_ttl(timedelta(hours=2))
        .to_jwt()
    )

    return {
        "url": lk_url,
        "token": token,
        "room_name": room,
        "role": body.role,
    }


@router.post("/livekit/stream/start")
async def start_livekit_stream(body: dict):
    """DJ marks a location as live. Called right before publishing camera/mic.

    Also updates dj_profiles.live_stream_url so the homepage banner can detect it.
    """
    location_slug = (body.get("location_slug") or "").strip().lower()
    dj_id = body.get("dj_id") or ""
    dj_name = body.get("dj_name") or "DJ"
    if not location_slug or not dj_id:
        raise HTTPException(status_code=400, detail="location_slug and dj_id required")

    now = datetime.now(timezone.utc).isoformat()
    await db.livekit_streams.update_one(
        {"location_slug": location_slug},
        {
            "$set": {
                "location_slug": location_slug,
                "status": "live",
                "dj_id": dj_id,
                "dj_name": dj_name,
                "started_at": now,
            }
        },
        upsert=True,
    )

    # Sync to dj_profiles so the "DJ Live" banner picks it up.
    stream_url = f"livekit://{location_slug}"
    await db.dj_profiles.update_one(
        {"id": dj_id},
        {"$set": {"live_stream_url": stream_url, "in_app_stream": True}},
    )

    return {"status": "live", "room_name": location_slug, "stream_url": stream_url}


@router.post("/livekit/stream/stop")
async def stop_livekit_stream(body: dict):
    """DJ marks the stream as ended and clears their profile."""
    location_slug = (body.get("location_slug") or "").strip().lower()
    dj_id = body.get("dj_id") or ""
    if not location_slug:
        raise HTTPException(status_code=400, detail="location_slug required")

    now = datetime.now(timezone.utc).isoformat()
    await db.livekit_streams.update_one(
        {"location_slug": location_slug},
        {"$set": {"status": "ended", "ended_at": now}},
    )

    if dj_id:
        await db.dj_profiles.update_one(
            {"id": dj_id},
            {"$set": {"live_stream_url": None, "in_app_stream": False}},
        )

    return {"status": "ended", "room_name": location_slug}


@router.get("/livekit/stream/status/{location_slug}")
async def livekit_stream_status(location_slug: str):
    """Check if a location is currently live via LiveKit."""
    slug = re.sub(r"[^a-z0-9-]+", "-", location_slug.strip().lower())
    doc = await db.livekit_streams.find_one({"location_slug": slug, "status": "live"}, {"_id": 0})
    if not doc:
        return {"active": False}
    return {
        "active": True,
        "dj_id": doc.get("dj_id"),
        "dj_name": doc.get("dj_name"),
        "started_at": doc.get("started_at"),
    }


@router.get("/livekit/streams/active")
async def livekit_active_streams():
    """List all currently-live LiveKit streams (used by homepage banner)."""
    docs = await db.livekit_streams.find({"status": "live"}, {"_id": 0}).to_list(50)
    return docs
