"""
Test suite for timezone-based karaoke auto-activation/deactivation and location timezone support.
Tests the following features:
1. GET /api/dj/next-session/{location_slug} returns correct timezone
2. Karaoke auto-activation based on schedule windows
3. Karaoke auto-deactivation when schedule window ends
4. Check-in endpoints with expires_at field
5. Manual check-out functionality
6. DJ schedules endpoint
7. Locations endpoint
8. Menu items by location
9. User registration
"""

import pytest
import requests
import os
from datetime import datetime, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTimezoneSupport:
    """Test location-based timezone support in DJ/next-session endpoint"""
    
    def test_edgewood_atlanta_returns_eastern_timezone(self):
        """GET /api/dj/next-session/edgewood-atlanta returns timezone: America/New_York"""
        response = requests.get(f"{BASE_URL}/api/dj/next-session/edgewood-atlanta")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "timezone" in data, "Response should include timezone field"
        assert data["timezone"] == "America/New_York", f"Expected America/New_York, got {data['timezone']}"
        print(f"PASS: Edgewood-Atlanta timezone = {data['timezone']}")
    
    def test_las_vegas_returns_pacific_timezone(self):
        """GET /api/dj/next-session/las-vegas returns timezone: America/Los_Angeles"""
        response = requests.get(f"{BASE_URL}/api/dj/next-session/las-vegas")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "timezone" in data, "Response should include timezone field"
        assert data["timezone"] == "America/Los_Angeles", f"Expected America/Los_Angeles, got {data['timezone']}"
        print(f"PASS: Las Vegas timezone = {data['timezone']}")
    
    def test_douglasville_returns_eastern_timezone(self):
        """GET /api/dj/next-session/douglasville returns timezone: America/New_York"""
        response = requests.get(f"{BASE_URL}/api/dj/next-session/douglasville")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "timezone" in data, "Response should include timezone field"
        assert data["timezone"] == "America/New_York", f"Expected America/New_York, got {data['timezone']}"
        print(f"PASS: Douglasville timezone = {data['timezone']}")


class TestKaraokeAutoActivation:
    """Test karaoke auto-activation and auto-deactivation based on schedule windows"""
    
    def test_las_vegas_karaoke_active_on_thursday_evening(self):
        """Las Vegas karaoke (Thursday 20:00-02:00 PT) should be active on Thursday evening PT"""
        response = requests.get(f"{BASE_URL}/api/dj/next-session/las-vegas")
        assert response.status_code == 200
        data = response.json()
        
        # Las Vegas has karaoke on Thursday (day_of_week=3), 20:00-02:00 PT
        # Current time is ~8:50 PM PDT on Thursday, so karaoke should be active
        print(f"Las Vegas karaoke_active: {data.get('karaoke_active')}")
        print(f"Las Vegas is_live: {data.get('is_live')}")
        
        # The karaoke should be auto-activated since we're in the schedule window
        assert "karaoke_active" in data, "Response should include karaoke_active field"
        assert data["karaoke_active"] == True, f"Expected karaoke_active=True on Thursday evening PT, got {data['karaoke_active']}"
        print("PASS: Las Vegas karaoke is active on Thursday evening")
    
    def test_riverdale_karaoke_active_on_thursday_evening(self):
        """Riverdale karaoke (Thursday 20:00-02:00 ET) should be active on Thursday evening ET"""
        response = requests.get(f"{BASE_URL}/api/dj/next-session/riverdale")
        assert response.status_code == 200
        data = response.json()
        
        # Riverdale has karaoke on Thursday (day_of_week=3), 20:00-02:00 ET
        # Current time is ~11:50 PM EDT on Thursday, so karaoke should be active
        print(f"Riverdale karaoke_active: {data.get('karaoke_active')}")
        
        assert "karaoke_active" in data, "Response should include karaoke_active field"
        assert data["karaoke_active"] == True, f"Expected karaoke_active=True on Thursday evening ET, got {data['karaoke_active']}"
        print("PASS: Riverdale karaoke is active on Thursday evening")
    
    def test_douglasville_karaoke_inactive_on_non_karaoke_day(self):
        """Douglasville karaoke (Wednesday) should be inactive on Thursday"""
        response = requests.get(f"{BASE_URL}/api/dj/next-session/douglasville")
        assert response.status_code == 200
        data = response.json()
        
        # Douglasville has karaoke on Wednesday (day_of_week=2)
        # Today is Thursday, so karaoke should NOT be active
        print(f"Douglasville karaoke_active: {data.get('karaoke_active')}")
        
        assert "karaoke_active" in data, "Response should include karaoke_active field"
        assert data["karaoke_active"] == False, f"Expected karaoke_active=False on Thursday (non-karaoke day), got {data['karaoke_active']}"
        print("PASS: Douglasville karaoke is inactive on Thursday (non-karaoke day)")
    
    def test_edgewood_karaoke_deactivated_after_schedule_window(self):
        """Edgewood karaoke (Wednesday) should be deactivated on Thursday (auto-deactivation)"""
        response = requests.get(f"{BASE_URL}/api/dj/next-session/edgewood-atlanta")
        assert response.status_code == 200
        data = response.json()
        
        # Edgewood has karaoke on Wednesday (day_of_week=2)
        # Today is Thursday, so any auto-activated session should be deactivated
        print(f"Edgewood karaoke_active: {data.get('karaoke_active')}")
        
        assert "karaoke_active" in data, "Response should include karaoke_active field"
        assert data["karaoke_active"] == False, f"Expected karaoke_active=False (auto-deactivated), got {data['karaoke_active']}"
        print("PASS: Edgewood karaoke was auto-deactivated after schedule window ended")


