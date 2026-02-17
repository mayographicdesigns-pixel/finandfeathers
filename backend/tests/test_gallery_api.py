"""
Gallery API tests - Admin Panel Gallery Management Feature
Tests CRUD operations for gallery items and public gallery endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
TEST_GALLERY_ITEM = {
    "title": "TEST_Gallery_Item_1",
    "image_url": "https://example.com/test-image.jpg",
    "category": "food",
    "display_order": 1
}

TEST_GALLERY_ITEM_2 = {
    "title": "TEST_Gallery_Item_2",
    "image_url": "https://example.com/test-image2.jpg",
    "category": "ambiance",
    "display_order": 2
}


class TestGalleryPublicEndpoint:
    """Test public gallery endpoint (no auth required)"""
    
    def test_get_public_gallery_returns_200(self):
        """Public gallery endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/gallery")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ GET /api/gallery returned {response.status_code}")
        
    def test_get_public_gallery_returns_list(self):
        """Public gallery should return a list"""
        response = requests.get(f"{BASE_URL}/api/gallery")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"✓ Public gallery returns list with {len(data)} items")


class TestAdminAuth:
    """Test admin authentication for gallery operations"""
    
    def test_admin_login_success(self):
        """Admin login with correct credentials should return token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert data["token_type"] == "bearer"
        print("✓ Admin login successful, token received")
        return data["access_token"]
    
    def test_admin_login_invalid_credentials(self):
        """Admin login with wrong credentials should return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected with 401")


