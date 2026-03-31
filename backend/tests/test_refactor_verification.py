"""
Comprehensive verification tests for server.py refactoring.
Tests all endpoints mentioned in the review request to ensure they work after being moved to router files.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://staff-client-roles.preview.emergentagent.com').rstrip('/')


class TestMenuAPI:
    """Tests for routes/menu.py endpoints"""
    
    def test_get_menu_items(self):
        """GET /api/menu/items returns items (1656 expected)"""
        response = requests.get(f"{BASE_URL}/api/menu/items")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0, "Menu items should not be empty"
        print(f"✓ Menu items: {len(data)} items returned")
    
    def test_get_admin_menu_items(self):
        """GET /api/admin/menu-items returns items"""
        response = requests.get(f"{BASE_URL}/api/admin/menu-items")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin menu items: {len(data)} items returned")


class TestLocationAPI:
    """Tests for routes/locations.py endpoints"""
    
    def test_get_locations(self):
        """GET /api/locations returns locations (9 expected)"""
        response = requests.get(f"{BASE_URL}/api/locations")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 9, f"Expected at least 9 locations, got {len(data)}"
        print(f"✓ Locations: {len(data)} locations returned")
    
    def test_get_specific_location(self):
        """GET /api/locations/edgewood-atlanta returns a specific location"""
        response = requests.get(f"{BASE_URL}/api/locations/edgewood-atlanta")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data or "slug" in data
        print(f"✓ Specific location: edgewood-atlanta retrieved")


class TestHomepageContentAPI:
    """Tests for routes/content.py endpoints"""
    
    def test_get_homepage_content(self):
        """GET /api/homepage/content returns content"""
        response = requests.get(f"{BASE_URL}/api/homepage/content")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print(f"✓ Homepage content: keys={list(data.keys())}")


class TestAdminStatsAPI:
    """Tests for routes/admin.py endpoints"""
    
    def test_get_admin_stats(self):
        """GET /api/admin/stats returns statistics"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        assert "menu_items" in data or "loyalty_members" in data
        print(f"✓ Admin stats: {data}")


class TestTokenPackagesAPI:
    """Tests for routes/user.py endpoints"""
    
    def test_get_token_packages(self):
        """GET /api/tokens/packages returns 5 packages"""
        response = requests.get(f"{BASE_URL}/api/tokens/packages")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        assert len(data) >= 5, f"Expected at least 5 packages, got {len(data)}"
        print(f"✓ Token packages: {len(data)} packages returned")


class TestSpecialsAPI:
    """Tests for routes/content.py endpoints"""
    
    def test_get_specials(self):
        """GET /api/specials returns specials list"""
        response = requests.get(f"{BASE_URL}/api/specials")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Specials: {len(data)} specials returned")


class TestSocialLinksAPI:
    """Tests for routes/content.py endpoints"""
    
    def test_get_social_links(self):
        """GET /api/social-links returns links list"""
        response = requests.get(f"{BASE_URL}/api/social-links")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Social links: {len(data)} links returned")


class TestGalleryAPI:
    """Tests for routes/social.py endpoints"""
    
    def test_get_gallery(self):
        """GET /api/gallery returns gallery items"""
        response = requests.get(f"{BASE_URL}/api/gallery")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Gallery: {len(data)} items returned")


class TestInstagramFeedAPI:
    """Tests for routes/content.py endpoints"""
    
    def test_get_instagram_feed(self):
        """GET /api/instagram-feed returns posts"""
        response = requests.get(f"{BASE_URL}/api/instagram-feed")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Instagram feed: {len(data)} posts returned")


class TestPushPublicKeyAPI:
    """Tests for routes/content.py or user.py endpoints"""
    
    def test_get_push_public_key(self):
        """GET /api/push/public-key returns publicKey"""
        response = requests.get(f"{BASE_URL}/api/push/public-key")
        assert response.status_code == 200
        data = response.json()
        assert "publicKey" in data
        print(f"✓ Push public key: key present")


