"""
DJ Flow Backend Tests
Tests DJ login, check-in, checkout, and integration with social wall features
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://staff-client-roles.preview.emergentagent.com').rstrip('/')

class TestDJFlow:
    """Test DJ login, check-in, and checkout flow"""
    
    test_dj_id = None
    test_location = "edgewood-atlanta"
    
    def test_01_dj_login(self):
        """Test DJ login via POST /api/dj/login"""
        response = requests.post(f"{BASE_URL}/api/dj/login", json={
            "name": "TEST_DJ_Flow"
        })
        assert response.status_code == 200, f"DJ login failed: {response.text}"
        data = response.json()
        assert "id" in data, "DJ login response missing 'id'"
        assert "name" in data, "DJ login response missing 'name'"
        TestDJFlow.test_dj_id = data["id"]
        print(f"DJ logged in with ID: {TestDJFlow.test_dj_id}")
    
    def test_02_dj_checkin(self):
        """Test DJ check-in at a location via POST /api/dj/checkin/{dj_id}"""
        assert TestDJFlow.test_dj_id, "DJ ID not set from login test"
        response = requests.post(
            f"{BASE_URL}/api/dj/checkin/{TestDJFlow.test_dj_id}?location_slug={TestDJFlow.test_location}"
        )
        assert response.status_code == 200, f"DJ check-in failed: {response.text}"
        data = response.json()
        assert "message" in data, "Check-in response missing 'message'"
        print(f"DJ checked in at {TestDJFlow.test_location}")
    
    def test_03_dj_next_session_is_live(self):
        """Test GET /api/dj/next-session/{location_slug} returns is_live: true when DJ is checked in"""
        response = requests.get(f"{BASE_URL}/api/dj/next-session/{TestDJFlow.test_location}")
        assert response.status_code == 200, f"Next session check failed: {response.text}"
        data = response.json()
        assert data.get("is_live") == True, f"Expected is_live=True, got {data.get('is_live')}"
        assert data.get("dj_name") == "TEST_DJ_Flow", f"Expected dj_name='TEST_DJ_Flow', got {data.get('dj_name')}"
        print(f"DJ is live: {data}")
    
    def test_04_checkin_includes_dj(self):
        """Test GET /api/checkin/{location_slug} includes the checked-in DJ"""
        response = requests.get(f"{BASE_URL}/api/checkin/{TestDJFlow.test_location}")
        assert response.status_code == 200, f"Checkin list failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of check-ins"
        
        # Find the DJ in the list
        dj_found = False
        for checkin in data:
            if "DJ TEST_DJ_Flow" in checkin.get("display_name", "") or checkin.get("mood") == "🎵 Live DJ":
                dj_found = True
                print(f"Found DJ in checkins: {checkin}")
                break
        
        assert dj_found, f"DJ not found in checkins list: {data}"
    
    def test_05_wall_users_includes_dj(self):
        """Test GET /api/wall/users/{location_slug} includes the checked-in DJ"""
        response = requests.get(f"{BASE_URL}/api/wall/users/{TestDJFlow.test_location}")
        assert response.status_code == 200, f"Wall users failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of users"
        
        # Find the DJ in the list
        dj_found = False
        for user in data:
            if "DJ TEST_DJ_Flow" in user.get("user_name", "") or user.get("user_id") == TestDJFlow.test_dj_id:
                dj_found = True
                print(f"Found DJ in wall users: {user}")
                break
        
        assert dj_found, f"DJ not found in wall users list: {data}"
    
    def test_06_dj_at_location(self):
        """Test GET /api/dj/at-location/{location_slug} returns DJ info"""
        response = requests.get(f"{BASE_URL}/api/dj/at-location/{TestDJFlow.test_location}")
        assert response.status_code == 200, f"DJ at location failed: {response.text}"
        data = response.json()
        assert data.get("checked_in") == True, f"Expected checked_in=True, got {data.get('checked_in')}"
        assert data.get("dj_id") == TestDJFlow.test_dj_id, f"DJ ID mismatch"
        print(f"DJ at location: {data}")
    
    def test_07_dj_checkout(self):
        """Test DJ checkout via POST /api/dj/checkout/{dj_id}"""
        assert TestDJFlow.test_dj_id, "DJ ID not set"
        response = requests.post(f"{BASE_URL}/api/dj/checkout/{TestDJFlow.test_dj_id}")
        assert response.status_code == 200, f"DJ checkout failed: {response.text}"
        print("DJ checked out successfully")
    
    def test_08_dj_no_longer_live(self):
        """Test GET /api/dj/next-session/{location_slug} returns is_live: false after checkout"""
        response = requests.get(f"{BASE_URL}/api/dj/next-session/{TestDJFlow.test_location}")
        assert response.status_code == 200, f"Next session check failed: {response.text}"
        data = response.json()
        assert data.get("is_live") == False, f"Expected is_live=False after checkout, got {data.get('is_live')}"
        print(f"DJ is no longer live: {data}")
    
    def test_09_checkin_no_longer_includes_dj(self):
        """Test GET /api/checkin/{location_slug} no longer includes the DJ after checkout"""
        response = requests.get(f"{BASE_URL}/api/checkin/{TestDJFlow.test_location}")
        assert response.status_code == 200, f"Checkin list failed: {response.text}"
        data = response.json()
        
        # DJ should not be in the list
        for checkin in data:
            if "DJ TEST_DJ_Flow" in checkin.get("display_name", "") and checkin.get("mood") == "🎵 Live DJ":
                pytest.fail(f"DJ still in checkins after checkout: {checkin}")
        
        print("DJ correctly removed from checkins after checkout")
    
    def test_10_cleanup_test_dj(self):
        """Cleanup: Delete the test DJ profile"""
        if TestDJFlow.test_dj_id:
            # Try to delete via admin endpoint
            response = requests.delete(f"{BASE_URL}/api/admin/dj/profiles/{TestDJFlow.test_dj_id}")
            print(f"Cleanup response: {response.status_code}")


class TestDJSongRequestFlow:
    """Test song request functionality when DJ is live"""
    
    test_dj_id = None
    test_location = "midtown-atlanta"
    
    def test_01_setup_dj_checkin(self):
        """Setup: Login and check-in a DJ"""
        # Login
        response = requests.post(f"{BASE_URL}/api/dj/login", json={
            "name": "TEST_DJ_SongReq"
        })
        assert response.status_code == 200
        TestDJSongRequestFlow.test_dj_id = response.json()["id"]
        
        # Check-in
        response = requests.post(
            f"{BASE_URL}/api/dj/checkin/{TestDJSongRequestFlow.test_dj_id}?location_slug={TestDJSongRequestFlow.test_location}"
        )
        assert response.status_code == 200
        print(f"DJ checked in for song request tests")
    
    def test_02_submit_song_request(self):
        """Test submitting a song request when DJ is live"""
        response = requests.post(f"{BASE_URL}/api/social/song-request", json={
            "location_slug": TestDJSongRequestFlow.test_location,
            "name": "Test User",
            "song": "Test Song Title",
            "artist": "Test Artist",
            "request_type": "song"
        })
        assert response.status_code == 200, f"Song request failed: {response.text}"
        data = response.json()
        assert "id" in data, "Song request response missing 'id'"
        assert data.get("status") == "pending", f"Expected status='pending', got {data.get('status')}"
        print(f"Song request submitted: {data}")
    
    def test_03_get_song_requests(self):
        """Test getting song requests for a location"""
        response = requests.get(f"{BASE_URL}/api/social/song-requests/{TestDJSongRequestFlow.test_location}")
        assert response.status_code == 200, f"Get song requests failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of song requests"
        print(f"Song requests: {len(data)} found")
    
    def test_04_cleanup_dj_checkout(self):
        """Cleanup: Checkout DJ"""
        if TestDJSongRequestFlow.test_dj_id:
            requests.post(f"{BASE_URL}/api/dj/checkout/{TestDJSongRequestFlow.test_dj_id}")
            requests.delete(f"{BASE_URL}/api/admin/dj/profiles/{TestDJSongRequestFlow.test_dj_id}")
            print("Cleanup completed")


class TestExistingDJs:
    """Test with existing DJs in the system"""
    
    def test_01_get_scheduled_dj_names(self):
        """Test GET /api/dj/weekly-schedule/names/all returns DJ names"""
        response = requests.get(f"{BASE_URL}/api/dj/weekly-schedule/names/all")
        assert response.status_code == 200, f"Get DJ names failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of DJ names"
        print(f"Scheduled DJ names: {data}")
    
    def test_02_get_dj_profiles(self):
        """Test GET /api/dj/profiles returns DJ profiles"""
        response = requests.get(f"{BASE_URL}/api/dj/profiles")
        assert response.status_code == 200, f"Get DJ profiles failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of DJ profiles"
        print(f"DJ profiles count: {len(data)}")
    
    def test_03_get_locations(self):
        """Test GET /api/locations returns locations"""
        response = requests.get(f"{BASE_URL}/api/locations")
        assert response.status_code == 200, f"Get locations failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of locations"
        assert len(data) > 0, "Expected at least one location"
        print(f"Locations: {[loc.get('slug') for loc in data]}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
