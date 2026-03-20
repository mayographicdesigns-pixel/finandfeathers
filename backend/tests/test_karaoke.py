"""
Karaoke System and DJ Panel API Tests
Tests the new karaoke functionality: DJ login, location checkin, karaoke toggle, 
song requests, and queue management.
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://careers-form.preview.emergentagent.com').rstrip('/')

# Test location slugs
LOCATION_SLUGS = [
    "edgewood-atlanta",
    "midtown-atlanta", 
    "douglasville",
    "riverdale",
    "valdosta",
    "albany",
    "stone-mountain",
    "las-vegas"
]

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestDJLogin:
    """DJ login and profile tests"""
    
    def test_dj_login_creates_profile(self, api_client):
        """POST /api/dj/login - Creates new DJ profile or finds existing one"""
        test_name = f"TEST_DJ_{uuid.uuid4().hex[:8]}"
        response = api_client.post(f"{BASE_URL}/api/dj/login", json={"name": test_name})
        
        assert response.status_code == 200, f"DJ login failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "Response should contain DJ id"
        assert data.get("name") == test_name, f"Name should match: {data.get('name')} != {test_name}"
        print(f"PASS: DJ login created profile with id: {data['id']}")
        return data
    
    def test_dj_login_finds_existing(self, api_client):
        """POST /api/dj/login - Returns existing DJ profile if name matches"""
        test_name = f"TEST_Existing_DJ_{uuid.uuid4().hex[:6]}"
        
        # First login creates profile
        res1 = api_client.post(f"{BASE_URL}/api/dj/login", json={"name": test_name})
        assert res1.status_code == 200
        dj1 = res1.json()
        
        # Second login should find existing profile
        res2 = api_client.post(f"{BASE_URL}/api/dj/login", json={"name": test_name})
        assert res2.status_code == 200
        dj2 = res2.json()
        
        assert dj1["id"] == dj2["id"], "Same DJ name should return same profile"
        print(f"PASS: DJ login returns existing profile for same name")


class TestDJCheckin:
    """DJ location check-in tests"""
    
    def test_dj_checkin_to_location(self, api_client):
        """POST /api/dj/checkin/{id}?location_slug={slug} - Check DJ into a location"""
        # First create a DJ
        test_name = f"TEST_Checkin_DJ_{uuid.uuid4().hex[:6]}"
        login_res = api_client.post(f"{BASE_URL}/api/dj/login", json={"name": test_name})
        assert login_res.status_code == 200
        dj_id = login_res.json()["id"]
        
        # Check in to first location
        location = LOCATION_SLUGS[0]
        checkin_res = api_client.post(f"{BASE_URL}/api/dj/checkin/{dj_id}?location_slug={location}")
        
        assert checkin_res.status_code == 200, f"Checkin failed: {checkin_res.text}"
        print(f"PASS: DJ checked in to {location}")
        
        # Verify DJ is at location
        at_loc_res = api_client.get(f"{BASE_URL}/api/dj/at-location/{location}")
        assert at_loc_res.status_code == 200
        data = at_loc_res.json()
        assert data.get("checked_in") == True, "DJ should be checked in at location"
        assert data.get("dj_id") == dj_id, "DJ ID should match"
        print(f"PASS: Verified DJ is at location via /api/dj/at-location")
        return dj_id, location
    
    def test_dj_checkout(self, api_client):
        """POST /api/dj/checkout/{id} - Check DJ out from location"""
        # Create and checkin DJ
        test_name = f"TEST_Checkout_DJ_{uuid.uuid4().hex[:6]}"
        login_res = api_client.post(f"{BASE_URL}/api/dj/login", json={"name": test_name})
        dj_id = login_res.json()["id"]
        
        location = LOCATION_SLUGS[1]
        api_client.post(f"{BASE_URL}/api/dj/checkin/{dj_id}?location_slug={location}")
        
        # Now checkout
        checkout_res = api_client.post(f"{BASE_URL}/api/dj/checkout/{dj_id}")
        assert checkout_res.status_code == 200, f"Checkout failed: {checkout_res.text}"
        print(f"PASS: DJ checked out successfully")


class TestKaraokeToggle:
    """Karaoke mode toggle tests"""
    
    def test_toggle_karaoke_on(self, api_client):
        """POST /api/karaoke/toggle/{location_slug} - Turn karaoke ON"""
        # Create and checkin DJ
        test_name = f"TEST_Karaoke_DJ_{uuid.uuid4().hex[:6]}"
        login_res = api_client.post(f"{BASE_URL}/api/dj/login", json={"name": test_name})
        dj_id = login_res.json()["id"]
        
        location = "edgewood-atlanta"
        api_client.post(f"{BASE_URL}/api/dj/checkin/{dj_id}?location_slug={location}")
        
        # Turn karaoke ON
        toggle_res = api_client.post(
            f"{BASE_URL}/api/karaoke/toggle/{location}",
            json={"active": True, "dj_id": dj_id}
        )
        
        assert toggle_res.status_code == 200, f"Toggle failed: {toggle_res.text}"
        data = toggle_res.json()
        assert data.get("active") == True, "Karaoke should be active"
        print(f"PASS: Karaoke turned ON at {location}")
        return dj_id, location
    
    def test_toggle_karaoke_off(self, api_client):
        """POST /api/karaoke/toggle/{location_slug} - Turn karaoke OFF"""
        # Create, checkin and turn karaoke on
        test_name = f"TEST_KaraokeOff_DJ_{uuid.uuid4().hex[:6]}"
        login_res = api_client.post(f"{BASE_URL}/api/dj/login", json={"name": test_name})
        dj_id = login_res.json()["id"]
        
        location = "midtown-atlanta"
        api_client.post(f"{BASE_URL}/api/dj/checkin/{dj_id}?location_slug={location}")
        api_client.post(f"{BASE_URL}/api/karaoke/toggle/{location}", json={"active": True, "dj_id": dj_id})
        
        # Turn karaoke OFF
        toggle_res = api_client.post(
            f"{BASE_URL}/api/karaoke/toggle/{location}",
            json={"active": False, "dj_id": dj_id}
        )
        
        assert toggle_res.status_code == 200, f"Toggle off failed: {toggle_res.text}"
        data = toggle_res.json()
        assert data.get("active") == False, "Karaoke should be inactive"
        print(f"PASS: Karaoke turned OFF at {location}")


class TestKaraokeStatus:
    """Karaoke status endpoint tests"""
    
    def test_get_karaoke_status_inactive(self, api_client):
        """GET /api/karaoke/status/{location_slug} - Returns inactive status"""
        location = "valdosta"  # Use a location we haven't activated
        
        # First turn off karaoke to ensure clean state
        api_client.post(f"{BASE_URL}/api/karaoke/toggle/{location}", json={"active": False, "dj_id": ""})
        
        response = api_client.get(f"{BASE_URL}/api/karaoke/status/{location}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("active") == False, "Karaoke should be inactive"
        print(f"PASS: Karaoke status shows inactive at {location}")
    
    def test_get_karaoke_status_active(self, api_client):
        """GET /api/karaoke/status/{location_slug} - Returns active status after toggle"""
        # Create DJ and activate karaoke
        test_name = f"TEST_Status_DJ_{uuid.uuid4().hex[:6]}"
        login_res = api_client.post(f"{BASE_URL}/api/dj/login", json={"name": test_name})
        dj_id = login_res.json()["id"]
        
        location = "douglasville"
        api_client.post(f"{BASE_URL}/api/dj/checkin/{dj_id}?location_slug={location}")
        api_client.post(f"{BASE_URL}/api/karaoke/toggle/{location}", json={"active": True, "dj_id": dj_id})
        
        # Check status
        response = api_client.get(f"{BASE_URL}/api/karaoke/status/{location}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("active") == True, "Karaoke should be active"
        assert data.get("dj_id") == dj_id, "DJ ID should match"
        print(f"PASS: Karaoke status shows active at {location} with DJ {dj_id}")
        
        # Cleanup - turn off karaoke
        api_client.post(f"{BASE_URL}/api/karaoke/toggle/{location}", json={"active": False, "dj_id": dj_id})


class TestSongRequest:
    """Song request (karaoke queue) tests"""
    
    def test_submit_karaoke_song_request(self, api_client):
        """POST /api/social/song-request - Submit a karaoke song request"""
        location = "stone-mountain"
        
        # First activate karaoke at the location
        test_name = f"TEST_SongReq_DJ_{uuid.uuid4().hex[:6]}"
        login_res = api_client.post(f"{BASE_URL}/api/dj/login", json={"name": test_name})
        dj_id = login_res.json()["id"]
        api_client.post(f"{BASE_URL}/api/dj/checkin/{dj_id}?location_slug={location}")
        api_client.post(f"{BASE_URL}/api/karaoke/toggle/{location}", json={"active": True, "dj_id": dj_id})
        
        # Submit a song request
        singer_name = f"TEST_Singer_{uuid.uuid4().hex[:4]}"
        song_name = "TEST_Bohemian Rhapsody"
        
        response = api_client.post(f"{BASE_URL}/api/social/song-request", json={
            "location_slug": location,
            "request_type": "karaoke",
            "name": singer_name,
            "song": song_name
        })
        
        assert response.status_code == 200, f"Song request failed: {response.text}"
        data = response.json()
        assert "id" in data, "Response should contain request id"
        assert data.get("name") == singer_name
        assert data.get("song") == song_name
        assert data.get("status") == "pending"
        print(f"PASS: Song request submitted - {singer_name} wants to sing {song_name}")
        
        # Cleanup
        api_client.post(f"{BASE_URL}/api/karaoke/toggle/{location}", json={"active": False, "dj_id": dj_id})
        return data["id"], location, dj_id


class TestKaraokeQueue:
    """Karaoke queue management tests"""
    
    def test_get_karaoke_queue(self, api_client):
        """GET /api/karaoke/queue/{location_slug} - Get pending and played songs"""
        location = "riverdale"
        
        # Setup: Create DJ, activate karaoke, submit requests
        test_name = f"TEST_Queue_DJ_{uuid.uuid4().hex[:6]}"
        login_res = api_client.post(f"{BASE_URL}/api/dj/login", json={"name": test_name})
        dj_id = login_res.json()["id"]
        api_client.post(f"{BASE_URL}/api/dj/checkin/{dj_id}?location_slug={location}")
        api_client.post(f"{BASE_URL}/api/karaoke/toggle/{location}", json={"active": True, "dj_id": dj_id})
        
        # Submit 2 song requests
        for i in range(2):
            api_client.post(f"{BASE_URL}/api/social/song-request", json={
                "location_slug": location,
                "request_type": "karaoke",
                "name": f"TEST_QueueSinger_{i}",
                "song": f"TEST_Song_{i}"
            })
        
        # Get queue
        response = api_client.get(f"{BASE_URL}/api/karaoke/queue/{location}")
        assert response.status_code == 200, f"Get queue failed: {response.text}"
        data = response.json()
        
        assert "pending" in data, "Response should have 'pending' array"
        assert "played" in data, "Response should have 'played' array"
        assert len(data["pending"]) >= 2, "Should have at least 2 pending songs"
        print(f"PASS: Got karaoke queue - {len(data['pending'])} pending, {len(data['played'])} played")
        
        # Cleanup
        api_client.post(f"{BASE_URL}/api/karaoke/toggle/{location}", json={"active": False, "dj_id": dj_id})
        return data


class TestMarkSongStatus:
    """Mark song as played/skipped tests"""
    
    def test_mark_song_as_played(self, api_client):
        """PUT /api/social/song-request/{id}/status?status=played - Mark song as sung"""
        location = "albany"
        
        # Setup
        test_name = f"TEST_Mark_DJ_{uuid.uuid4().hex[:6]}"
        login_res = api_client.post(f"{BASE_URL}/api/dj/login", json={"name": test_name})
        dj_id = login_res.json()["id"]
        api_client.post(f"{BASE_URL}/api/dj/checkin/{dj_id}?location_slug={location}")
        api_client.post(f"{BASE_URL}/api/karaoke/toggle/{location}", json={"active": True, "dj_id": dj_id})
        
        # Submit request
        submit_res = api_client.post(f"{BASE_URL}/api/social/song-request", json={
            "location_slug": location,
            "request_type": "karaoke",
            "name": "TEST_PlayedSinger",
            "song": "TEST_PlayedSong"
        })
        request_id = submit_res.json()["id"]
        
        # Mark as played
        mark_res = api_client.put(f"{BASE_URL}/api/social/song-request/{request_id}/status?status=played")
        assert mark_res.status_code == 200, f"Mark played failed: {mark_res.text}"
        print(f"PASS: Song marked as played")
        
        # Verify in queue
        queue_res = api_client.get(f"{BASE_URL}/api/karaoke/queue/{location}")
        data = queue_res.json()
        played_ids = [s.get("id") for s in data.get("played", [])]
        assert request_id in played_ids, "Song should be in played list"
        print(f"PASS: Verified song appears in played queue")
        
        # Cleanup
        api_client.post(f"{BASE_URL}/api/karaoke/toggle/{location}", json={"active": False, "dj_id": dj_id})
    
    def test_mark_song_as_skipped(self, api_client):
        """PUT /api/social/song-request/{id}/status?status=skipped - Skip song"""
        location = "las-vegas"
        
        # Setup
        test_name = f"TEST_Skip_DJ_{uuid.uuid4().hex[:6]}"
        login_res = api_client.post(f"{BASE_URL}/api/dj/login", json={"name": test_name})
        dj_id = login_res.json()["id"]
        api_client.post(f"{BASE_URL}/api/dj/checkin/{dj_id}?location_slug={location}")
        api_client.post(f"{BASE_URL}/api/karaoke/toggle/{location}", json={"active": True, "dj_id": dj_id})
        
        # Submit request
        submit_res = api_client.post(f"{BASE_URL}/api/social/song-request", json={
            "location_slug": location,
            "request_type": "karaoke",
            "name": "TEST_SkippedSinger",
            "song": "TEST_SkippedSong"
        })
        request_id = submit_res.json()["id"]
        
        # Mark as skipped
        mark_res = api_client.put(f"{BASE_URL}/api/social/song-request/{request_id}/status?status=skipped")
        assert mark_res.status_code == 200, f"Mark skipped failed: {mark_res.text}"
        print(f"PASS: Song marked as skipped")
        
        # Cleanup
        api_client.post(f"{BASE_URL}/api/karaoke/toggle/{location}", json={"active": False, "dj_id": dj_id})


class TestLocationsEndpoint:
    """Test locations endpoint needed for DJ panel"""
    
    def test_get_locations(self, api_client):
        """GET /api/locations - Get all locations for DJ selection"""
        response = api_client.get(f"{BASE_URL}/api/locations")
        assert response.status_code == 200, f"Get locations failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Should return a list of locations"
        assert len(data) >= 8, f"Should have at least 8 locations, got {len(data)}"
        
        # Check each location has required fields
        for loc in data:
            assert "slug" in loc, "Location should have slug"
            assert "name" in loc, "Location should have name"
        
        # Verify expected slugs exist
        slugs = [loc["slug"] for loc in data]
        for expected_slug in LOCATION_SLUGS:
            assert expected_slug in slugs, f"Missing expected location: {expected_slug}"
        
        print(f"PASS: Got {len(data)} locations with all expected slugs")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
