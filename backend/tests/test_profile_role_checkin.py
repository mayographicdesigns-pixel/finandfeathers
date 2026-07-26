"""Tests for simplified check-in flow + role setter on My Account (iteration 56)."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://staff-client-roles.preview.emergentagent.com').rstrip('/')


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def dj_profile(api):
    """Create (or reuse) a DJ profile with staff_title='dj'."""
    email = "dj_test_route@example.com"
    # try to find existing
    r = api.get(f"{BASE_URL}/api/user/profile/by-email/{email}")
    if r.status_code == 200 and r.json():
        profile = r.json()
    else:
        r = api.post(f"{BASE_URL}/api/user/profile", json={
            "name": "DJ Router Test",
            "email": email,
            "phone": "555-0000",
            "avatar_emoji": "🎧",
        })
        assert r.status_code == 200, r.text
        profile = r.json()

    # update to staff/dj
    r = api.put(f"{BASE_URL}/api/user/profile/{profile['id']}", json={
        "role": "staff",
        "staff_title": "dj",
    })
    assert r.status_code == 200, r.text
    updated = r.json()
    assert updated["role"] == "staff"
    assert updated["staff_title"] == "dj"
    return updated


def test_get_dj_profile_persisted(api, dj_profile):
    r = api.get(f"{BASE_URL}/api/user/profile/{dj_profile['id']}")
    assert r.status_code == 200
    p = r.json()
    assert p["role"] == "staff"
    assert p["staff_title"] == "dj"


def test_get_by_email_returns_dj(api, dj_profile):
    r = api.get(f"{BASE_URL}/api/user/profile/by-email/{dj_profile['email']}")
    assert r.status_code == 200
    p = r.json()
    assert p is not None
    assert p["staff_title"] == "dj"


def test_create_guest_profile_via_checkin_flow(api):
    """Simulate CheckInPage upsert for a new guest with email."""
    ts = int(time.time())
    email = f"guest_new_{ts}@example.com"
    r = api.post(f"{BASE_URL}/api/user/profile", json={
        "name": "Guest New",
        "email": email,
        "phone": "555-1234",
        "avatar_emoji": "👤",
    })
    assert r.status_code == 200, r.text
    created = r.json()
    assert created["email"] == email
    assert created["name"] == "Guest New"
    assert "id" in created

    # verify via by-email
    r2 = api.get(f"{BASE_URL}/api/user/profile/by-email/{email}")
    assert r2.status_code == 200
    fetched = r2.json()
    assert fetched["id"] == created["id"]
    assert fetched["phone"] == "555-1234"


def test_role_setter_updates_role_and_staff_title(api):
    """MyAccountPage role picker → PUT /api/user/profile/{id}."""
    ts = int(time.time())
    email = f"role_setter_{ts}@example.com"
    created = api.post(f"{BASE_URL}/api/user/profile", json={
        "name": "Role Setter Test",
        "email": email,
        "phone": "555-2222",
        "avatar_emoji": "🎧",
    }).json()

    # Set role to dj (as MyAccountPage does)
    r = api.put(f"{BASE_URL}/api/user/profile/{created['id']}", json={
        "role": "dj",
        "staff_title": "dj",
    })
    assert r.status_code == 200, r.text
    updated = r.json()
    assert updated["role"] == "dj"
    assert updated["staff_title"] == "dj"

    # GET verifies persistence
    r = api.get(f"{BASE_URL}/api/user/profile/{created['id']}")
    assert r.status_code == 200
    p = r.json()
    assert p["role"] == "dj"
    assert p["staff_title"] == "dj"


def test_role_setter_guest_clears_staff_title(api):
    ts = int(time.time())
    email = f"role_guest_{ts}@example.com"
    created = api.post(f"{BASE_URL}/api/user/profile", json={
        "name": "Guest Role",
        "email": email,
        "avatar_emoji": "👤",
    }).json()

    # start with bartender
    api.put(f"{BASE_URL}/api/user/profile/{created['id']}", json={
        "role": "bartender", "staff_title": "bartender",
    })
    # now downgrade to guest (frontend sends staff_title='')
    r = api.put(f"{BASE_URL}/api/user/profile/{created['id']}", json={
        "role": "guest", "staff_title": "",
    })
    assert r.status_code == 200
    p = r.json()
    assert p["role"] == "guest"
    # staff_title cleared (empty string is falsy)
    assert p["staff_title"] in ("", None)


def test_checkin_endpoint_records_visit(api, dj_profile):
    """Simulate CheckInPage POST /api/checkin."""
    # need a location slug - grab first location
    locs = api.get(f"{BASE_URL}/api/locations").json()
    slug = next((l["slug"] for l in locs if l["slug"] != "hibachi-food-truck"), locs[0]["slug"])

    r = api.post(f"{BASE_URL}/api/checkin", json={
        "location_slug": slug,
        "display_name": "DJ Router Test",
        "avatar_emoji": "🎧",
        "user_profile_id": dj_profile["id"],
    })
    assert r.status_code in (200, 201), r.text