class TestAdminGalleryEndpoints:
    """Test admin gallery CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        if response.status_code != 200:
            pytest.skip("Could not authenticate - skipping admin tests")
        self.token = response.json()["access_token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        self.created_item_ids = []
        yield
        # Cleanup: delete any test items created
        for item_id in self.created_item_ids:
            try:
                requests.delete(
                    f"{BASE_URL}/api/admin/gallery/{item_id}",
                    headers=self.headers
                )
            except:
                pass
    
    def test_admin_gallery_requires_auth(self):
        """Admin gallery endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/gallery")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ Admin gallery endpoint requires authentication")
    
    def test_get_admin_gallery(self):
        """Admin can get all gallery items"""
        response = requests.get(f"{BASE_URL}/api/admin/gallery", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"✓ Admin GET /api/admin/gallery returned {len(data)} items")
    
    def test_create_gallery_item(self):
        """Admin can create a new gallery item"""
        response = requests.post(
            f"{BASE_URL}/api/admin/gallery",
            headers=self.headers,
            json=TEST_GALLERY_ITEM
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify returned data
        assert "id" in data, "Created item should have an id"
        assert data["title"] == TEST_GALLERY_ITEM["title"], f"Title mismatch: {data['title']}"
        assert data["image_url"] == TEST_GALLERY_ITEM["image_url"], "image_url mismatch"
        assert data["category"] == TEST_GALLERY_ITEM["category"], "category mismatch"
        assert data["is_active"] == True, "New items should be active by default"
        
        self.created_item_ids.append(data["id"])
        print(f"✓ Created gallery item: {data['id']}")
        return data
    
    def test_create_and_verify_persistence(self):
        """After creating an item, verify it exists via GET"""
        # Create
        create_response = requests.post(
            f"{BASE_URL}/api/admin/gallery",
            headers=self.headers,
            json=TEST_GALLERY_ITEM_2
        )
        assert create_response.status_code == 200
        created_item = create_response.json()
        self.created_item_ids.append(created_item["id"])
        
        # Verify via admin GET
        get_response = requests.get(f"{BASE_URL}/api/admin/gallery", headers=self.headers)
        assert get_response.status_code == 200
        all_items = get_response.json()
        
        # Find our created item
        found = any(item["id"] == created_item["id"] for item in all_items)
        assert found, f"Created item {created_item['id']} not found in admin gallery"
        print(f"✓ Created item verified in admin gallery list")
    
    def test_update_gallery_item(self):
        """Admin can update a gallery item"""
        # First create an item
        create_response = requests.post(
            f"{BASE_URL}/api/admin/gallery",
            headers=self.headers,
            json=TEST_GALLERY_ITEM
        )
        assert create_response.status_code == 200
        created_item = create_response.json()
        item_id = created_item["id"]
        self.created_item_ids.append(item_id)
        
        # Update the item
        update_data = {
            "title": "TEST_Updated_Title",
            "category": "drinks"
        }
        update_response = requests.put(
            f"{BASE_URL}/api/admin/gallery/{item_id}",
            headers=self.headers,
            json=update_data
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        print(f"✓ Updated gallery item {item_id}")
        
        # Verify update persisted
        get_response = requests.get(f"{BASE_URL}/api/admin/gallery", headers=self.headers)
        all_items = get_response.json()
        updated_item = next((i for i in all_items if i["id"] == item_id), None)
        assert updated_item is not None, "Updated item not found"
        assert updated_item["title"] == "TEST_Updated_Title", f"Title not updated: {updated_item['title']}"
        assert updated_item["category"] == "drinks", f"Category not updated: {updated_item['category']}"
        print(f"✓ Update verified - title: {updated_item['title']}, category: {updated_item['category']}")
    
    def test_toggle_visibility(self):
        """Admin can toggle gallery item visibility (is_active)"""
        # Create an item (defaults to is_active=True)
        create_response = requests.post(
            f"{BASE_URL}/api/admin/gallery",
            headers=self.headers,
            json=TEST_GALLERY_ITEM
        )
        assert create_response.status_code == 200
        created_item = create_response.json()
        item_id = created_item["id"]
        self.created_item_ids.append(item_id)
        assert created_item["is_active"] == True
        
        # Toggle to inactive
        update_response = requests.put(
            f"{BASE_URL}/api/admin/gallery/{item_id}",
            headers=self.headers,
            json={"is_active": False}
        )
        assert update_response.status_code == 200
        
        # Verify - item should NOT appear in public gallery
        public_response = requests.get(f"{BASE_URL}/api/gallery")
        public_items = public_response.json()
        public_ids = [i.get("id") for i in public_items]
        assert item_id not in public_ids, "Inactive item should not appear in public gallery"
        print(f"✓ Inactive item correctly hidden from public gallery")
        
        # But should still appear in admin gallery
        admin_response = requests.get(f"{BASE_URL}/api/admin/gallery", headers=self.headers)
        admin_items = admin_response.json()
        admin_item = next((i for i in admin_items if i["id"] == item_id), None)
        assert admin_item is not None, "Item should still appear in admin gallery"
        assert admin_item["is_active"] == False, "is_active should be False"
        print(f"✓ Item with is_active=False still visible in admin panel")
    
    def test_delete_gallery_item(self):
        """Admin can delete a gallery item"""
        # Create an item
        create_response = requests.post(
            f"{BASE_URL}/api/admin/gallery",
            headers=self.headers,
            json=TEST_GALLERY_ITEM
        )
        assert create_response.status_code == 200
        item_id = create_response.json()["id"]
        
        # Delete the item
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/gallery/{item_id}",
            headers=self.headers
        )
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        print(f"✓ Deleted gallery item {item_id}")
        
        # Verify deletion - item should not exist
        get_response = requests.get(f"{BASE_URL}/api/admin/gallery", headers=self.headers)
        all_items = get_response.json()
        found = any(item["id"] == item_id for item in all_items)
        assert not found, "Deleted item should not exist in gallery"
        print(f"✓ Verified item no longer exists after deletion")
    
    def test_delete_nonexistent_item(self):
        """Deleting nonexistent item should return 404"""
        response = requests.delete(
            f"{BASE_URL}/api/admin/gallery/nonexistent-id-12345",
            headers=self.headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Delete nonexistent item correctly returns 404")
    
    def test_update_nonexistent_item(self):
        """Updating nonexistent item should return 404"""
        response = requests.put(
            f"{BASE_URL}/api/admin/gallery/nonexistent-id-12345",
            headers=self.headers,
            json={"title": "New Title"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Update nonexistent item correctly returns 404")


class TestPublicGalleryFallback:
    """Test that public gallery falls back to defaults when empty"""
    
    def test_public_gallery_empty_returns_empty_list(self):
        """When no active items, public gallery should return empty list"""
        response = requests.get(f"{BASE_URL}/api/gallery")
        assert response.status_code == 200
        data = response.json()
        # This tests the API behavior - frontend handles the fallback to defaults
        assert isinstance(data, list)
        print(f"✓ Public gallery returns {len(data)} items (empty if no active items)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