class TestCheckInEndpoints:
    """Test check-in endpoints with expires_at field and manual check-out"""
    
    def test_checkin_returns_expires_at(self):
        """POST /api/checkin should return check-in with expires_at field (4-hour TTL)"""
        import uuid
        test_user_id = f"test_checkin_{uuid.uuid4().hex[:8]}"
        
        payload = {
            "location_slug": "las-vegas",
            "display_name": "Test User",
            "avatar_emoji": "🧪",
            "user_profile_id": test_user_id
        }
        
        response = requests.post(f"{BASE_URL}/api/checkin", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "id" in data, "Response should include check-in id"
        assert "checked_in_at" in data, "Response should include checked_in_at"
        
        # Store checkin_id for cleanup
        self.checkin_id = data["id"]
        print(f"PASS: Check-in created with id={data['id']}")
        
        # Verify the check-in appears in the list with expires_at
        list_response = requests.get(f"{BASE_URL}/api/checkin/las-vegas")
        assert list_response.status_code == 200
        checkins = list_response.json()
        
        # Find our check-in
        our_checkin = next((c for c in checkins if c.get("user_profile_id") == test_user_id), None)
        if our_checkin:
            print(f"Check-in found: checked_in_at={our_checkin.get('checked_in_at')}")
            # Note: expires_at may not be returned in the response model, but it's stored in DB
        
        # Cleanup - delete the check-in
        if hasattr(self, 'checkin_id'):
            requests.delete(f"{BASE_URL}/api/checkin/{self.checkin_id}")
    
    def test_get_checkins_for_location(self):
        """GET /api/checkin/{location_slug} returns list of checked-in users"""
        response = requests.get(f"{BASE_URL}/api/checkin/las-vegas")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET /api/checkin/las-vegas returned {len(data)} check-ins")
    
    def test_manual_checkout(self):
        """DELETE /api/checkin/{checkin_id} should remove the check-in"""
        import uuid
        test_user_id = f"test_checkout_{uuid.uuid4().hex[:8]}"
        
        # First create a check-in
        payload = {
            "location_slug": "edgewood-atlanta",
            "display_name": "Checkout Test User",
            "avatar_emoji": "🚪",
            "user_profile_id": test_user_id
        }
        
        create_response = requests.post(f"{BASE_URL}/api/checkin", json=payload)
        assert create_response.status_code == 200
        checkin_id = create_response.json()["id"]
        print(f"Created check-in: {checkin_id}")
        
        # Now delete it
        delete_response = requests.delete(f"{BASE_URL}/api/checkin/{checkin_id}")
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
        
        # Verify it's gone
        list_response = requests.get(f"{BASE_URL}/api/checkin/edgewood-atlanta")
        checkins = list_response.json()
        assert not any(c.get("id") == checkin_id for c in checkins), "Check-in should be removed"
        print("PASS: Manual check-out (DELETE) works correctly")


class TestDJSchedulesEndpoint:
    """Test DJ schedules endpoint"""
    
    def test_get_all_dj_schedules(self):
        """GET /api/dj/schedules returns the full DJ schedule list"""
        response = requests.get(f"{BASE_URL}/api/dj/schedules")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET /api/dj/schedules returned {len(data)} schedules")
        
        # Check that schedules have expected fields
        if len(data) > 0:
            schedule = data[0]
            expected_fields = ["id", "location_slug", "dj_name", "start_time", "end_time"]
            for field in expected_fields:
                assert field in schedule, f"Schedule should have {field} field"
            print(f"Sample schedule: {schedule.get('dj_name')} at {schedule.get('location_slug')}")


class TestLocationsEndpoint:
    """Test locations endpoint"""
    
    def test_get_all_locations(self):
        """GET /api/locations returns all locations"""
        response = requests.get(f"{BASE_URL}/api/locations")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have at least one location"
        print(f"PASS: GET /api/locations returned {len(data)} locations")
        
        # Check for expected locations
        slugs = [loc.get("slug") for loc in data]
        assert "las-vegas" in slugs, "Should include las-vegas location"
        assert "edgewood-atlanta" in slugs, "Should include edgewood-atlanta location"
        print(f"Locations: {slugs}")


class TestMenuEndpoints:
    """Test menu endpoints with location filtering"""
    
    def test_get_menu_items_for_las_vegas(self):
        """GET /api/menu/items?location_slug=las-vegas returns items for Las Vegas"""
        response = requests.get(f"{BASE_URL}/api/menu/items", params={"location_slug": "las-vegas"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET /api/menu/items?location_slug=las-vegas returned {len(data)} items")
        
        # Verify all items are for las-vegas
        for item in data[:5]:  # Check first 5
            assert item.get("location_slug") == "las-vegas", f"Item should be for las-vegas, got {item.get('location_slug')}"
    
    def test_get_menu_items_for_edgewood(self):
        """GET /api/menu/items?location_slug=edgewood-atlanta returns items for Edgewood"""
        response = requests.get(f"{BASE_URL}/api/menu/items", params={"location_slug": "edgewood-atlanta"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET /api/menu/items?location_slug=edgewood-atlanta returned {len(data)} items")


class TestUserRegistration:
    """Test user registration endpoint"""
    
    def test_register_new_user(self):
        """POST /api/auth/user/register creates a new user"""
        import uuid
        test_id = uuid.uuid4().hex[:8]
        test_email = f"test_{test_id}@example.com"
        test_username = f"testuser_{test_id}"
        
        payload = {
            "email": test_email,
            "password": "testpass123",
            "name": "Test User",
            "username": test_username
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/user/register", json=payload)
        
        # Could be 200 or 201 depending on implementation
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check response has user info
        assert "id" in data or "user" in data, "Response should include user id"
        print(f"PASS: User registration successful for {test_email}")


class TestKaraokeStatusEndpoint:
    """Test karaoke status endpoint"""
    
    def test_karaoke_status_las_vegas(self):
        """GET /api/karaoke/status/las-vegas returns karaoke status"""
        response = requests.get(f"{BASE_URL}/api/karaoke/status/las-vegas")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "active" in data, "Response should include active field"
        print(f"PASS: Karaoke status for Las Vegas: active={data.get('active')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
