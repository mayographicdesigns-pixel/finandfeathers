"""Tests for the DJ unified wall feature (location_slug='all')."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://staff-client-roles.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

LOC_A = "edgewood-atlanta"
LOC_B = "midtown-atlanta"

TAG = f"TESTUNI_{uuid.uuid4().hex[:6]}"


@pytest.fixture(scope="module")
def seeded():
    """Create posts + chat + DM messages across two locations to test 'all' unified endpoints."""
    user_a = f"TEST_user_a_{uuid.uuid4().hex[:6]}"
    user_b = f"TEST_user_b_{uuid.uuid4().hex[:6]}"

    # Posts on both locations
    for loc, uid, uname in [(LOC_A, user_a, "AliceA"), (LOC_B, user_b, "BobB")]:
        r = requests.post(f"{API}/wall/posts", json={
            "user_id": uid, "location_slug": loc,
            "user_name": uname, "content": f"{TAG} post @ {loc}"
        }, timeout=15)
        assert r.status_code == 200, r.text

    # Chat on both locations
    for loc, uid, uname in [(LOC_A, user_a, "AliceA"), (LOC_B, user_b, "BobB")]:
        r = requests.post(f"{API}/wall/chat/{loc}", json={
            "user_id": uid, "user_name": uname, "content": f"{TAG} chat @ {loc}"
        }, timeout=15)
        assert r.status_code == 200

    # DM with from/to location fields
    dm = requests.post(f"{API}/wall/dm", json={
        "from_user_id": user_a, "from_user_name": "AliceA", "from_location_slug": LOC_A,
        "to_user_id": user_b, "to_user_name": "BobB", "to_location_slug": LOC_B,
        "content": f"{TAG} DM hello"
    }, timeout=15)
    assert dm.status_code == 200, dm.text
    dm_body = dm.json()
    assert dm_body.get("from_location_slug") == LOC_A
    assert dm_body.get("to_location_slug") == LOC_B

    return {"user_a": user_a, "user_b": user_b}


# ---------- Wall posts ----------
class TestWallPosts:
    def test_all_returns_multi_location(self, seeded):
        r = requests.get(f"{API}/wall/posts/all?limit=200", timeout=15)
        assert r.status_code == 200
        data = r.json()
        slugs = {p.get("location_slug") for p in data if p.get("content", "").startswith(TAG)}
        assert LOC_A in slugs and LOC_B in slugs, f"Expected both locations. Got {slugs}"

    def test_specific_slug_regression(self, seeded):
        r = requests.get(f"{API}/wall/posts/{LOC_A}?limit=200", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert all(p["location_slug"] == LOC_A for p in data), "Non-matching slug leaked"
        assert any(p.get("content", "").startswith(TAG) for p in data)


# ---------- Chat ----------
class TestWallChat:
    def test_all_returns_multi_location(self, seeded):
        r = requests.get(f"{API}/wall/chat/all?limit=200", timeout=15)
        assert r.status_code == 200
        data = r.json()
        slugs = {m.get("location_slug") for m in data if m.get("content", "").startswith(TAG)}
        assert LOC_A in slugs and LOC_B in slugs

    def test_specific_slug_regression(self, seeded):
        r = requests.get(f"{API}/wall/chat/{LOC_B}?limit=200", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert all(m["location_slug"] == LOC_B for m in data)


# ---------- Users ----------
class TestWallUsers:
    def test_all_returns_multi_location_users(self, seeded):
        r = requests.get(f"{API}/wall/users/all", timeout=15)
        assert r.status_code == 200
        users = r.json()
        # Both seeded users must appear
        ids = {u["user_id"] for u in users}
        assert seeded["user_a"] in ids
        assert seeded["user_b"] in ids
        # location_slug field present on each
        assert all("location_slug" in u for u in users)
        slugs = {u.get("location_slug") for u in users if u["user_id"] in (seeded["user_a"], seeded["user_b"])}
        assert LOC_A in slugs and LOC_B in slugs

    def test_specific_slug_regression(self, seeded):
        r = requests.get(f"{API}/wall/users/{LOC_A}", timeout=15)
        assert r.status_code == 200
        users = r.json()
        ids = {u["user_id"] for u in users}
        assert seeded["user_a"] in ids
        assert seeded["user_b"] not in ids, "User from other location leaked"


# ---------- DM ----------
class TestDM:
    def test_dm_persists_location_fields(self, seeded):
        r = requests.get(f"{API}/wall/dm/thread/{seeded['user_a']}/{seeded['user_b']}", timeout=15)
        assert r.status_code == 200
        msgs = r.json()
        tagged = [m for m in msgs if m.get("content", "").startswith(TAG)]
        assert tagged, "Seeded DM not found"
        m = tagged[0]
        assert m.get("from_location_slug") == LOC_A
        assert m.get("to_location_slug") == LOC_B

    def test_conversations_projects_partner_location_slug(self, seeded):
        # From sender's POV — partner is user_b at LOC_B
        r = requests.get(f"{API}/wall/dm/conversations/{seeded['user_a']}", timeout=15)
        assert r.status_code == 200
        convs = r.json()
        found = [c for c in convs if c.get("partner_id") == seeded["user_b"]]
        assert found, f"Conversation with partner not found. Got {convs}"
        assert found[0].get("partner_location_slug") == LOC_B

        # From recipient's POV — partner is user_a at LOC_A
        r2 = requests.get(f"{API}/wall/dm/conversations/{seeded['user_b']}", timeout=15)
        assert r2.status_code == 200
        found2 = [c for c in r2.json() if c.get("partner_id") == seeded["user_a"]]
        assert found2
        assert found2[0].get("partner_location_slug") == LOC_A

    def test_dm_backward_compat_optional_location(self):
        """DM without from/to_location_slug should still work (backward compat)."""
        r = requests.post(f"{API}/wall/dm", json={
            "from_user_id": f"TEST_bc_{uuid.uuid4().hex[:6]}",
            "from_user_name": "BC From",
            "to_user_id": f"TEST_bc_{uuid.uuid4().hex[:6]}",
            "to_user_name": "BC To",
            "content": f"{TAG} bc dm"
        }, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body.get("from_location_slug") == ""
        assert body.get("to_location_slug") == ""
