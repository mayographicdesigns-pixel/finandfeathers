"""
Test Location Visibility Toggle Feature
Tests the ability for admin to toggle location visibility (is_active field)
Hidden locations should NOT appear on public /api/locations but SHOULD appear in /api/admin/locations
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestLocationVisibilityToggle:
    """Tests for location visibility toggle feature"""
    
    auth_token = None
    test_location_id = None
    hibachi_location_id = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token before each test"""
        if not TestLocationVisibilityToggle.auth_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "username": "admin",
                "password": "$outhcentral"
            })
            assert response.status_code == 200, f"Admin login failed: {response.text}"
            TestLocationVisibilityToggle.auth_token = response.json()["access_token"]
    
    @property
    def headers(self):
        return {"Authorization": f"Bearer {TestLocationVisibilityToggle.auth_token}"}
    
    # ----- Test 1: Public locations API only returns active locations -----
    def test_01_public_locations_api_returns_only_active(self):
        """GET /api/locations should only return is_active: true locations"""
        response = requests.get(f"{BASE_URL}/api/locations")
        assert response.status_code == 200, f"Failed to get public locations: {response.text}"
        
        locations = response.json()
        assert isinstance(locations, list), "Response should be a list"
        
        # All locations in public endpoint should be active (or not have is_active field at all)
        for loc in locations:
            # is_active should be true or not present (defaults to true)
            is_active = loc.get("is_active", True)
            assert is_active == True, f"Location {loc.get('name')} should be active in public API but is_active={is_active}"
        
        print(f"✓ Public API returned {len(locations)} active locations")
    
    # ----- Test 2: Admin locations API returns all locations -----
    def test_02_admin_locations_api_returns_all(self):
        """GET /api/admin/locations should return all locations including inactive"""
        response = requests.get(f"{BASE_URL}/api/admin/locations", headers=self.headers)
        assert response.status_code == 200, f"Failed to get admin locations: {response.text}"
        
        locations = response.json()
        assert isinstance(locations, list), "Response should be a list"
        assert len(locations) > 0, "Admin should see at least one location"
        
        # Find Hibachi Food Truck for testing
        hibachi = next((loc for loc in locations if "Hibachi" in loc.get("name", "")), None)
        if hibachi:
            TestLocationVisibilityToggle.hibachi_location_id = hibachi.get("id")
            print(f"✓ Found Hibachi Food Truck: {hibachi.get('name')} (ID: {hibachi.get('id')}, is_active: {hibachi.get('is_active', True)})")
        else:
            print("Note: Hibachi Food Truck not found, will use first available location")
            TestLocationVisibilityToggle.hibachi_location_id = locations[0].get("id")
        
        print(f"✓ Admin API returned {len(locations)} locations (including hidden)")
    
    # ----- Test 3: Toggle location to hidden (is_active: false) -----
    def test_03_toggle_location_to_hidden(self):
        """PUT /api/admin/locations/{id} with is_active: false should hide location"""
        location_id = TestLocationVisibilityToggle.hibachi_location_id
        assert location_id, "No location ID found for testing"
        
        # Update location to hidden
        response = requests.put(
            f"{BASE_URL}/api/admin/locations/{location_id}",
            headers=self.headers,
            json={"is_active": False}
        )
        assert response.status_code == 200, f"Failed to update location: {response.text}"
        print(f"✓ Updated location {location_id} to is_active=False")
        
        # Verify the change was saved
        admin_response = requests.get(f"{BASE_URL}/api/admin/locations", headers=self.headers)
        assert admin_response.status_code == 200
        locations = admin_response.json()
        
        updated_loc = next((loc for loc in locations if loc.get("id") == location_id), None)
        assert updated_loc is not None, "Location should still be visible in admin API"
        assert updated_loc.get("is_active") == False, f"Location is_active should be False, got {updated_loc.get('is_active')}"
        
        print(f"✓ Verified location {updated_loc.get('name')} is now hidden (is_active=False)")
    
    # ----- Test 4: Hidden location should NOT appear in public API -----
    def test_04_hidden_location_not_in_public_api(self):
        """Hidden location should NOT appear in GET /api/locations"""
        location_id = TestLocationVisibilityToggle.hibachi_location_id
        assert location_id, "No location ID found for testing"
        
        response = requests.get(f"{BASE_URL}/api/locations")
        assert response.status_code == 200
        
        locations = response.json()
        hidden_loc = next((loc for loc in locations if loc.get("id") == location_id), None)
        
        assert hidden_loc is None, f"Hidden location should NOT appear in public API but found: {hidden_loc}"
        print(f"✓ Hidden location {location_id} correctly NOT shown in public API")
    
    # ----- Test 5: Hidden location SHOULD appear in admin API -----
    def test_05_hidden_location_visible_in_admin_api(self):
        """Hidden location should still appear in GET /api/admin/locations"""
        location_id = TestLocationVisibilityToggle.hibachi_location_id
        assert location_id, "No location ID found for testing"
        
        response = requests.get(f"{BASE_URL}/api/admin/locations", headers=self.headers)
        assert response.status_code == 200
        
        locations = response.json()
        hidden_loc = next((loc for loc in locations if loc.get("id") == location_id), None)
        
        assert hidden_loc is not None, "Hidden location SHOULD appear in admin API"
        assert hidden_loc.get("is_active") == False, "Location should still be marked as is_active=False"
        print(f"✓ Hidden location {hidden_loc.get('name')} correctly visible in admin API")
    
    # ----- Test 6: Toggle location back to visible (is_active: true) -----
    def test_06_toggle_location_to_visible(self):
        """PUT /api/admin/locations/{id} with is_active: true should show location"""
        location_id = TestLocationVisibilityToggle.hibachi_location_id
        assert location_id, "No location ID found for testing"
        
        # Update location to visible
        response = requests.put(
            f"{BASE_URL}/api/admin/locations/{location_id}",
            headers=self.headers,
            json={"is_active": True}
        )
        assert response.status_code == 200, f"Failed to update location: {response.text}"
        print(f"✓ Updated location {location_id} to is_active=True")
        
        # Verify in admin API
        admin_response = requests.get(f"{BASE_URL}/api/admin/locations", headers=self.headers)
        assert admin_response.status_code == 200
        locations = admin_response.json()
        
        updated_loc = next((loc for loc in locations if loc.get("id") == location_id), None)
        assert updated_loc is not None, "Location should be visible in admin API"
        assert updated_loc.get("is_active") == True, f"Location is_active should be True, got {updated_loc.get('is_active')}"
        
        print(f"✓ Verified location {updated_loc.get('name')} is now visible (is_active=True)")
    
    # ----- Test 7: Visible location should appear in public API -----
    def test_07_visible_location_in_public_api(self):
        """Visible location should appear in GET /api/locations"""
        location_id = TestLocationVisibilityToggle.hibachi_location_id
        assert location_id, "No location ID found for testing"
        
        response = requests.get(f"{BASE_URL}/api/locations")
        assert response.status_code == 200
        
        locations = response.json()
        visible_loc = next((loc for loc in locations if loc.get("id") == location_id), None)
        
        assert visible_loc is not None, f"Visible location SHOULD appear in public API"
        assert visible_loc.get("is_active", True) == True, "Location should be is_active=True"
        print(f"✓ Visible location {visible_loc.get('name')} correctly shown in public API")
    
    # ----- Test 8: Auth required for admin locations -----
    def test_08_admin_locations_requires_auth(self):
        """GET /api/admin/locations without auth should return 403"""
        response = requests.get(f"{BASE_URL}/api/admin/locations")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Admin locations endpoint correctly requires authentication")
    
    # ----- Test 9: Update location requires auth -----
    def test_09_update_location_requires_auth(self):
        """PUT /api/admin/locations/{id} without auth should return 403"""
        location_id = TestLocationVisibilityToggle.hibachi_location_id
        if not location_id:
            pytest.skip("No location ID available for test")
        
        response = requests.put(
            f"{BASE_URL}/api/admin/locations/{location_id}",
            json={"is_active": False}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Update location endpoint correctly requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
