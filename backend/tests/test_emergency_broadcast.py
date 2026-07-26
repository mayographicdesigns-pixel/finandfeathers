"""Tests for POST /api/admin/wall/emergency-broadcast + wall fan-out verification."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def active_locations(api):
    r = api.get(f"{BASE_URL}/api/locations")
    assert r.status_code == 200, r.text
    locs = [l for l in r.json() if l.get("is_active") and l.get("slug") != "hibachi-food-truck"]
    assert len(locs) > 0
    return locs


def test_emergency_broadcast_success(api, active_locations):
    payload = {"content": "TEST_EMERG happy path", "author_name": "TEST_Management"}
    r = api.post(f"{BASE_URL}/api/admin/wall/emergency-broadcast", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["emergency"] is True
    assert data["count"] == len(active_locations)
    assert isinstance(data["broadcast_id"], str) and len(data["broadcast_id"]) > 0

    # Verify posts persisted per location via public GET
    slug = active_locations[0]["slug"]
    g = api.get(f"{BASE_URL}/api/wall/posts/{slug}")
    assert g.status_code == 200
    posts = g.json()
    matches = [p for p in posts if p.get("broadcast_id") == data["broadcast_id"]]
    assert len(matches) == 1
    m = matches[0]
    assert m["is_broadcast"] is True
    assert m["is_emergency"] is True
    assert m["user_avatar"] == "\U0001f4e3"  # 📣
    assert m["post_type"] == "text"
    assert m["content"] == "TEST_EMERG happy path"
    assert m["user_name"] == "TEST_Management"


def test_emergency_broadcast_default_author(api, active_locations):
    payload = {"content": "TEST_EMERG default author"}
    r = api.post(f"{BASE_URL}/api/admin/wall/emergency-broadcast", json=payload)
    assert r.status_code == 200
    bid = r.json()["broadcast_id"]

    slug = active_locations[0]["slug"]
    posts = api.get(f"{BASE_URL}/api/wall/posts/{slug}").json()
    match = next((p for p in posts if p.get("broadcast_id") == bid), None)
    assert match is not None
    assert match["user_name"] == "Fin & Feathers Management"


def test_emergency_broadcast_empty_content(api):
    r = api.post(f"{BASE_URL}/api/admin/wall/emergency-broadcast", json={"content": ""})
    assert r.status_code == 400
    assert "Message content is required" in r.json().get("detail", "")


def test_emergency_broadcast_whitespace_content(api):
    r = api.post(f"{BASE_URL}/api/admin/wall/emergency-broadcast", json={"content": "   "})
    assert r.status_code == 400
    assert "Message content is required" in r.json().get("detail", "")


def test_emergency_broadcast_too_long(api):
    big = "x" * 501
    r = api.post(f"{BASE_URL}/api/admin/wall/emergency-broadcast", json={"content": big})
    assert r.status_code == 400
    assert "too long" in r.json().get("detail", "").lower()


def test_emergency_broadcast_fanout_all_locations(api, active_locations):
    """Verify one post is inserted into EVERY active non-hibachi location."""
    payload = {"content": "TEST_EMERG fanout check", "author_name": "TEST_Author"}
    r = api.post(f"{BASE_URL}/api/admin/wall/emergency-broadcast", json=payload)
    assert r.status_code == 200
    bid = r.json()["broadcast_id"]

    hits = 0
    for loc in active_locations:
        posts = api.get(f"{BASE_URL}/api/wall/posts/{loc['slug']}").json()
        if any(p.get("broadcast_id") == bid for p in posts):
            hits += 1
    assert hits == len(active_locations)
