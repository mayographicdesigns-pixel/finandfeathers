"""LiveKit guest-role tests: multi-camera stage, MAX_PUBLISHERS_PER_ROOM cap, JWT claims."""
import os
import uuid
import pytest
import requests
import jwt as pyjwt

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
API = f"{BASE_URL}/api"

LOCATION = f"edgewood-guest-{uuid.uuid4().hex[:6]}"
DJ_ID = f"TEST_dj_{uuid.uuid4().hex[:8]}"
DJ_NAME = "TEST DJ Guest"
MAX_PUBS = 9


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="module", autouse=True)
def cleanup(s):
    s.post(f"{API}/livekit/stream/stop", json={"location_slug": LOCATION, "dj_id": DJ_ID})
    yield
    s.post(f"{API}/livekit/stream/stop", json={"location_slug": LOCATION, "dj_id": DJ_ID})


def _decode(token):
    return pyjwt.decode(token, options={"verify_signature": False})


# ------ Guest 409 when not live ------
def test_guest_token_409_when_not_live(s):
    r = s.post(f"{API}/livekit/token", json={
        "location_slug": LOCATION, "identity": "guest_1", "role": "guest"
    })
    assert r.status_code == 409, r.text
    assert "not live" in r.json().get("detail", "").lower()


# ------ Start stream ------
def test_stream_start(s):
    r = s.post(f"{API}/livekit/stream/start", json={
        "location_slug": LOCATION, "dj_id": DJ_ID, "dj_name": DJ_NAME
    })
    assert r.status_code == 200, r.text


# ------ Guest token issued after live ------
def test_guest_token_after_start(s):
    r = s.post(f"{API}/livekit/token", json={
        "location_slug": LOCATION, "identity": "guest_1", "role": "guest",
        "display_name": "Guest 1"
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["role"] == "guest"
    assert data["max_publishers"] == MAX_PUBS
    assert data["url"].startswith("wss://"), data["url"]
    tok = data["token"]
    assert isinstance(tok, str) and len(tok) > 100
    claims = _decode(tok)
    video = claims.get("video", {})
    assert video.get("roomJoin") is True
    assert video.get("room") == data["room_name"]
    assert video.get("canPublish") is True, f"Guest should have canPublish=True. video={video}"
    assert video.get("canSubscribe", True) is True


# ------ Viewer regression: canPublish false ------
def test_viewer_token_canpublish_false(s):
    r = s.post(f"{API}/livekit/token", json={
        "location_slug": LOCATION, "identity": "viewer_x", "role": "viewer"
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["role"] == "viewer"
    assert data["max_publishers"] == MAX_PUBS
    claims = _decode(data["token"])
    video = claims.get("video", {})
    assert not video.get("canPublish", False), f"Viewer canPublish should be false. video={video}"


# ------ DJ regression: canPublish true ------
def test_dj_token_canpublish_true(s):
    r = s.post(f"{API}/livekit/token", json={
        "location_slug": LOCATION, "identity": DJ_ID, "role": "dj", "display_name": DJ_NAME
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["role"] == "dj"
    assert data["max_publishers"] == MAX_PUBS
    claims = _decode(data["token"])
    video = claims.get("video", {})
    assert video.get("canPublish") is True


# ------ Invalid role -> 422 ------
def test_invalid_role_422(s):
    r = s.post(f"{API}/livekit/token", json={
        "location_slug": LOCATION, "identity": "who", "role": "admin"
    })
    assert r.status_code == 422, r.text


# ------ max_publishers in all responses ------
def test_max_publishers_field_all_roles(s):
    for role in ("dj", "viewer", "guest"):
        r = s.post(f"{API}/livekit/token", json={
            "location_slug": LOCATION, "identity": f"id_{role}", "role": role
        })
        assert r.status_code == 200, f"{role}: {r.text}"
        assert r.json().get("max_publishers") == MAX_PUBS, r.json()


# ------ _count_room_publishers doesn't crash: guest issued when 0 participants ------
def test_guest_issued_when_zero_publishers(s):
    # No one actually connected via WebRTC; count should be 0 and guest still issued.
    r = s.post(f"{API}/livekit/token", json={
        "location_slug": LOCATION, "identity": "guest_zero", "role": "guest"
    })
    assert r.status_code == 200, r.text
    assert r.json()["role"] == "guest"


# ------ Stream stop ------
def test_stream_stop(s):
    r = s.post(f"{API}/livekit/stream/stop", json={
        "location_slug": LOCATION, "dj_id": DJ_ID
    })
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "ended"


# ------ Guest 409 again after stop ------
def test_guest_409_after_stop(s):
    r = s.post(f"{API}/livekit/token", json={
        "location_slug": LOCATION, "identity": "guest_after_stop", "role": "guest"
    })
    assert r.status_code == 409, r.text


# ------ Regression: legacy endpoints still work ------
def test_streams_active_endpoint(s):
    r = s.get(f"{API}/livekit/streams/active")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_stream_status_endpoint(s):
    r = s.get(f"{API}/livekit/stream/status/{LOCATION}")
    assert r.status_code == 200
    # After stop, should be inactive
    assert r.json() == {"active": False}
