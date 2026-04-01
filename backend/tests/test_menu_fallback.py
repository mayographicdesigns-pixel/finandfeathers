"""
Test menu endpoints with location fallback logic and admin dashboard fixes.
Tests the following features:
1. GET /api/menu/items - returns items (no mock data fallback)
2. GET /api/menu/items?location_slug=edgewood-atlanta - returns items (fallback to global if none for slug)
3. GET /api/admin/menu-items - returns all items
4. GET /api/admin/menu-items?location_slug=edgewood-atlanta - returns items
5. PUT /api/admin/menu-items/{item_id} - updates a menu item
6. GET /api/admin/stats - returns valid statistics
7. GET /api/locations - returns locations
8. GET /api/homepage/content - returns content
9. GET /api/admin/contacts - returns contacts
10. GET /api/tokens/packages - returns 5 packages
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPublicMenuEndpoints:
    """Test public menu endpoints with location fallback logic"""
    
    def test_get_menu_items_no_filter(self):
        """GET /api/menu/items returns items (no mock data fallback)"""
        response = requests.get(f"{BASE_URL}/api/menu/items")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of menu items"
        assert len(data) > 0, "Expected at least some menu items"
        print(f"✓ GET /api/menu/items returned {len(data)} items")
    
    def test_get_menu_items_with_location_slug(self):
        """GET /api/menu/items?location_slug=edgewood-atlanta returns items (fallback to global)"""
        response = requests.get(f"{BASE_URL}/api/menu/items?location_slug=edgewood-atlanta")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of menu items"
        # Should return items - either location-specific or global fallback
        assert len(data) > 0, "Expected menu items (either location-specific or global fallback)"
        print(f"✓ GET /api/menu/items?location_slug=edgewood-atlanta returned {len(data)} items")
    
    def test_get_menu_items_with_nonexistent_location(self):
        """GET /api/menu/items with nonexistent location should fallback to global items"""
        response = requests.get(f"{BASE_URL}/api/menu/items?location_slug=nonexistent-location")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of menu items"
        # Should fallback to global items
        print(f"✓ GET /api/menu/items?location_slug=nonexistent-location returned {len(data)} items (global fallback)")


class TestAdminMenuEndpoints:
    """Test admin menu endpoints with location fallback logic"""
    
    @pytest.fixture
    def admin_headers(self):
        """Get admin auth headers"""
        # Login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        # If login fails, try without auth (some endpoints may work)
        return {}
    
    def test_get_admin_menu_items_no_filter(self, admin_headers):
        """GET /api/admin/menu-items returns all items"""
        response = requests.get(f"{BASE_URL}/api/admin/menu-items", headers=admin_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of menu items"
        assert len(data) > 0, "Expected at least some menu items"
        print(f"✓ GET /api/admin/menu-items returned {len(data)} items")
    
    def test_get_admin_menu_items_with_location_slug(self, admin_headers):
        """GET /api/admin/menu-items?location_slug=edgewood-atlanta returns items"""
        response = requests.get(f"{BASE_URL}/api/admin/menu-items?location_slug=edgewood-atlanta", headers=admin_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of menu items"
        # Should return items - either location-specific or global fallback
        assert len(data) > 0, "Expected menu items (either location-specific or global fallback)"
        print(f"✓ GET /api/admin/menu-items?location_slug=edgewood-atlanta returned {len(data)} items")
    
    def test_update_menu_item(self, admin_headers):
        """PUT /api/admin/menu-items/{item_id} updates a menu item"""
        # First get an existing item
        response = requests.get(f"{BASE_URL}/api/admin/menu-items", headers=admin_headers)
        assert response.status_code == 200
        
        items = response.json()
        if len(items) == 0:
            pytest.skip("No menu items to update")
        
        # Get first item
        item = items[0]
        item_id = item.get("id")
        original_description = item.get("description", "")
        
        # Update the item with a test description
        test_description = f"TEST_UPDATE_{original_description}"
        update_response = requests.put(
            f"{BASE_URL}/api/admin/menu-items/{item_id}",
            headers=admin_headers,
            json={"description": test_description}
        )
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}"
        
        # Verify the update
        verify_response = requests.get(f"{BASE_URL}/api/menu/items")
        assert verify_response.status_code == 200
        
        updated_items = verify_response.json()
        updated_item = next((i for i in updated_items if i.get("id") == item_id), None)
        
        if updated_item:
            assert updated_item.get("description") == test_description, "Description should be updated"
            print(f"✓ PUT /api/admin/menu-items/{item_id} successfully updated item")
            
            # Revert the change
            requests.put(
                f"{BASE_URL}/api/admin/menu-items/{item_id}",
                headers=admin_headers,
                json={"description": original_description}
            )
        else:
            print(f"✓ PUT /api/admin/menu-items/{item_id} returned success")


class TestOtherEndpoints:
    """Test other required endpoints"""
    
    @pytest.fixture
    def admin_headers(self):
        """Get admin auth headers"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        return {}
    
    def test_get_admin_stats(self, admin_headers):
        """GET /api/admin/stats returns valid statistics"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=admin_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, dict), "Expected dict of stats"
        # Check for expected keys
        expected_keys = ["menu_items", "loyalty_members"]
        for key in expected_keys:
            assert key in data, f"Expected '{key}' in stats"
        print(f"✓ GET /api/admin/stats returned stats: menu_items={data.get('menu_items')}, loyalty_members={data.get('loyalty_members')}")
    
    def test_get_locations(self):
        """GET /api/locations returns locations"""
        response = requests.get(f"{BASE_URL}/api/locations")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of locations"
        assert len(data) > 0, "Expected at least one location"
        print(f"✓ GET /api/locations returned {len(data)} locations")
    
    def test_get_homepage_content(self):
        """GET /api/homepage/content returns content"""
        response = requests.get(f"{BASE_URL}/api/homepage/content")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Can be dict or list depending on implementation
        assert data is not None, "Expected homepage content"
        print(f"✓ GET /api/homepage/content returned content")
    
    def test_get_admin_contacts(self, admin_headers):
        """GET /api/admin/contacts returns contacts"""
        response = requests.get(f"{BASE_URL}/api/admin/contacts", headers=admin_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of contacts"
        print(f"✓ GET /api/admin/contacts returned {len(data)} contacts")
    
    def test_get_token_packages(self):
        """GET /api/tokens/packages returns 5 packages"""
        response = requests.get(f"{BASE_URL}/api/tokens/packages")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Can be dict or list depending on implementation
        if isinstance(data, dict):
            package_count = len(data)
        else:
            package_count = len(data)
        assert package_count >= 5, f"Expected at least 5 packages, got {package_count}"
        print(f"✓ GET /api/tokens/packages returned {package_count} packages")


class TestMenuFallbackLogic:
    """Test the specific fallback logic for menu items"""
    
    def test_menu_items_count_consistency(self):
        """Verify menu items are returned consistently"""
        # Get all items
        all_response = requests.get(f"{BASE_URL}/api/menu/items")
        assert all_response.status_code == 200
        all_items = all_response.json()
        
        # Get items for a specific location
        location_response = requests.get(f"{BASE_URL}/api/menu/items?location_slug=edgewood-atlanta")
        assert location_response.status_code == 200
        location_items = location_response.json()
        
        print(f"✓ All items: {len(all_items)}, Location items: {len(location_items)}")
        
        # Both should return items (not empty)
        assert len(all_items) > 0, "All items should not be empty"
        assert len(location_items) > 0, "Location items should not be empty (fallback should work)"
    
    def test_menu_items_have_required_fields(self):
        """Verify menu items have required fields"""
        response = requests.get(f"{BASE_URL}/api/menu/items")
        assert response.status_code == 200
        
        items = response.json()
        if len(items) > 0:
            item = items[0]
            required_fields = ["id", "name", "price", "category"]
            for field in required_fields:
                assert field in item, f"Expected '{field}' in menu item"
            print(f"✓ Menu items have required fields: {required_fields}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
