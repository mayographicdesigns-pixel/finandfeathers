"""Backend sanity tests for endpoints powering the new Admin DJ Control tab."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://staff-client-roles.preview.emergentagent.com').rstrip('/')
DJ_MIKE_ID = "57cae364-b31f-4920-909f-fda18fc78fe6"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# --- Base endpoints used by the tab -------------------------------------------------
def test_dj_profiles(s):
    r = s.get(f"{BASE_URL}/api/dj/profiles", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    ids = [d.get("id") for d in data]
    assert DJ_MIKE_ID in ids, f"DJ MIKE ({DJ_MIKE_ID}) missing from /api/dj/profiles"


def test_locations(s):
    r = s.get(f"{BASE_URL}/api/locations", timeout=15)
    assert r.status_code == 200
    locs = r.json()
    assert isinstance(locs, list) and len(locs) > 0
    for l in locs:
        assert "slug" in l and "name" in l


def test_livekit_streams_active(s):
    r = s.get(f"{BASE_URL}/api/livekit/streams/active", timeout=15)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_karaoke_status_per_location(s):
    locs = s.get(f"{BASE_URL}/api/locations", timeout=15).json()
    locs = [l for l in locs if l["slug"] != "hibachi-food-truck"]
    assert len(locs) > 0
    for l in locs:
        r = s.get(f"{BASE_URL}/api/karaoke/status/{l['slug']}", timeout=15)
        assert r.status_code == 200, f"karaoke status failed for {l['slug']}"
        assert "active" in r.json()


# --- DJ check-in / check-out flow ---------------------------------------------------
def test_dj_checkin_then_checkout_flow(s):
    # ensure clean state first
    s.post(f"{BASE_URL}/api/dj/checkout/{DJ_MIKE_ID}", timeout=15)

    locs = s.get(f"{BASE_URL}/api/locations", timeout=15).json()
    slug = next((l["slug"] for l in locs if l["slug"] != "hibachi-food-truck"), None)
    assert slug is not None

    r = s.post(f"{BASE_URL}/api/dj/checkin/{DJ_MIKE_ID}?location_slug={slug}", timeout=15)
    assert r.status_code in (200, 201), f"checkin failed: {r.status_code} {r.text[:200]}"

    profiles = s.get(f"{BASE_URL}/api/dj/profiles", timeout=15).json()
    mike = next(d for d in profiles if d.get("id") == DJ_MIKE_ID)
    assert mike.get("current_location") == slug

    r = s.post(f"{BASE_URL}/api/dj/checkout/{DJ_MIKE_ID}", timeout=15)
    assert r.status_code in (200, 201)

    profiles = s.get(f"{BASE_URL}/api/dj/profiles", timeout=15).json()
    mike = next(d for d in profiles if d.get("id") == DJ_MIKE_ID)
    assert not mike.get("current_location"), f"DJ still checked-in after checkout: {mike.get('current_location')}"


# --- Karaoke toggle ---------------------------------------------------------------
def test_karaoke_toggle(s):
    locs = s.get(f"{BASE_URL}/api/locations", timeout=15).json()
    slug = next((l["slug"] for l in locs if l["slug"] != "hibachi-food-truck"), None)
    assert slug is not None
    cur = s.get(f"{BASE_URL}/api/karaoke/status/{slug}", timeout=15).json().get("active", False)

    r = s.post(f"{BASE_URL}/api/karaoke/toggle/{slug}",
               json={"active": not cur, "dj_id": None}, timeout=15)
    assert r.status_code in (200, 201), f"toggle failed: {r.status_code} {r.text[:200]}"

    new = s.get(f"{BASE_URL}/api/karaoke/status/{slug}", timeout=15).json().get("active", False)
    assert new == (not cur)

    # revert
    s.post(f"{BASE_URL}/api/karaoke/toggle/{slug}", json={"active": cur, "dj_id": None}, timeout=15)


# --- LiveKit stop endpoint reachable ------------------------------------------------
def test_livekit_stream_stop_endpoint(s):
    # Should return 200 (or graceful error) even if no active stream — endpoint must exist.
    r = s.post(f"{BASE_URL}/api/livekit/stream/stop",
               json={"location_slug": "edgewood-atlanta", "dj_id": DJ_MIKE_ID}, timeout=15)
    assert r.status_code < 500, f"stream/stop 5xx: {r.status_code} {r.text[:200]}"
