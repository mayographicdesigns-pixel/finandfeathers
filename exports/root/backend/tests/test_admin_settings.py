"""
Test suite for Admin Settings endpoints
Tests the Token Program and Loyalty Program toggle functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "$outhcentral"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return response.json()["access_token"]


@pytest.fixture
def admin_headers(admin_token):
    """Headers with admin authentication"""
    return {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }


class TestPublicSettingsEndpoint:
    """Tests for the public /api/settings endpoint"""
    
    def test_get_public_settings_success(self):
        """Test that public settings endpoint returns valid data"""
        response = requests.get(f"{BASE_URL}/api/settings")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Settings should have token_program_enabled and loyalty_program_enabled
        assert "token_program_enabled" in data, "Missing token_program_enabled field"
        assert "loyalty_program_enabled" in data, "Missing loyalty_program_enabled field"
        assert isinstance(data["token_program_enabled"], bool), "token_program_enabled should be boolean"
        assert isinstance(data["loyalty_program_enabled"], bool), "loyalty_program_enabled should be boolean"
        print(f"Public settings: token_program_enabled={data['token_program_enabled']}, loyalty_program_enabled={data['loyalty_program_enabled']}")
    
    def test_public_settings_no_auth_required(self):
        """Test that public settings endpoint doesn't require authentication"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200, "Public settings should not require auth"


class TestAdminSettingsEndpoint:
    """Tests for the admin /api/admin/settings endpoints"""
    
    def test_get_admin_settings_requires_auth(self):
        """Test that admin settings requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/settings")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_get_admin_settings_with_auth(self, admin_headers):
        """Test getting admin settings with valid auth"""
        response = requests.get(
            f"{BASE_URL}/api/admin/settings",
            headers=admin_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token_program_enabled" in data, "Missing token_program_enabled field"
        assert "loyalty_program_enabled" in data, "Missing loyalty_program_enabled field"
        print(f"Admin settings retrieved: {data}")
    
    def test_update_admin_settings_requires_auth(self):
        """Test that updating settings requires authentication"""
        response = requests.put(
            f"{BASE_URL}/api/admin/settings",
            json={"token_program_enabled": True}
        )
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_update_token_program_setting(self, admin_headers):
        """Test toggling the token program setting"""
        # Get current settings
        response = requests.get(
            f"{BASE_URL}/api/admin/settings",
            headers=admin_headers
        )
        assert response.status_code == 200
        original_value = response.json().get("token_program_enabled", True)
        print(f"Original token_program_enabled: {original_value}")
        
        # Toggle the value
        new_value = not original_value
        response = requests.put(
            f"{BASE_URL}/api/admin/settings",
            headers=admin_headers,
            json={"token_program_enabled": new_value}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        assert "message" in response.json(), "Response should contain message"
        print(f"Update response: {response.json()}")
        
        # Verify the change persisted
        response = requests.get(
            f"{BASE_URL}/api/admin/settings",
            headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["token_program_enabled"] == new_value, "Setting was not persisted"
        print(f"Verified token_program_enabled is now: {new_value}")
        
        # Verify public endpoint also reflects the change
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        assert response.json()["token_program_enabled"] == new_value, "Public settings don't reflect admin change"
        print(f"Public settings also show token_program_enabled: {new_value}")
        
        # Restore original value
        response = requests.put(
            f"{BASE_URL}/api/admin/settings",
            headers=admin_headers,
            json={"token_program_enabled": original_value}
        )
        assert response.status_code == 200
        print(f"Restored token_program_enabled to: {original_value}")
    
    def test_update_loyalty_program_setting(self, admin_headers):
        """Test toggling the loyalty program setting"""
        # Get current settings
        response = requests.get(
            f"{BASE_URL}/api/admin/settings",
            headers=admin_headers
        )
        assert response.status_code == 200
        original_value = response.json().get("loyalty_program_enabled", True)
        print(f"Original loyalty_program_enabled: {original_value}")
        
        # Toggle the value
        new_value = not original_value
        response = requests.put(
            f"{BASE_URL}/api/admin/settings",
            headers=admin_headers,
            json={"loyalty_program_enabled": new_value}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"Update response: {response.json()}")
        
        # Verify the change persisted
        response = requests.get(
            f"{BASE_URL}/api/admin/settings",
            headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["loyalty_program_enabled"] == new_value, "Setting was not persisted"
        
        # Restore original value
        response = requests.put(
            f"{BASE_URL}/api/admin/settings",
            headers=admin_headers,
            json={"loyalty_program_enabled": original_value}
        )
        assert response.status_code == 200
        print(f"Restored loyalty_program_enabled to: {original_value}")
    
    def test_update_both_settings_at_once(self, admin_headers):
        """Test updating both settings in a single request"""
        # Get current settings
        response = requests.get(
            f"{BASE_URL}/api/admin/settings",
            headers=admin_headers
        )
        assert response.status_code == 200
        original_settings = response.json()
        
        # Update both at once
        new_settings = {
            "token_program_enabled": not original_settings.get("token_program_enabled", True),
            "loyalty_program_enabled": not original_settings.get("loyalty_program_enabled", True)
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/settings",
            headers=admin_headers,
            json=new_settings
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"Updated both settings: {new_settings}")
        
        # Verify changes
        response = requests.get(
            f"{BASE_URL}/api/admin/settings",
            headers=admin_headers
        )
        assert response.status_code == 200
        current = response.json()
        assert current["token_program_enabled"] == new_settings["token_program_enabled"]
        assert current["loyalty_program_enabled"] == new_settings["loyalty_program_enabled"]
        
        # Restore original values
        response = requests.put(
            f"{BASE_URL}/api/admin/settings",
            headers=admin_headers,
            json={
                "token_program_enabled": original_settings.get("token_program_enabled", True),
                "loyalty_program_enabled": original_settings.get("loyalty_program_enabled", True)
            }
        )
        assert response.status_code == 200
        print("Restored original settings")
    
    def test_invalid_setting_key_ignored(self, admin_headers):
        """Test that invalid setting keys are ignored"""
        response = requests.put(
            f"{BASE_URL}/api/admin/settings",
            headers=admin_headers,
            json={"invalid_key": "some_value"}
        )
        
        # Should succeed but not affect anything
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"


class TestSettingsIntegration:
    """Integration tests for settings affecting user-facing features"""
    
    def test_settings_reflect_in_public_endpoint(self, admin_headers):
        """Test that admin settings are correctly reflected in public endpoint"""
        # Set specific values
        response = requests.put(
            f"{BASE_URL}/api/admin/settings",
            headers=admin_headers,
            json={"token_program_enabled": False}
        )
        assert response.status_code == 200
        
        # Check public endpoint
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        assert response.json()["token_program_enabled"] == False
        
        # Restore
        response = requests.put(
            f"{BASE_URL}/api/admin/settings",
            headers=admin_headers,
            json={"token_program_enabled": True}
        )
        assert response.status_code == 200
        print("Settings integration test passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
