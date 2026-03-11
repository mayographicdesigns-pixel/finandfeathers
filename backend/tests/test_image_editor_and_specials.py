"""
Test suite for Menu Image Editor and Daily Specials features
Tests:
1. Admin authentication
2. Menu items API
3. Image upload API
4. Daily Specials API (all 7 days)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://restaurant-menu-app-5.preview.emergentagent.com')


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": "admin", "password": "$outhcentral"}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture
def auth_headers(admin_token):
    """Headers with admin auth token"""
    return {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }


class TestAdminAuthentication:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin can login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "admin", "password": "$outhcentral"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0
    
    def test_admin_login_invalid_password(self):
        """Test login fails with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "admin", "password": "wrongpassword"}
        )
        assert response.status_code == 401
    
    def test_admin_me_endpoint(self, auth_headers):
        """Test /auth/me returns admin info"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "admin"
        assert data["is_admin"] == True


class TestDailySpecials:
    """Daily Specials API tests - verifies all 7 days are returned"""
    
    def test_get_daily_specials_public(self):
        """Test public daily specials endpoint returns all 7 days"""
        response = requests.get(f"{BASE_URL}/api/daily-specials")
        assert response.status_code == 200
        
        specials = response.json()
        assert isinstance(specials, list)
        
        # Should have exactly 7 days (Sunday=0 to Saturday=6)
        day_indices = [s.get("day_index") for s in specials]
        
        # Check that all 7 days are present (0-6)
        assert len(specials) == 7, f"Expected 7 daily specials, got {len(specials)}"
        
        for day_index in range(7):
            assert day_index in day_indices, f"Missing day_index {day_index}"
        
        # Verify each special has required fields
        for special in specials:
            assert "day_index" in special
            assert "name" in special
            assert "description" in special
            assert "hours" in special
            assert "emoji" in special
    
    def test_daily_specials_content(self):
        """Test daily specials have meaningful content"""
        response = requests.get(f"{BASE_URL}/api/daily-specials")
        specials = response.json()
        
        # Check Sunday (day_index=0)
        sunday = next((s for s in specials if s["day_index"] == 0), None)
        assert sunday is not None
        assert "Sunday" in sunday["name"] or len(sunday["name"]) > 0
        assert len(sunday["description"]) > 10
        
        # Check Monday (day_index=1) - Margarita Monday
        monday = next((s for s in specials if s["day_index"] == 1), None)
        assert monday is not None
        assert len(monday["description"]) > 10
    
    def test_admin_get_daily_specials(self, auth_headers):
        """Test admin endpoint for daily specials"""
        response = requests.get(
            f"{BASE_URL}/api/admin/daily-specials",
            headers=auth_headers
        )
        assert response.status_code == 200
        specials = response.json()
        assert len(specials) == 7


class TestMenuItems:
    """Menu items API tests"""
    
    def test_get_public_menu_items(self):
        """Test public menu items endpoint"""
        response = requests.get(f"{BASE_URL}/api/menu/items")
        assert response.status_code == 200
        
        items = response.json()
        assert isinstance(items, list)
        assert len(items) > 0  # Should have menu items
        
        # Check first item has required fields
        first_item = items[0]
        assert "id" in first_item
        assert "name" in first_item
        assert "price" in first_item or "priceLabel" in first_item
        assert "category" in first_item
    
    def test_admin_get_menu_items(self, auth_headers):
        """Test admin can get all menu items"""
        response = requests.get(
            f"{BASE_URL}/api/admin/menu-items",
            headers=auth_headers
        )
        assert response.status_code == 200
        items = response.json()
        assert isinstance(items, list)
        assert len(items) > 100  # Should have 163+ items based on earlier test
    
    def test_admin_update_menu_item_image(self, auth_headers):
        """Test admin can update a menu item's image"""
        # First, get a menu item
        response = requests.get(
            f"{BASE_URL}/api/admin/menu-items",
            headers=auth_headers
        )
        items = response.json()
        
        if len(items) > 0:
            item_id = items[0]["id"]
            original_image = items[0].get("image", "")
            
            # Update with new image URL
            test_image_url = "https://example.com/test-image.jpg"
            update_response = requests.put(
                f"{BASE_URL}/api/admin/menu-items/{item_id}",
                headers=auth_headers,
                json={"image": test_image_url}
            )
            
            assert update_response.status_code == 200
            
            # Verify the update
            verify_response = requests.get(
                f"{BASE_URL}/api/admin/menu-items",
                headers=auth_headers
            )
            updated_items = verify_response.json()
            updated_item = next((i for i in updated_items if i["id"] == item_id), None)
            
            assert updated_item is not None
            assert updated_item.get("image") == test_image_url
            
            # Restore original image
            requests.put(
                f"{BASE_URL}/api/admin/menu-items/{item_id}",
                headers=auth_headers,
                json={"image": original_image}
            )


class TestImageUpload:
    """Image upload API tests"""
    
    def test_admin_upload_requires_auth(self):
        """Test upload endpoint requires authentication"""
        # Create a fake file for testing
        files = {"file": ("test.jpg", b"fake image content", "image/jpeg")}
        response = requests.post(
            f"{BASE_URL}/api/admin/upload",
            files=files
        )
        # Should fail without auth
        assert response.status_code in [401, 403, 422]
    
    def test_admin_upload_endpoint_exists(self, admin_token):
        """Test upload endpoint is accessible with auth"""
        # Create a small test image (1x1 PNG)
        import base64
        # 1x1 red PNG
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {"file": ("test.png", png_data, "image/png")}
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/admin/upload",
            files=files,
            headers=headers
        )
        
        # Should succeed or fail with file validation, not auth
        assert response.status_code in [200, 400, 413]
        
        if response.status_code == 200:
            data = response.json()
            assert "url" in data
            assert "filename" in data


class TestAdminSpecials:
    """Admin specials (promotions) API tests"""
    
    def test_get_public_specials(self):
        """Test public specials endpoint"""
        response = requests.get(f"{BASE_URL}/api/specials")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_admin_get_specials(self, auth_headers):
        """Test admin can get all specials"""
        response = requests.get(
            f"{BASE_URL}/api/admin/specials",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)


class TestAdminStats:
    """Admin dashboard stats tests"""
    
    def test_admin_stats(self, auth_headers):
        """Test admin stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        stats = response.json()
        assert "loyalty_members" in stats
        assert "menu_items" in stats
        assert "notifications_sent" in stats
        assert stats["menu_items"] > 100  # Should have 163+ items


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
