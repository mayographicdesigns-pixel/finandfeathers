"""
Test Menu Items Location Filter and Sync All Locations Feature

Tests:
1. GET /api/admin/menu-items?location_slug=edgewood-atlanta returns only edgewood items (~179)
2. GET /api/admin/menu-items (no filter) returns all items (~1611)
3. PUT /api/admin/menu-items/{id} with sync_all_locations=true updates ALL locations with same item name
4. PUT /api/admin/menu-items/{id} without sync_all_locations only updates the specific item
5. GET /api/menu/items?location_slug=edgewood-atlanta returns updated data after admin edit
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMenuLocationFilter:
    """Test menu items location filtering"""
    
    def test_get_all_menu_items_no_filter(self):
        """GET /api/admin/menu-items (no filter) returns all items (~1611)"""
        response = requests.get(f"{BASE_URL}/api/admin/menu-items")
        assert response.status_code == 200
        items = response.json()
        print(f"Total menu items (no filter): {len(items)}")
        # Should have many items across all locations
        assert len(items) > 500, f"Expected >500 items, got {len(items)}"
        
    def test_get_edgewood_menu_items(self):
        """GET /api/admin/menu-items?location_slug=edgewood-atlanta returns only edgewood items"""
        response = requests.get(f"{BASE_URL}/api/admin/menu-items?location_slug=edgewood-atlanta")
        assert response.status_code == 200
        items = response.json()
        print(f"Edgewood menu items: {len(items)}")
        # Should have ~179 items for edgewood
        assert 100 < len(items) < 300, f"Expected 100-300 items for edgewood, got {len(items)}"
        # All items should have edgewood location_slug
        for item in items[:10]:  # Check first 10
            assert item.get('location_slug') == 'edgewood-atlanta', f"Item {item.get('name')} has wrong location: {item.get('location_slug')}"
    
    def test_get_midtown_menu_items(self):
        """GET /api/admin/menu-items?location_slug=midtown-atlanta returns only midtown items"""
        response = requests.get(f"{BASE_URL}/api/admin/menu-items?location_slug=midtown-atlanta")
        assert response.status_code == 200
        items = response.json()
        print(f"Midtown menu items: {len(items)}")
        # Should have similar count to edgewood
        assert 100 < len(items) < 300, f"Expected 100-300 items for midtown, got {len(items)}"
        # All items should have midtown location_slug
        for item in items[:10]:
            assert item.get('location_slug') == 'midtown-atlanta', f"Item {item.get('name')} has wrong location: {item.get('location_slug')}"

    def test_public_menu_items_with_location_filter(self):
        """GET /api/menu/items?location_slug=edgewood-atlanta returns filtered items"""
        response = requests.get(f"{BASE_URL}/api/menu/items?location_slug=edgewood-atlanta")
        assert response.status_code == 200
        items = response.json()
        print(f"Public edgewood menu items: {len(items)}")
        assert len(items) > 50, f"Expected >50 public items for edgewood, got {len(items)}"


class TestMenuSyncAllLocations:
    """Test sync_all_locations feature for menu item updates"""
    
    @pytest.fixture
    def sample_item_name(self):
        """Get a common item name that exists across locations"""
        # Get items from edgewood
        response = requests.get(f"{BASE_URL}/api/admin/menu-items?location_slug=edgewood-atlanta")
        items = response.json()
        # Find an item that likely exists at multiple locations
        for item in items:
            if 'Wings' in item.get('name', '') or 'Grits' in item.get('name', ''):
                return item.get('name')
        # Fallback to first item
        return items[0].get('name') if items else None
    
    def test_update_with_sync_all_locations_true(self, sample_item_name):
        """PUT /api/admin/menu-items/{id} with sync_all_locations=true updates ALL locations"""
        if not sample_item_name:
            pytest.skip("No sample item found")
        
        # Get edgewood item
        response = requests.get(f"{BASE_URL}/api/admin/menu-items?location_slug=edgewood-atlanta")
        edgewood_items = response.json()
        target_item = next((i for i in edgewood_items if i.get('name') == sample_item_name), None)
        
        if not target_item:
            pytest.skip(f"Item '{sample_item_name}' not found in edgewood")
        
        item_id = target_item['id']
        original_description = target_item.get('description', '')
        
        # Generate unique test description
        test_description = f"TEST_SYNC_{uuid.uuid4().hex[:8]}"
        
        # Update with sync_all_locations=true
        update_response = requests.put(
            f"{BASE_URL}/api/admin/menu-items/{item_id}",
            json={
                "description": test_description,
                "sync_all_locations": True
            }
        )
        assert update_response.status_code == 200
        result = update_response.json()
        print(f"Update result: {result}")
        
        # Check synced_locations count
        synced_count = result.get('synced_locations', 0)
        print(f"Synced to {synced_count} other locations")
        
        # Verify the update propagated to other locations
        # Check midtown
        midtown_response = requests.get(f"{BASE_URL}/api/admin/menu-items?location_slug=midtown-atlanta")
        midtown_items = midtown_response.json()
        midtown_item = next((i for i in midtown_items if i.get('name') == sample_item_name), None)
        
        if midtown_item:
            assert midtown_item.get('description') == test_description, \
                f"Midtown item description not synced. Expected '{test_description}', got '{midtown_item.get('description')}'"
            print(f"Verified sync to midtown: {midtown_item.get('description')}")
        
        # Revert the change
        requests.put(
            f"{BASE_URL}/api/admin/menu-items/{item_id}",
            json={
                "description": original_description,
                "sync_all_locations": True
            }
        )
        print(f"Reverted description back to original")
    
    def test_update_without_sync_only_updates_specific_item(self):
        """PUT /api/admin/menu-items/{id} without sync_all_locations only updates the specific item"""
        # Get edgewood items
        response = requests.get(f"{BASE_URL}/api/admin/menu-items?location_slug=edgewood-atlanta")
        edgewood_items = response.json()
        
        if not edgewood_items:
            pytest.skip("No edgewood items found")
        
        # Find an item that exists at multiple locations
        target_item = None
        for item in edgewood_items:
            name = item.get('name', '')
            # Check if this item exists at midtown
            midtown_response = requests.get(f"{BASE_URL}/api/admin/menu-items?location_slug=midtown-atlanta")
            midtown_items = midtown_response.json()
            midtown_match = next((i for i in midtown_items if i.get('name') == name), None)
            if midtown_match:
                target_item = item
                break
        
        if not target_item:
            pytest.skip("No item found that exists at multiple locations")
        
        item_id = target_item['id']
        item_name = target_item['name']
        original_description = target_item.get('description', '')
        
        # Generate unique test description
        test_description = f"TEST_NO_SYNC_{uuid.uuid4().hex[:8]}"
        
        # Update WITHOUT sync_all_locations (or with sync_all_locations=false)
        update_response = requests.put(
            f"{BASE_URL}/api/admin/menu-items/{item_id}",
            json={
                "description": test_description,
                "sync_all_locations": False
            }
        )
        assert update_response.status_code == 200
        result = update_response.json()
        print(f"Update result (no sync): {result}")
        
        # Verify the edgewood item was updated
        edgewood_response = requests.get(f"{BASE_URL}/api/admin/menu-items?location_slug=edgewood-atlanta")
        edgewood_items = edgewood_response.json()
        updated_item = next((i for i in edgewood_items if i.get('id') == item_id), None)
        assert updated_item.get('description') == test_description, \
            f"Edgewood item not updated. Expected '{test_description}', got '{updated_item.get('description')}'"
        
        # Verify midtown item was NOT updated
        midtown_response = requests.get(f"{BASE_URL}/api/admin/menu-items?location_slug=midtown-atlanta")
        midtown_items = midtown_response.json()
        midtown_item = next((i for i in midtown_items if i.get('name') == item_name), None)
        
        if midtown_item:
            assert midtown_item.get('description') != test_description, \
                f"Midtown item should NOT have been synced but has description: {midtown_item.get('description')}"
            print(f"Verified midtown was NOT synced: {midtown_item.get('description')}")
        
        # Revert the change
        requests.put(
            f"{BASE_URL}/api/admin/menu-items/{item_id}",
            json={"description": original_description}
        )
        print(f"Reverted description back to original")


class TestPublicMenuAfterAdminEdit:
    """Test that public menu reflects admin edits"""
    
    def test_public_menu_shows_updated_data(self):
        """GET /api/menu/items?location_slug=edgewood-atlanta returns updated data after admin edit"""
        # Get an edgewood item
        admin_response = requests.get(f"{BASE_URL}/api/admin/menu-items?location_slug=edgewood-atlanta")
        admin_items = admin_response.json()
        
        if not admin_items:
            pytest.skip("No edgewood items found")
        
        target_item = admin_items[0]
        item_id = target_item['id']
        item_name = target_item['name']
        original_description = target_item.get('description', '')
        
        # Update the item
        test_description = f"PUBLIC_TEST_{uuid.uuid4().hex[:8]}"
        update_response = requests.put(
            f"{BASE_URL}/api/admin/menu-items/{item_id}",
            json={"description": test_description}
        )
        assert update_response.status_code == 200
        
        # Check public endpoint
        public_response = requests.get(f"{BASE_URL}/api/menu/items?location_slug=edgewood-atlanta")
        assert public_response.status_code == 200
        public_items = public_response.json()
        
        public_item = next((i for i in public_items if i.get('id') == item_id), None)
        assert public_item is not None, f"Item {item_id} not found in public menu"
        assert public_item.get('description') == test_description, \
            f"Public menu not updated. Expected '{test_description}', got '{public_item.get('description')}'"
        print(f"Verified public menu shows updated description: {public_item.get('description')}")
        
        # Revert
        requests.put(
            f"{BASE_URL}/api/admin/menu-items/{item_id}",
            json={"description": original_description}
        )


class TestMenuItemCounts:
    """Test menu item counts per location"""
    
    def test_location_item_counts(self):
        """Verify each location has reasonable item counts"""
        locations = [
            'edgewood-atlanta',
            'midtown-atlanta',
            'douglasville',
            'riverdale',
            'valdosta',
            'albany',
            'stone-mountain',
            'las-vegas'
        ]
        
        total_items = 0
        for loc in locations:
            response = requests.get(f"{BASE_URL}/api/admin/menu-items?location_slug={loc}")
            assert response.status_code == 200
            items = response.json()
            count = len(items)
            total_items += count
            print(f"{loc}: {count} items")
            # Each location should have some items
            assert count > 0, f"Location {loc} has no menu items"
        
        print(f"Total items across all locations: {total_items}")
        # Total should be close to 1611
        assert total_items > 1000, f"Expected >1000 total items, got {total_items}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
