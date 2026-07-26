"""Tests for GET /api/checkins/count and regression on /api/checkin/{slug}."""
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://staff-client-roles.preview.emergentagent.com").rstrip("/")


def test_checkins_count_global():
    r = requests.get(f"{BASE_URL}/api/checkins/count", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "count" in data and "location_slug" in data
    assert data["location_slug"] is None
    assert isinstance(data["count"], int)
    assert data["count"] >= 0
    print(f"Global count: {data['count']}")


def test_checkins_count_per_location():
    slug = "edgewood-atlanta"
    r = requests.get(f"{BASE_URL}/api/checkins/count", params={"location_slug": slug}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["location_slug"] == slug
    assert isinstance(data["count"], int)
    assert data["count"] >= 0
    print(f"{slug} count: {data['count']}")


def test_count_le_global():
    slug = "edgewood-atlanta"
    g = requests.get(f"{BASE_URL}/api/checkins/count", timeout=15).json()["count"]
    l = requests.get(f"{BASE_URL}/api/checkins/count", params={"location_slug": slug}, timeout=15).json()["count"]
    assert l <= g


def test_checkin_list_regression():
    slug = "edgewood-atlanta"
    r = requests.get(f"{BASE_URL}/api/checkin/{slug}", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, list)
    print(f"Listing returned {len(data)} entries")


def test_route_ordering_not_confused():
    # /checkins/count should NOT be treated as a location slug
    r = requests.get(f"{BASE_URL}/api/checkins/count", timeout=15)
    assert r.status_code == 200
    # If it were matched by /checkin/{location_slug}, response would be a list
    assert isinstance(r.json(), dict)
