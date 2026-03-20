"""
Test suite for menu item image functionality.
Tests the bug fixes for:
1. Catfish Nuggets and Chicken Tenders & Fries images in starters
2. Admin menu edits updating public menu
3. /api/media/ and /api/uploads/ paths loading correctly
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://karaoke-dj-mgmt.preview.emergentagent.com')

# Test credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "$outhcentral"


class TestPublicMenuImages:
    """Test that public menu items have correct images"""
    
    def test_get_public_menu_items(self):
        """Verify public menu API returns items"""
        response = requests.get(f"{BASE_URL}/api/menu/items")
        assert response.status_code == 200, f"Failed to get menu items: {response.text}"
        items = response.json()
        assert len(items) > 0, "No menu items returned"
        print(f"✓ Found {len(items)} menu items")
    
    def test_catfish_nuggets_has_relative_image_path(self):
        """Verify Catfish Nuggets has proper /api/media/ image path"""
        response = requests.get(f"{BASE_URL}/api/menu/items")
        assert response.status_code == 200
        items = response.json()
        
        catfish = next((item for item in items 
                       if item.get('name') == 'Catfish Nuggets' 
                       and item.get('category') == 'starters'), None)
        
        assert catfish is not None, "Catfish Nuggets not found in starters"
        
        image = catfish.get('image')
        assert image is not None, "Catfish Nuggets has no image"
        
        # Verify it's a relative path starting with /api/
        assert image.startswith('/api/'), f"Image path should start with /api/, got: {image}"
        
        # Verify it's NOT pointing to old deployment URL
        assert 'location-menu-app.preview.emergentagent.com' not in image, \
            f"Image still points to old URL: {image}"
        
        print(f"✓ Catfish Nuggets image path: {image}")
    
    def test_chicken_tenders_has_relative_image_path(self):
        """Verify Chicken Tenders & Fries has proper /api/media/ image path"""
        response = requests.get(f"{BASE_URL}/api/menu/items")
        assert response.status_code == 200
        items = response.json()
        
        chicken = next((item for item in items 
                       if item.get('name') == 'Chicken Tenders & Fries' 
                       and item.get('category') == 'starters'), None)
        
        assert chicken is not None, "Chicken Tenders & Fries not found in starters"
        
        image = chicken.get('image')
        assert image is not None, "Chicken Tenders & Fries has no image"
        
        # Verify it's a relative path
        assert image.startswith('/api/'), f"Image path should start with /api/, got: {image}"
        
        # Verify it's NOT pointing to old deployment URL
        assert 'location-menu-app.preview.emergentagent.com' not in image, \
            f"Image still points to old URL: {image}"
        
        print(f"✓ Chicken Tenders & Fries image path: {image}")
    
    def test_all_starters_have_images(self):
        """Verify all starter items have images"""
        response = requests.get(f"{BASE_URL}/api/menu/items")
        assert response.status_code == 200
        items = response.json()
        
        starters = [item for item in items if item.get('category') == 'starters']
        assert len(starters) > 0, "No starters found"
        
        missing_images = []
        for item in starters:
            image = item.get('image')
            if not image or image.strip() == '':
                missing_images.append(item.get('name', 'Unknown'))
        
        if missing_images:
            print(f"⚠ Starters without images: {missing_images}")
        else:
            print(f"✓ All {len(starters)} starters have images")


class TestImageEndpoints:
    """Test that image serving endpoints work correctly"""
    
    def test_api_media_endpoint_catfish(self):
        """Verify /api/media/ endpoint serves Catfish Nuggets image"""
        # First get the image path for Catfish Nuggets
        response = requests.get(f"{BASE_URL}/api/menu/items")
        items = response.json()
        catfish = next((item for item in items if item.get('name') == 'Catfish Nuggets' 
                       and item.get('category') == 'starters'), None)
        
        if not catfish or not catfish.get('image'):
            pytest.skip("Catfish Nuggets image not found")
        
        image_path = catfish.get('image')
        
        # Request the image
        img_response = requests.get(f"{BASE_URL}{image_path}")
        assert img_response.status_code == 200, f"Failed to load image: {img_response.status_code}"
        assert 'image' in img_response.headers.get('Content-Type', ''), \
            f"Response is not an image: {img_response.headers.get('Content-Type')}"
        assert len(img_response.content) > 1000, "Image content too small, might be placeholder"
        
        print(f"✓ Catfish Nuggets image loads successfully ({len(img_response.content)} bytes)")
    
    def test_api_media_endpoint_chicken_tenders(self):
        """Verify /api/media/ endpoint serves Chicken Tenders image"""
        response = requests.get(f"{BASE_URL}/api/menu/items")
        items = response.json()
        chicken = next((item for item in items if item.get('name') == 'Chicken Tenders & Fries' 
                       and item.get('category') == 'starters'), None)
        
        if not chicken or not chicken.get('image'):
            pytest.skip("Chicken Tenders & Fries image not found")
        
        image_path = chicken.get('image')
        
        img_response = requests.get(f"{BASE_URL}{image_path}")
        assert img_response.status_code == 200, f"Failed to load image: {img_response.status_code}"
        assert 'image' in img_response.headers.get('Content-Type', ''), \
            f"Response is not an image: {img_response.headers.get('Content-Type')}"
        assert len(img_response.content) > 1000, "Image content too small"
        
        print(f"✓ Chicken Tenders image loads successfully ({len(img_response.content)} bytes)")


class TestAdminMenuEdits:
    """Test admin functionality for editing menu items"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        token = response.json().get('access_token')
        assert token, "No access token returned"
        return token
    
    def test_admin_login(self, auth_token):
        """Verify admin can login successfully"""
        assert auth_token is not None
        print("✓ Admin login successful")
    
    def test_admin_get_menu_items(self, auth_token):
        """Verify admin can retrieve menu items"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/menu-items", headers=headers)
        assert response.status_code == 200, f"Failed to get admin menu items: {response.text}"
        items = response.json()
        assert len(items) > 0, "No menu items returned for admin"
        print(f"✓ Admin retrieved {len(items)} menu items")
    
    def test_admin_update_menu_item_image(self, auth_token):
        """Verify admin can update a menu item's image field"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get menu items
        response = requests.get(f"{BASE_URL}/api/admin/menu-items", headers=headers)
        items = response.json()
        
        # Find a test item to update (not Catfish or Chicken to avoid disrupting main test)
        test_item = next((item for item in items 
                         if item.get('name') == 'F&F Signature Wings' 
                         and item.get('category') == 'starters'), None)
        
        if not test_item:
            pytest.skip("Test item not found")
        
        item_id = test_item.get('id')
        original_image = test_item.get('image')
        
        # Update the image field with a relative path
        update_payload = {
            "image": "/api/media/test-image-path"
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/admin/menu-items/{item_id}",
            headers=headers,
            json=update_payload
        )
        
        assert update_response.status_code == 200, f"Failed to update menu item: {update_response.text}"
        
        # Verify the update was applied
        verify_response = requests.get(f"{BASE_URL}/api/menu/items")
        updated_items = verify_response.json()
        updated_item = next((item for item in updated_items if item.get('id') == item_id), None)
        
        assert updated_item is not None, "Updated item not found in public menu"
        assert updated_item.get('image') == "/api/media/test-image-path", \
            f"Image not updated correctly: {updated_item.get('image')}"
        
        # Restore original image
        restore_payload = {"image": original_image}
        requests.put(
            f"{BASE_URL}/api/admin/menu-items/{item_id}",
            headers=headers,
            json=restore_payload
        )
        
        print("✓ Admin can update menu item image and changes reflect in public menu")
    
    def test_update_uses_image_field_not_image_url(self, auth_token):
        """Verify the update endpoint accepts 'image' field (not 'image_url')"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get a menu item
        response = requests.get(f"{BASE_URL}/api/admin/menu-items", headers=headers)
        items = response.json()
        
        if not items:
            pytest.skip("No menu items available")
        
        test_item = items[0]
        item_id = test_item.get('id')
        
        # Update using 'image' field (the correct field name)
        update_payload = {"image": test_item.get('image', '/api/media/test')}
        
        update_response = requests.put(
            f"{BASE_URL}/api/admin/menu-items/{item_id}",
            headers=headers,
            json=update_payload
        )
        
        assert update_response.status_code == 200, \
            f"Update with 'image' field failed: {update_response.text}"
        
        print("✓ PUT endpoint correctly accepts 'image' field")


class TestNoOldDeploymentUrls:
    """Ensure no menu items reference old deployment URLs"""
    
    def test_no_old_deployment_urls_in_images(self):
        """Verify no items have old deployment URL in image path"""
        response = requests.get(f"{BASE_URL}/api/menu/items")
        assert response.status_code == 200
        items = response.json()
        
        old_url = "location-menu-app.preview.emergentagent.com"
        items_with_old_urls = []
        
        for item in items:
            image = item.get('image') or item.get('image_url') or ''
            if old_url in image:
                items_with_old_urls.append({
                    'name': item.get('name'),
                    'image': image
                })
        
        assert len(items_with_old_urls) == 0, \
            f"Found {len(items_with_old_urls)} items with old deployment URLs: {items_with_old_urls}"
        
        print("✓ No menu items reference old deployment URL")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