class TestPromoVideosAPI:
    """Tests for routes/locations.py endpoints"""
    
    def test_get_promo_videos(self):
        """GET /api/promo-videos returns videos"""
        response = requests.get(f"{BASE_URL}/api/promo-videos")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Promo videos: {len(data)} videos returned")


class TestStaffListAPI:
    """Tests for routes/user.py endpoints"""
    
    def test_get_staff_list(self):
        """GET /api/staff/list returns staff list"""
        response = requests.get(f"{BASE_URL}/api/staff/list")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Staff list: {len(data)} staff members returned")


class TestAdminContactsAPI:
    """Tests for routes/admin.py endpoints"""
    
    def test_get_admin_contacts(self):
        """GET /api/admin/contacts returns contacts"""
        response = requests.get(f"{BASE_URL}/api/admin/contacts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin contacts: {len(data)} contacts returned")


class TestAdminUsersAPI:
    """Tests for routes/admin.py endpoints"""
    
    def test_get_admin_users(self):
        """GET /api/admin/users returns user list"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin users: {len(data)} users returned")


class TestLoyaltyMembersAPI:
    """Tests for routes/admin.py endpoints"""
    
    def test_get_loyalty_members(self):
        """GET /api/loyalty/members returns members"""
        response = requests.get(f"{BASE_URL}/api/loyalty/members")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Loyalty members: {len(data)} members returned")


class TestAdminNotificationsHistoryAPI:
    """Tests for routes/admin.py endpoints"""
    
    def test_get_admin_notifications_history(self):
        """GET /api/admin/notifications/history returns history"""
        response = requests.get(f"{BASE_URL}/api/admin/notifications/history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin notifications history: {len(data)} entries returned")


class TestAdminMenuCategoryStylesAPI:
    """Tests for routes/menu.py endpoints"""
    
    def test_get_admin_menu_category_styles(self):
        """GET /api/admin/menu-category-styles returns styles"""
        response = requests.get(f"{BASE_URL}/api/admin/menu-category-styles")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict), "Menu category styles should be a dict"
        print(f"✓ Admin menu category styles: {len(data)} categories returned")


class TestAdminGalleryAPI:
    """Tests for routes/social.py endpoints"""
    
    def test_get_admin_gallery(self):
        """GET /api/admin/gallery returns gallery items"""
        response = requests.get(f"{BASE_URL}/api/admin/gallery")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin gallery: {len(data)} items returned")


class TestAdminSocialPostsAPI:
    """Tests for routes/social.py endpoints"""
    
    def test_get_admin_social_posts(self):
        """GET /api/admin/social-posts returns posts"""
        response = requests.get(f"{BASE_URL}/api/admin/social-posts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin social posts: {len(data)} posts returned")


class TestDJStatusAPI:
    """Tests for routes/dj.py endpoints"""
    
    def test_get_dj_at_location(self):
        """GET /api/dj/at-location/edgewood-atlanta returns DJ status"""
        response = requests.get(f"{BASE_URL}/api/dj/at-location/edgewood-atlanta")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        assert "checked_in" in data
        print(f"✓ DJ at location: checked_in={data.get('checked_in')}")


class TestEventsAPI:
    """Tests for routes/events.py endpoints"""
    
    def test_get_events(self):
        """GET /api/events returns events list"""
        response = requests.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Events: {len(data)} events returned")


class TestMediaServingAPI:
    """Tests for server.py media serving endpoints"""
    
    def test_uploads_returns_404_not_crash(self):
        """GET /api/uploads/{any} returns 404 (not crash)"""
        response = requests.get(f"{BASE_URL}/api/uploads/nonexistent-file.jpg")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Uploads endpoint returns 404 for missing file (not crash)")


class TestAPIHealth:
    """Basic health check"""
    
    def test_api_root(self):
        """GET /api/ returns health message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API health: {data['message']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
