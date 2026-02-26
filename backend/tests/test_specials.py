"""
Test suite for Specials API endpoints
Tests: CRUD operations for specials, location filtering, notifications
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://restaurant-admin-hub-1.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"


class TestSpecialsAPI:
    """Tests for Specials API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token for admin endpoints"""
        # Login to get token
        response = requests.post(f"{API_URL}/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        assert response.status_code == 200, "Login failed"
        self.token = response.json()["access_token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        self.created_specials = []  # Track created specials for cleanup
        yield
        # Cleanup - delete test specials
        for special_id in self.created_specials:
            try:
                requests.delete(f"{API_URL}/admin/specials/{special_id}", headers=self.headers)
            except:
                pass
    
    def test_get_public_specials(self):
        """Test GET /api/specials - public endpoint"""
        response = requests.get(f"{API_URL}/specials")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/specials returned {len(data)} specials")
    
    def test_get_admin_specials_requires_auth(self):
        """Test GET /api/admin/specials requires authentication"""
        response = requests.get(f"{API_URL}/admin/specials")
        assert response.status_code in [401, 403], "Should require authentication"
        print("✓ GET /api/admin/specials requires auth")
    
    def test_get_admin_specials_with_auth(self):
        """Test GET /api/admin/specials with valid auth"""
        response = requests.get(f"{API_URL}/admin/specials", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/admin/specials returned {len(data)} specials")
    
    def test_create_special_with_location(self):
        """Test POST /api/admin/specials - create special with location"""
        test_id = str(uuid.uuid4())[:8]
        payload = {
            "title": f"TEST_{test_id} Special",
            "description": "Test special for automated testing",
            "image": "https://example.com/image.jpg",
            "location_id": "midtown-atlanta",
            "send_notification": False
        }
        
        response = requests.post(f"{API_URL}/admin/specials", headers=self.headers, json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "special" in data
        special = data["special"]
        assert special["title"] == payload["title"]
        assert special["description"] == payload["description"]
        assert special["location_id"] == payload["location_id"]
        assert special["is_active"] == True
        assert "id" in special
        
        # Track for cleanup
        self.created_specials.append(special["id"])
        
        # Verify it appears in GET
        get_response = requests.get(f"{API_URL}/admin/specials", headers=self.headers)
        specials = get_response.json()
        found = any(s["id"] == special["id"] for s in specials)
        assert found, "Created special not found in list"
        
        print(f"✓ Created special with location: {special['id']}")
    
    def test_create_special_global(self):
        """Test POST /api/admin/specials - create global special (no location)"""
        test_id = str(uuid.uuid4())[:8]
        payload = {
            "title": f"TEST_{test_id} Global Special",
            "description": "Global test special",
            "location_id": None,
            "send_notification": False
        }
        
        response = requests.post(f"{API_URL}/admin/specials", headers=self.headers, json=payload)
        assert response.status_code == 200
        data = response.json()
        special = data["special"]
        
        assert special["location_id"] is None
        self.created_specials.append(special["id"])
        print(f"✓ Created global special: {special['id']}")
    
    def test_update_special(self):
        """Test PUT /api/admin/specials/{id} - update special"""
        # First create a special
        test_id = str(uuid.uuid4())[:8]
        create_payload = {
            "title": f"TEST_{test_id} Original",
            "description": "Original description",
            "location_id": "edgewood-atlanta",
            "send_notification": False
        }
        create_response = requests.post(f"{API_URL}/admin/specials", headers=self.headers, json=create_payload)
        assert create_response.status_code == 200
        special_id = create_response.json()["special"]["id"]
        self.created_specials.append(special_id)
        
        # Update the special
        update_payload = {
            "title": f"TEST_{test_id} Updated",
            "description": "Updated description",
            "location_id": "midtown-atlanta"
        }
        update_response = requests.put(f"{API_URL}/admin/specials/{special_id}", headers=self.headers, json=update_payload)
        assert update_response.status_code == 200
        
        # Verify update
        get_response = requests.get(f"{API_URL}/admin/specials", headers=self.headers)
        specials = get_response.json()
        updated_special = next((s for s in specials if s["id"] == special_id), None)
        
        assert updated_special is not None
        assert updated_special["title"] == update_payload["title"]
        assert updated_special["location_id"] == update_payload["location_id"]
        
        print(f"✓ Updated special: {special_id}")
    
    def test_toggle_special_active_status(self):
        """Test PUT /api/admin/specials/{id} - toggle is_active"""
        # Create a special
        test_id = str(uuid.uuid4())[:8]
        create_payload = {
            "title": f"TEST_{test_id} Toggle",
            "description": "Test toggle active status",
            "send_notification": False
        }
        create_response = requests.post(f"{API_URL}/admin/specials", headers=self.headers, json=create_payload)
        assert create_response.status_code == 200
        special_id = create_response.json()["special"]["id"]
        self.created_specials.append(special_id)
        
        # Deactivate
        deactivate_response = requests.put(
            f"{API_URL}/admin/specials/{special_id}", 
            headers=self.headers, 
            json={"is_active": False}
        )
        assert deactivate_response.status_code == 200
        
        # Verify deactivation
        get_response = requests.get(f"{API_URL}/admin/specials", headers=self.headers)
        specials = get_response.json()
        special = next((s for s in specials if s["id"] == special_id), None)
        assert special["is_active"] == False
        
        print(f"✓ Toggled special active status: {special_id}")
    
    def test_delete_special(self):
        """Test DELETE /api/admin/specials/{id}"""
        # Create a special to delete
        test_id = str(uuid.uuid4())[:8]
        create_payload = {
            "title": f"TEST_{test_id} Delete",
            "description": "Special to be deleted",
            "send_notification": False
        }
        create_response = requests.post(f"{API_URL}/admin/specials", headers=self.headers, json=create_payload)
        assert create_response.status_code == 200
        special_id = create_response.json()["special"]["id"]
        
        # Delete the special
        delete_response = requests.delete(f"{API_URL}/admin/specials/{special_id}", headers=self.headers)
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{API_URL}/admin/specials", headers=self.headers)
        specials = get_response.json()
        found = any(s["id"] == special_id for s in specials)
        assert not found, "Deleted special still exists"
        
        print(f"✓ Deleted special: {special_id}")
    
    def test_delete_nonexistent_special(self):
        """Test DELETE /api/admin/specials/{id} - nonexistent"""
        fake_id = str(uuid.uuid4())
        response = requests.delete(f"{API_URL}/admin/specials/{fake_id}", headers=self.headers)
        assert response.status_code == 404
        print("✓ DELETE nonexistent special returns 404")
    
    def test_public_specials_only_shows_active(self):
        """Test public endpoint only shows active specials"""
        # Create two specials - one active, one inactive
        test_id = str(uuid.uuid4())[:8]
        
        # Create active special
        active_payload = {
            "title": f"TEST_{test_id} Active",
            "description": "Active special",
            "send_notification": False
        }
        active_response = requests.post(f"{API_URL}/admin/specials", headers=self.headers, json=active_payload)
        active_id = active_response.json()["special"]["id"]
        self.created_specials.append(active_id)
        
        # Create and deactivate special
        inactive_payload = {
            "title": f"TEST_{test_id} Inactive",
            "description": "Inactive special",
            "send_notification": False
        }
        inactive_response = requests.post(f"{API_URL}/admin/specials", headers=self.headers, json=inactive_payload)
        inactive_id = inactive_response.json()["special"]["id"]
        self.created_specials.append(inactive_id)
        
        # Deactivate
        requests.put(f"{API_URL}/admin/specials/{inactive_id}", headers=self.headers, json={"is_active": False})
        
        # Get public specials
        public_response = requests.get(f"{API_URL}/specials")
        public_specials = public_response.json()
        
        # Active should be visible
        active_visible = any(s["id"] == active_id for s in public_specials)
        assert active_visible, "Active special not visible in public endpoint"
        
        # Inactive should not be visible
        inactive_visible = any(s["id"] == inactive_id for s in public_specials)
        assert not inactive_visible, "Inactive special visible in public endpoint"
        
        print("✓ Public endpoint correctly filters active specials")
    
    def test_resend_notification(self):
        """Test POST /api/admin/specials/{id}/notify"""
        # Create a special
        test_id = str(uuid.uuid4())[:8]
        create_payload = {
            "title": f"TEST_{test_id} Notification",
            "description": "Test notification resend",
            "send_notification": False
        }
        create_response = requests.post(f"{API_URL}/admin/specials", headers=self.headers, json=create_payload)
        special_id = create_response.json()["special"]["id"]
        self.created_specials.append(special_id)
        
        # Resend notification
        notify_response = requests.post(f"{API_URL}/admin/specials/{special_id}/notify", headers=self.headers)
        assert notify_response.status_code == 200
        data = notify_response.json()
        assert "result" in data
        
        print(f"✓ Resend notification for special: {special_id}")


class TestSpecialsLocationFiltering:
    """Tests for location-based filtering of specials"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        self.token = response.json()["access_token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        self.created_specials = []
        yield
        for special_id in self.created_specials:
            try:
                requests.delete(f"{API_URL}/admin/specials/{special_id}", headers=self.headers)
            except:
                pass
    
    def test_specials_with_different_locations(self):
        """Test creating specials for different locations"""
        test_id = str(uuid.uuid4())[:8]
        locations = ["edgewood-atlanta", "midtown-atlanta", "douglasville"]
        
        for location in locations:
            payload = {
                "title": f"TEST_{test_id} {location}",
                "description": f"Special for {location}",
                "location_id": location,
                "send_notification": False
            }
            response = requests.post(f"{API_URL}/admin/specials", headers=self.headers, json=payload)
            assert response.status_code == 200
            self.created_specials.append(response.json()["special"]["id"])
        
        # Verify all appear in admin list
        get_response = requests.get(f"{API_URL}/admin/specials", headers=self.headers)
        specials = get_response.json()
        
        for location in locations:
            found = any(
                s.get("location_id") == location and f"TEST_{test_id}" in s.get("title", "")
                for s in specials
            )
            assert found, f"Special for {location} not found"
        
        print(f"✓ Created specials for {len(locations)} different locations")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
