"""Tests for DJ broadcast fan-out on /api/wall/posts."""
import os
import uuid
import pytest
import requests
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://staff-client-roles.preview.emergentagent.com").rstrip("/")
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"

DJ_ID = "57cae364-b31f-4920-909f-fda18fc78fe6"
GUEST_ID = f"guest-{uuid.uuid4().hex[:8]}"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="module")
def db():
    return AsyncIOMotorClient(MONGO_URL)[DB_NAME]


def run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


# ---- 403 for non-DJ ----
def test_broadcast_forbidden_for_guest(s):
    r = s.post(f"{BASE_URL}/api/wall/posts", json={
        "user_id": GUEST_ID, "location_slug": "edgewood-atlanta",
        "user_name": "Guest", "content": "TESTBC_guest broadcast attempt",
        "broadcast_all": True,
    })
    assert r.status_code == 403, r.text
    assert "DJ" in r.json().get("detail", "")


# ---- DJ profile ID fan-out ----
def test_broadcast_dj_fanout(s, db):
    active_count = run(db.locations.count_documents(
        {"is_active": True, "slug": {"$ne": "hibachi-food-truck"}}
    ))
    content = f"TESTBC_dj_{uuid.uuid4().hex[:6]}"
    r = s.post(f"{BASE_URL}/api/wall/posts", json={
        "user_id": DJ_ID, "location_slug": "edgewood-atlanta",
        "user_name": "DJ MIKE", "content": content,
        "broadcast_all": True,
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert "broadcast_id" in data and "count" in data and "posts" in data
    assert data["count"] == active_count, f"count={data['count']} expected={active_count}"
    bid = data["broadcast_id"]
    slugs = set()
    for p in data["posts"]:
        assert p["is_broadcast"] is True
        assert p["broadcast_id"] == bid
        assert p["content"] == content
        slugs.add(p["location_slug"])
    assert "hibachi-food-truck" not in slugs
    assert len(slugs) == active_count

    # Verify each slug's feed contains the broadcast post
    for slug in slugs:
        gr = s.get(f"{BASE_URL}/api/wall/posts/{slug}?limit=50")
        assert gr.status_code == 200
        posts = gr.json()
        assert any(p.get("broadcast_id") == bid for p in posts), f"broadcast missing at {slug}"


# ---- user_profile fallback (role=dj or staff_title=dj) ----
def test_broadcast_userprofile_dj_fallback(s, db):
    up = run(db.user_profiles.find_one(
        {"$or": [{"role": "dj"}, {"staff_title": "dj"}]}, {"_id": 0, "id": 1}
    ))
    if not up:
        pytest.skip("No user_profile with dj role available")
    content = f"TESTBC_upfallback_{uuid.uuid4().hex[:6]}"
    r = s.post(f"{BASE_URL}/api/wall/posts", json={
        "user_id": up["id"], "location_slug": "edgewood-atlanta",
        "user_name": "TEST DJ UP", "content": content,
        "broadcast_all": True,
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["count"] > 0
    assert all(p["is_broadcast"] and p["broadcast_id"] == data["broadcast_id"] for p in data["posts"])


# ---- Regression: normal single-location post ----
def test_single_location_post_regression(s):
    content = f"TESTBC_single_{uuid.uuid4().hex[:6]}"
    r = s.post(f"{BASE_URL}/api/wall/posts", json={
        "user_id": GUEST_ID, "location_slug": "edgewood-atlanta",
        "user_name": "Guest", "content": content,
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("location_slug") == "edgewood-atlanta"
    assert data.get("is_broadcast") in (None, False)
    assert "broadcast_id" not in data or data.get("broadcast_id") is None
    # not present at another location
    gr = s.get(f"{BASE_URL}/api/wall/posts/midtown-atlanta?limit=100")
    assert gr.status_code == 200
    assert not any(p.get("id") == data["id"] for p in gr.json())


# ---- Photo broadcast creates gallery_items per location ----
def test_broadcast_photo_creates_gallery_items(s, db):
    fake_url = f"/api/uploads/testbc_{uuid.uuid4().hex[:8]}.jpg"
    content = f"TESTBC_photo_{uuid.uuid4().hex[:6]}"
    r = s.post(f"{BASE_URL}/api/wall/posts", json={
        "user_id": DJ_ID, "location_slug": "edgewood-atlanta",
        "user_name": "DJ MIKE", "content": content,
        "image_url": fake_url, "post_type": "photo",
        "broadcast_all": True,
    })
    assert r.status_code == 200, r.text
    data = r.json()
    post_ids = [p["id"] for p in data["posts"]]
    # Count gallery items linked to any of those post ids
    count = run(db.gallery_items.count_documents({"source_post_id": {"$in": post_ids}}))
    assert count == data["count"], f"gallery_items={count} expected={data['count']}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
