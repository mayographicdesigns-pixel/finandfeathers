"""
DJ Schedule Feature Backend Tests
Tests for DJ profiles, DJ schedules, and location page DJ integration
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDJPublicEndpoints:
    """Test public DJ endpoints (no auth required)"""
    
    def test_get_all_dj_schedules(self):
        """GET /api/dj/schedules returns all upcoming schedules"""
        response = requests.get(f"{BASE_URL}/api/dj/schedules")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Verify structure if schedules exist
        if len(data) > 0:
            schedule = data[0]
            assert "id" in schedule
            assert "dj_id" in schedule
            assert "dj_name" in schedule
            assert "location_slug" in schedule
            assert "location_name" in schedule
            assert "scheduled_date" in schedule
            assert "start_time" in schedule
            assert "end_time" in schedule
            print(f"Found {len(data)} upcoming DJ schedules")
    
    def test_get_location_schedules(self):
        """GET /api/dj/schedules/location/{slug} returns location-specific schedules"""
        # Test with edgewood-atlanta (known to have schedules from test data)
        response = requests.get(f"{BASE_URL}/api/dj/schedules/location/edgewood-atlanta")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # All schedules should be for edgewood-atlanta
        for schedule in data:
            assert schedule["location_slug"] == "edgewood-atlanta"
            print(f"Schedule: {schedule['dj_name']} on {schedule['scheduled_date']}")
    
    def test_get_dj_at_location_live(self):
        """GET /api/dj/at-location/{slug} returns DJ currently live at location"""
        # Test edgewood-atlanta where DJ Mike is checked in
        response = requests.get(f"{BASE_URL}/api/dj/at-location/edgewood-atlanta")
        
        # Could be null if no DJ is live
        if response.status_code == 200:
            data = response.json()
            if data:  # DJ is live
                assert "id" in data
                assert "name" in data
                assert "stage_name" in data or data.get("stage_name") is None
                assert "avatar_emoji" in data
                print(f"DJ Live: {data.get('stage_name') or data['name']}")
            else:
                print("No DJ currently live at edgewood-atlanta")
    
    def test_get_dj_at_location_no_dj(self):
        """GET /api/dj/at-location/{slug} returns null when no DJ is live"""
        # Test location unlikely to have DJ
        response = requests.get(f"{BASE_URL}/api/dj/at-location/nonexistent-location")
        assert response.status_code == 200
        data = response.json()
        assert data is None
    
    def test_get_all_dj_profiles_public(self):
        """GET /api/dj/profiles returns all active DJ profiles"""
        response = requests.get(f"{BASE_URL}/api/dj/profiles")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            profile = data[0]
            assert "id" in profile
            assert "name" in profile
            assert "avatar_emoji" in profile
            print(f"Found {len(data)} DJ profiles")


class TestDJAdminEndpoints:
    """Test admin DJ endpoints (require authentication)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token for authenticated requests"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "admin", "password": "$outhcentral"}
        )
        assert login_response.status_code == 200, "Admin login failed"
        self.token = login_response.json()["access_token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_admin_get_dj_profiles(self):
        """GET /api/admin/dj/profiles returns all DJ profiles for admin"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dj/profiles",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Admin found {len(data)} DJ profiles")
    
    def test_admin_create_dj_profile(self):
        """POST /api/admin/dj/profiles creates new DJ profile"""
        unique_id = uuid.uuid4().hex[:8]
        profile_data = {
            "name": f"TEST_DJ_{unique_id}",
            "stage_name": f"DJ Test {unique_id}",
            "avatar_emoji": "🎧",
            "cash_app_username": f"$TestDJ{unique_id}",
            "venmo_username": f"@TestDJ{unique_id}",
            "apple_pay_phone": "555-555-5555",
            "bio": "Test DJ bio for testing purposes"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/dj/profiles",
            headers=self.headers,
            json=profile_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == profile_data["name"]
        assert data["stage_name"] == profile_data["stage_name"]
        assert data["cash_app_username"] == profile_data["cash_app_username"]
        assert "id" in data
        print(f"Created DJ profile: {data['name']}")
        
        # Store for cleanup (optional)
        self.created_dj_id = data["id"]
    
    def test_admin_update_dj_profile(self):
        """PUT /api/admin/dj/profiles/{dj_id} updates DJ profile"""
        # First create a DJ to update
        unique_id = uuid.uuid4().hex[:8]
        create_response = requests.post(
            f"{BASE_URL}/api/admin/dj/profiles",
            headers=self.headers,
            json={
                "name": f"TEST_DJ_UPDATE_{unique_id}",
                "stage_name": f"DJ Update {unique_id}",
                "avatar_emoji": "🎧"
            }
        )
        assert create_response.status_code == 200
        dj_id = create_response.json()["id"]
        
        # Now update
        update_response = requests.put(
            f"{BASE_URL}/api/admin/dj/profiles/{dj_id}",
            headers=self.headers,
            json={
                "stage_name": f"DJ Updated {unique_id}",
                "bio": "Updated bio",
                "avatar_emoji": "🎤",
                "cash_app_username": "$UpdatedCashApp"
            }
        )
        assert update_response.status_code == 200
        
        data = update_response.json()
        assert data["stage_name"] == f"DJ Updated {unique_id}"
        assert data["bio"] == "Updated bio"
        assert data["avatar_emoji"] == "🎤"
        print(f"Updated DJ profile: {data['name']}")
    
    def test_admin_delete_dj_profile(self):
        """DELETE /api/admin/dj/profiles/{dj_id} deletes DJ profile"""
        # First create a DJ to delete
        unique_id = uuid.uuid4().hex[:8]
        create_response = requests.post(
            f"{BASE_URL}/api/admin/dj/profiles",
            headers=self.headers,
            json={
                "name": f"TEST_DJ_DELETE_{unique_id}",
                "stage_name": f"DJ Delete {unique_id}",
                "avatar_emoji": "🎧"
            }
        )
        assert create_response.status_code == 200
        dj_id = create_response.json()["id"]
        
        # Delete the DJ
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/dj/profiles/{dj_id}",
            headers=self.headers
        )
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(
            f"{BASE_URL}/api/dj/profile/{dj_id}"
        )
        assert get_response.status_code == 404
        print(f"Successfully deleted DJ profile {dj_id}")
    
    def test_admin_get_all_schedules(self):
        """GET /api/admin/dj/schedules returns all schedules for admin"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dj/schedules",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Admin found {len(data)} DJ schedules")
    
    def test_admin_create_schedule(self):
        """POST /api/admin/dj/schedules creates new DJ schedule"""
        # First, get a DJ profile to schedule
        dj_response = requests.get(
            f"{BASE_URL}/api/admin/dj/profiles",
            headers=self.headers
        )
        assert dj_response.status_code == 200
        djs = dj_response.json()
        
        if len(djs) == 0:
            pytest.skip("No DJ profiles available to schedule")
        
        dj_id = djs[0]["id"]
        
        # Create schedule
        schedule_data = {
            "dj_id": dj_id,
            "location_slug": "edgewood-atlanta",
            "scheduled_date": "2026-03-15",
            "start_time": "21:00",
            "end_time": "02:00",
            "is_recurring": False,
            "notes": "Test Schedule"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/dj/schedules",
            headers=self.headers,
            json=schedule_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["dj_id"] == dj_id
        assert data["location_slug"] == "edgewood-atlanta"
        assert data["scheduled_date"] == "2026-03-15"
        assert "location_name" in data
        assert "dj_name" in data
        print(f"Created schedule for {data['dj_name']} at {data['location_name']}")
        
        # Cleanup - delete the schedule
        requests.delete(
            f"{BASE_URL}/api/admin/dj/schedules/{data['id']}",
            headers=self.headers
        )
    
    def test_admin_create_recurring_schedule(self):
        """POST /api/admin/dj/schedules creates recurring schedule"""
        # First, get a DJ profile
        dj_response = requests.get(
            f"{BASE_URL}/api/admin/dj/profiles",
            headers=self.headers
        )
        djs = dj_response.json()
        
        if len(djs) == 0:
            pytest.skip("No DJ profiles available")
        
        dj_id = djs[0]["id"]
        
        # Create recurring schedule (every Friday)
        schedule_data = {
            "dj_id": dj_id,
            "location_slug": "midtown-atlanta",
            "scheduled_date": "2026-03-13",  # A Friday
            "start_time": "22:00",
            "end_time": "03:00",
            "is_recurring": True,
            "notes": "Weekly Friday Night"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/dj/schedules",
            headers=self.headers,
            json=schedule_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_recurring"] == True
        assert "day_of_week" in data  # Should be set for recurring
        print(f"Created recurring schedule: {data['dj_name']} - {data['notes']}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/admin/dj/schedules/{data['id']}",
            headers=self.headers
        )
    
    def test_admin_update_schedule(self):
        """PUT /api/admin/dj/schedules/{schedule_id} updates schedule"""
        # Get existing schedules
        schedules_response = requests.get(
            f"{BASE_URL}/api/admin/dj/schedules",
            headers=self.headers
        )
        schedules = schedules_response.json()
        
        if len(schedules) == 0:
            pytest.skip("No schedules to update")
        
        schedule_id = schedules[0]["id"]
        original_notes = schedules[0].get("notes", "")
        
        # Update schedule
        response = requests.put(
            f"{BASE_URL}/api/admin/dj/schedules/{schedule_id}",
            headers=self.headers,
            json={
                "notes": "Updated Test Notes",
                "start_time": "20:00"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["notes"] == "Updated Test Notes"
        assert data["start_time"] == "20:00"
        print(f"Updated schedule: {data['id']}")
        
        # Restore original
        requests.put(
            f"{BASE_URL}/api/admin/dj/schedules/{schedule_id}",
            headers=self.headers,
            json={"notes": original_notes}
        )
    
    def test_admin_delete_schedule(self):
        """DELETE /api/admin/dj/schedules/{schedule_id} deletes schedule"""
        # First create a schedule to delete
        dj_response = requests.get(
            f"{BASE_URL}/api/admin/dj/profiles",
            headers=self.headers
        )
        djs = dj_response.json()
        
        if len(djs) == 0:
            pytest.skip("No DJ profiles available")
        
        # Create a schedule
        create_response = requests.post(
            f"{BASE_URL}/api/admin/dj/schedules",
            headers=self.headers,
            json={
                "dj_id": djs[0]["id"],
                "location_slug": "edgewood-atlanta",
                "scheduled_date": "2026-12-25",
                "start_time": "21:00",
                "end_time": "02:00",
                "notes": "DELETE_TEST"
            }
        )
        assert create_response.status_code == 200
        schedule_id = create_response.json()["id"]
        
        # Delete it
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/dj/schedules/{schedule_id}",
            headers=self.headers
        )
        assert delete_response.status_code == 200
        print(f"Successfully deleted schedule {schedule_id}")


class TestDJIntegration:
    """Test DJ feature integration scenarios"""
    
    def test_location_page_dj_data_flow(self):
        """Test that location page can get DJ info and schedules"""
        location_slug = "edgewood-atlanta"
        
        # 1. Check for live DJ
        live_dj_response = requests.get(f"{BASE_URL}/api/dj/at-location/{location_slug}")
        assert live_dj_response.status_code == 200
        live_dj = live_dj_response.json()
        
        # 2. Get upcoming schedules
        schedules_response = requests.get(f"{BASE_URL}/api/dj/schedules/location/{location_slug}")
        assert schedules_response.status_code == 200
        schedules = schedules_response.json()
        
        # Log what the location page would show
        if live_dj:
            print(f"LIVE DJ BANNER: {live_dj.get('stage_name') or live_dj['name']} is LIVE!")
            if live_dj.get("cash_app_username"):
                print(f"  Tip via Cash App: {live_dj['cash_app_username']}")
            if live_dj.get("venmo_username"):
                print(f"  Tip via Venmo: {live_dj['venmo_username']}")
        else:
            print("No DJ currently live - show Upcoming DJs section")
        
        if len(schedules) > 0:
            print(f"UPCOMING DJs ({len(schedules)} scheduled):")
            for s in schedules[:3]:
                print(f"  - {s['dj_name']} on {s['scheduled_date']} at {s['start_time']}")


class TestDJAuthorizationSecurity:
    """Test that admin endpoints require authentication"""
    
    def test_admin_profiles_requires_auth(self):
        """Admin DJ profiles endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/dj/profiles")
        assert response.status_code == 403 or response.status_code == 401
    
    def test_admin_schedules_requires_auth(self):
        """Admin DJ schedules endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/dj/schedules")
        assert response.status_code == 403 or response.status_code == 401
    
    def test_create_dj_profile_requires_auth(self):
        """Creating DJ profile requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/admin/dj/profiles",
            json={"name": "Test", "avatar_emoji": "🎧"}
        )
        assert response.status_code == 403 or response.status_code == 401
    
    def test_create_schedule_requires_auth(self):
        """Creating DJ schedule requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/admin/dj/schedules",
            json={"dj_id": "test", "location_slug": "test", "scheduled_date": "2026-01-01"}
        )
        assert response.status_code == 403 or response.status_code == 401
