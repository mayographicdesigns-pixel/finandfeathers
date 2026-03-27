"""Live Stream WebSocket relay — DJ broadcasts camera, viewers watch in real-time."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from database import db
from datetime import datetime, timezone
import asyncio
import logging

router = APIRouter(prefix="/api")

# In-memory store for active streams
# { location_slug: { "broadcaster": WebSocket, "viewers": set(), "init_segment": bytes, "dj_id": str, "dj_name": str } }
active_streams: dict = {}


@router.get("/stream/active")
async def get_active_streams():
    """Get all locations with active in-app streams."""
    result = []
    for slug, stream in active_streams.items():
        if stream.get("broadcaster"):
            result.append({
                "location_slug": slug,
                "dj_name": stream.get("dj_name", "DJ"),
                "viewer_count": len(stream.get("viewers", set())),
            })
    return result


@router.get("/stream/active/{location_slug}")
async def get_stream_status(location_slug: str):
    """Check if a specific location has an active in-app stream."""
    stream = active_streams.get(location_slug)
    if stream and stream.get("broadcaster"):
        return {
            "active": True,
            "dj_name": stream.get("dj_name", "DJ"),
            "viewer_count": len(stream.get("viewers", set())),
        }
    return {"active": False}


async def relay_to_viewers(location_slug: str, data: bytes):
    """Send stream data to all connected viewers, removing dead connections."""
    stream = active_streams.get(location_slug)
    if not stream:
        return
    dead = set()
    tasks = []
    for viewer in stream["viewers"]:
        try:
            tasks.append(viewer.send_bytes(data))
        except Exception:
            dead.add(viewer)
    if tasks:
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for viewer, result in zip(list(stream["viewers"]), results):
            if isinstance(result, Exception):
                dead.add(viewer)
    stream["viewers"] -= dead


@router.websocket("/ws/live-stream/{location_slug}")
async def live_stream_ws(
    websocket: WebSocket,
    location_slug: str,
    role: str = Query("viewer"),
    dj_id: str = Query(""),
    dj_name: str = Query("DJ"),
):
    await websocket.accept()

    if role == "broadcaster":
        # ---- DJ BROADCASTING ----
        if location_slug not in active_streams:
            active_streams[location_slug] = {
                "broadcaster": None, "viewers": set(),
                "init_segment": None, "dj_id": dj_id, "dj_name": dj_name,
            }

        # If another broadcaster exists, reject
        existing = active_streams[location_slug].get("broadcaster")
        if existing:
            try:
                await websocket.send_text("ERROR:ALREADY_BROADCASTING")
                await websocket.close()
            except Exception:
                pass
            return

        active_streams[location_slug]["broadcaster"] = websocket
        active_streams[location_slug]["dj_id"] = dj_id
        active_streams[location_slug]["dj_name"] = dj_name

        # Mark DJ profile as in-app streaming
        await db.dj_profiles.update_one(
            {"id": dj_id},
            {"$set": {
                "live_stream_url": f"in-app://{location_slug}",
                "in_app_stream": True,
            }}
        )
        logging.info(f"DJ {dj_name} started in-app stream at {location_slug}")

        chunk_count = 0
        try:
            while True:
                data = await websocket.receive_bytes()
                chunk_count += 1

                # First chunk contains the WebM init segment (EBML header + tracks)
                if chunk_count == 1:
                    active_streams[location_slug]["init_segment"] = data

                # Relay to all viewers
                await relay_to_viewers(location_slug, data)

        except WebSocketDisconnect:
            logging.info(f"DJ {dj_name} ended in-app stream at {location_slug}")
        except Exception as e:
            logging.error(f"Stream error for {location_slug}: {e}")
        finally:
            # Cleanup: notify viewers and remove stream
            stream = active_streams.pop(location_slug, None)
            if stream:
                for viewer in stream.get("viewers", set()):
                    try:
                        await viewer.send_text("STREAM_ENDED")
                    except Exception:
                        pass
            # Clear DJ profile stream status
            await db.dj_profiles.update_one(
                {"id": dj_id},
                {"$set": {"live_stream_url": None, "in_app_stream": False}}
            )

    else:
        # ---- VIEWER ----
        stream = active_streams.get(location_slug)
        if not stream or not stream.get("broadcaster"):
            try:
                await websocket.send_text("NO_STREAM")
                await websocket.close()
            except Exception:
                pass
            return

        stream["viewers"].add(websocket)
        logging.info(f"Viewer joined stream at {location_slug} (total: {len(stream['viewers'])})")

        # Send the init segment so the viewer's MediaSource can initialize
        init_seg = stream.get("init_segment")
        if init_seg:
            try:
                await websocket.send_bytes(init_seg)
            except Exception:
                stream["viewers"].discard(websocket)
                return

        try:
            # Keep connection alive — viewer receives data via relay_to_viewers
            while True:
                msg = await websocket.receive_text()
                if msg == "ping":
                    await websocket.send_text("pong")
        except WebSocketDisconnect:
            pass
        except Exception:
            pass
        finally:
            if location_slug in active_streams:
                active_streams[location_slug]["viewers"].discard(websocket)
            logging.info(f"Viewer left stream at {location_slug}")
