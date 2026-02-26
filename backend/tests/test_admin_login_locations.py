"""
Admin Login & Location API Tests
Tests admin login and location update functionality
Credentials: admin / $outhcentral
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
assert BASE_URL, "REACT_APP_BACKEND_URL environment variable must be set"
BASE_URL = BASE_URL.rstrip('/')

# Admin credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "$outhcentral"


class TestAdminLogin:
    """Test admin login functionality"""
    
    def test_admin_login_with_username_and_password(self):
        """POST /api/auth/login - Admin can login with username 'admin' and password '$outhcentral'"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Response should contain access_token"
        assert "token_type" in data, "Response should contain token_type"
        assert data["token_type"] == "bearer", "Token type should be 'bearer'"
        assert len(data["access_token"]) > 0, "Access token should not be empty"
        
        print(f"✓ Admin login successful, received token")
        return data["access_token"]
    
    def test_admin_login_wrong_password_returns_401(self):
        """POST /api/auth/login - Wrong password returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Wrong password correctly returns 401")
    
    def test_admin_login_wrong_username_returns_401(self):
        """POST /api/auth/login - Wrong username returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "wronguser",
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Wrong username correctly returns 401")
    
    def test_admin_me_endpoint_with_valid_token(self):
        """GET /api/auth/me - Returns admin info with valid token"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["access_token"]
        
        # Then check /auth/me
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "username" in data, "Response should contain username"
        assert "is_admin" in data, "Response should contain is_admin"
        assert data["is_admin"] == True, "User should be admin"
        
        print(f"✓ /auth/me returned admin user: {data['username']}")
    
    def test_admin_me_endpoint_without_token_returns_401(self):
        """GET /api/auth/me - Returns 401/403 without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ /auth/me correctly rejects unauthenticated requests")


class TestLocationUpdate:
    """Test location update functionality"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.status_code}"
        return response.json()["access_token"]
    
    def test_get_admin_locations_requires_auth(self):
        """GET /api/admin/locations - Requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/locations")
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Admin locations endpoint requires authentication")
    
    def test_get_admin_locations_returns_list(self, auth_token):
        """GET /api/admin/locations - Returns list of locations"""
        response = requests.get(
            f"{BASE_URL}/api/admin/locations",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        locations = response.json()
        assert isinstance(locations, list), "Response should be a list"
        assert len(locations) >= 8, f"Expected at least 8 locations, got {len(locations)}"
        
        # Verify location structure
        for loc in locations:
            assert "id" in loc, "Location should have id"
            assert "name" in loc, "Location should have name"
            assert "slug" in loc, "Location should have slug"
        
        print(f"✓ GET /api/admin/locations returned {len(locations)} locations")
        return locations
    
    def test_update_location_phone_number(self, auth_token):
        """PUT /api/admin/locations/{id} - Can update location phone number"""
        # Get locations first
        locations_response = requests.get(
            f"{BASE_URL}/api/admin/locations",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        locations = locations_response.json()
        location_id = locations[0]["id"]
        original_phone = locations[0]["phone"]
        
        # Update phone number
        new_phone = "(404) 555-TEST"
        update_response = requests.put(
            f"{BASE_URL}/api/admin/locations/{location_id}",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={"phone": new_phone}
        )
        
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        
        # Verify update
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/locations",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        updated_location = next(loc for loc in verify_response.json() if loc["id"] == location_id)
        assert updated_location["phone"] == new_phone, f"Phone not updated: {updated_location['phone']}"
        
        print(f"✓ Location phone updated to: {new_phone}")
        
        # Restore original phone
        restore_response = requests.put(
            f"{BASE_URL}/api/admin/locations/{location_id}",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={"phone": original_phone}
        )
        assert restore_response.status_code == 200, "Failed to restore original phone"
        print(f"✓ Phone restored to: {original_phone}")
    
    def test_update_location_name(self, auth_token):
        """PUT /api/admin/locations/{id} - Can update location name"""
        # Get locations
        locations_response = requests.get(
            f"{BASE_URL}/api/admin/locations",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        locations = locations_response.json()
        location_id = locations[0]["id"]
        original_name = locations[0]["name"]
        
        # Update name
        test_name = "Fin & Feathers - Test Location"
        update_response = requests.put(
            f"{BASE_URL}/api/admin/locations/{location_id}",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={"name": test_name}
        )
        
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}"
        
        # Verify
        verify_response = requests.get(f"{BASE_URL}/api/locations/{locations[0]['slug']}")
        assert verify_response.json()["name"] == test_name, "Name not updated"
        
        print(f"✓ Location name updated")
        
        # Restore
        requests.put(
            f"{BASE_URL}/api/admin/locations/{location_id}",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={"name": original_name}
        )
        print(f"✓ Name restored")
    
    def test_update_nonexistent_location_returns_404(self, auth_token):
        """PUT /api/admin/locations/{id} - Returns 404 for nonexistent location"""
        response = requests.put(
            f"{BASE_URL}/api/admin/locations/nonexistent-location-id",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={"phone": "(123) 456-7890"}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Nonexistent location correctly returns 404")
    
    def test_update_location_without_auth_returns_401(self):
        """PUT /api/admin/locations/{id} - Returns 401/403 without auth"""
        response = requests.put(
            f"{BASE_URL}/api/admin/locations/any-id",
            headers={"Content-Type": "application/json"},
            json={"phone": "(123) 456-7890"}
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Location update correctly requires authentication")


class TestPublicLocationsPage:
    """Test public locations endpoint"""
    
    def test_get_public_locations(self):
        """GET /api/locations - Returns all public locations"""
        response = requests.get(f"{BASE_URL}/api/locations")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        locations = response.json()
        assert isinstance(locations, list), "Response should be a list"
        assert len(locations) == 8, f"Expected 8 locations, got {len(locations)}"
        
        # Check expected locations
        slugs = [loc["slug"] for loc in locations]
        expected_slugs = ["edgewood-atlanta", "midtown-atlanta", "douglasville", 
                         "riverdale", "valdosta", "albany", "stone-mountain", "las-vegas"]
        
        for slug in expected_slugs:
            assert slug in slugs, f"Missing expected location: {slug}"
        
        print(f"✓ GET /api/locations returned all 8 locations")
    
    def test_get_location_by_slug(self):
        """GET /api/locations/{slug} - Returns specific location"""
        response = requests.get(f"{BASE_URL}/api/locations/edgewood-atlanta")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        location = response.json()
        assert location["slug"] == "edgewood-atlanta"
        assert "Edgewood" in location["name"]
        assert "phone" in location
        assert "address" in location
        
        print(f"✓ GET /api/locations/edgewood-atlanta returned: {location['name']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
