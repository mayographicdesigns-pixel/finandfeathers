"""
Test suite for server.py refactoring and new notification system.
Tests:
1. ALL existing API endpoints still work after refactoring (regression test)
2. New notification endpoints for social wall
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_USER_ID = f"TEST_user_{uuid.uuid4().hex[:8]}"
TEST_USER_NAME = "Test Notification User"
TEST_LOCATION_SLUG = "midtown"

# Second user for notification testing
TEST_USER_ID_2 = f"TEST_user_{uuid.uuid4().hex[:8]}"
TEST_USER_NAME_2 = "Test Notification User 2"


class TestHealthAndBasicEndpoints:
    """Test basic endpoints still work after refactoring"""
    
    def test_root_health_check(self):
        """GET /api/ root health check returns success"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"PASS: Root health check - {data['message']}")
    
    def test_get_settings(self):
        """GET /api/settings returns settings"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        data = response.json()
        # Settings should have at least some keys
        assert isinstance(data, dict)
        print(f"PASS: Settings endpoint - keys: {list(data.keys())}")
    
    def test_get_locations(self):
        """GET /api/locations returns locations"""
        response = requests.get(f"{BASE_URL}/api/locations")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Locations endpoint - {len(data)} locations returned")
    
    def test_get_events(self):
        """GET /api/events returns events"""
        response = requests.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Events endpoint - {len(data)} events returned")


class TestDJRouterEndpoints:
    """Test DJ/Karaoke endpoints from routes/dj.py"""
    
    def test_dj_login(self):
        """POST /api/dj/login works for DJ login"""
        response = requests.post(f"{BASE_URL}/api/dj/login", json={
            "name": "TEST_DJ_User"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "name" in data
        print(f"PASS: DJ login - id: {data['id']}")
        return data["id"]
    
    def test_karaoke_status(self):
        """GET /api/karaoke/status/{location_slug} returns status"""
        response = requests.get(f"{BASE_URL}/api/karaoke/status/{TEST_LOCATION_SLUG}")
        assert response.status_code == 200
        data = response.json()
        assert "active" in data
        print(f"PASS: Karaoke status - active: {data['active']}")
    
    def test_dj_tip_record(self):
        """POST /api/dj/tip/record records a tip"""
        response = requests.post(f"{BASE_URL}/api/dj/tip/record", json={
            "location_slug": TEST_LOCATION_SLUG,
            "tipper_name": "TEST_Tipper",
            "amount": 5.00,
            "payment_method": "cash"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "id" in data
        print(f"PASS: DJ tip record - id: {data['id']}")
    
    def test_dj_at_location(self):
        """GET /api/dj/at-location/{location_slug} returns DJ info"""
        response = requests.get(f"{BASE_URL}/api/dj/at-location/{TEST_LOCATION_SLUG}")
        assert response.status_code == 200
        data = response.json()
        assert "checked_in" in data
        print(f"PASS: DJ at location - checked_in: {data['checked_in']}")


class TestWallRouterEndpoints:
    """Test Social Wall endpoints from routes/wall.py"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.post_id = None
        yield
        # Cleanup
        if self.post_id:
            try:
                requests.delete(f"{BASE_URL}/api/wall/posts/{self.post_id}?user_id={TEST_USER_ID}")
            except:
                pass
    
    def test_create_wall_post(self):
        """POST /api/wall/posts creates a wall post"""
        response = requests.post(f"{BASE_URL}/api/wall/posts", json={
            "user_id": TEST_USER_ID,
            "location_slug": TEST_LOCATION_SLUG,
            "user_name": TEST_USER_NAME,
            "post_type": "text",
            "content": "TEST_Post for notification testing"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["user_id"] == TEST_USER_ID
        assert data["content"] == "TEST_Post for notification testing"
        self.post_id = data["id"]
        print(f"PASS: Create wall post - id: {data['id']}")
        return data["id"]
    
    def test_get_wall_posts(self):
        """GET /api/wall/posts/{location_slug} returns posts"""
        response = requests.get(f"{BASE_URL}/api/wall/posts/{TEST_LOCATION_SLUG}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Get wall posts - {len(data)} posts returned")
    
    def test_send_chat_message(self):
        """POST /api/wall/chat/{location_slug} sends a chat message"""
        response = requests.post(f"{BASE_URL}/api/wall/chat/{TEST_LOCATION_SLUG}", json={
            "user_id": TEST_USER_ID,
            "user_name": TEST_USER_NAME,
            "content": "TEST_Chat message"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["content"] == "TEST_Chat message"
        print(f"PASS: Send chat message - id: {data['id']}")


class TestNotificationSystem:
    """Test new notification endpoints and triggers"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.post_id = None
        yield
        # Cleanup
        if self.post_id:
            try:
                requests.delete(f"{BASE_URL}/api/wall/posts/{self.post_id}?user_id={TEST_USER_ID}")
            except:
                pass
    
    def test_like_triggers_notification(self):
        """POST /api/wall/posts/{id}/like triggers notification for post author"""
        # Create a post by user 1
        create_response = requests.post(f"{BASE_URL}/api/wall/posts", json={
            "user_id": TEST_USER_ID,
            "location_slug": TEST_LOCATION_SLUG,
            "user_name": TEST_USER_NAME,
            "post_type": "text",
            "content": "TEST_Post for like notification"
        })
        assert create_response.status_code == 200
        post_data = create_response.json()
        self.post_id = post_data["id"]
        
        # User 2 likes the post
        like_response = requests.post(f"{BASE_URL}/api/wall/posts/{self.post_id}/like", json={
            "user_id": TEST_USER_ID_2,
            "user_name": TEST_USER_NAME_2
        })
        assert like_response.status_code == 200
        like_data = like_response.json()
        assert like_data["action"] == "liked"
        
        # Check notifications for user 1
        notif_response = requests.get(f"{BASE_URL}/api/wall/notifications/{TEST_USER_ID}")
        assert notif_response.status_code == 200
        notifications = notif_response.json()
        
        # Find the like notification
        like_notif = next((n for n in notifications if "liked your post" in n.get("title", "")), None)
        assert like_notif is not None, "Like notification should be created"
        print(f"PASS: Like triggers notification - title: {like_notif['title']}")
    
    def test_comment_triggers_notification(self):
        """POST /api/wall/posts/{id}/comment triggers notification for post author"""
        # Create a post by user 1
        create_response = requests.post(f"{BASE_URL}/api/wall/posts", json={
            "user_id": TEST_USER_ID,
            "location_slug": TEST_LOCATION_SLUG,
            "user_name": TEST_USER_NAME,
            "post_type": "text",
            "content": "TEST_Post for comment notification"
        })
        assert create_response.status_code == 200
        post_data = create_response.json()
        self.post_id = post_data["id"]
        
        # User 2 comments on the post
        comment_response = requests.post(f"{BASE_URL}/api/wall/posts/{self.post_id}/comment", json={
            "user_id": TEST_USER_ID_2,
            "user_name": TEST_USER_NAME_2,
            "content": "TEST_Comment for notification"
        })
        assert comment_response.status_code == 200
        
        # Check notifications for user 1
        notif_response = requests.get(f"{BASE_URL}/api/wall/notifications/{TEST_USER_ID}")
        assert notif_response.status_code == 200
        notifications = notif_response.json()
        
        # Find the comment notification
        comment_notif = next((n for n in notifications if "commented on your post" in n.get("title", "")), None)
        assert comment_notif is not None, "Comment notification should be created"
        print(f"PASS: Comment triggers notification - title: {comment_notif['title']}")
    
    def test_dm_triggers_notification(self):
        """POST /api/wall/dm sends DM and triggers notification for recipient"""
        # User 1 sends DM to User 2
        dm_response = requests.post(f"{BASE_URL}/api/wall/dm", json={
            "from_user_id": TEST_USER_ID,
            "from_user_name": TEST_USER_NAME,
            "to_user_id": TEST_USER_ID_2,
            "to_user_name": TEST_USER_NAME_2,
            "content": "TEST_DM for notification"
        })
        assert dm_response.status_code == 200
        dm_data = dm_response.json()
        assert "id" in dm_data
        
        # Check notifications for user 2
        notif_response = requests.get(f"{BASE_URL}/api/wall/notifications/{TEST_USER_ID_2}")
        assert notif_response.status_code == 200
        notifications = notif_response.json()
        
        # Find the DM notification
        dm_notif = next((n for n in notifications if "New message from" in n.get("title", "")), None)
        assert dm_notif is not None, "DM notification should be created"
        print(f"PASS: DM triggers notification - title: {dm_notif['title']}")
    
    def test_get_notifications(self):
        """GET /api/wall/notifications/{user_id} returns in-app notifications"""
        response = requests.get(f"{BASE_URL}/api/wall/notifications/{TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Get notifications - {len(data)} notifications returned")
    
    def test_get_unread_count(self):
        """GET /api/wall/notifications/unread/{user_id} returns unread count"""
        response = requests.get(f"{BASE_URL}/api/wall/notifications/unread/{TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert isinstance(data["count"], int)
        print(f"PASS: Get unread count - count: {data['count']}")
    
    def test_mark_all_read(self):
        """POST /api/wall/notifications/read-all marks all as read"""
        response = requests.post(f"{BASE_URL}/api/wall/notifications/read-all", json={
            "user_id": TEST_USER_ID
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        
        # Verify unread count is now 0
        unread_response = requests.get(f"{BASE_URL}/api/wall/notifications/unread/{TEST_USER_ID}")
        unread_data = unread_response.json()
        assert unread_data["count"] == 0
        print(f"PASS: Mark all read - unread count now: {unread_data['count']}")


class TestCareersRouterEndpoints:
    """Test Careers endpoints from routes/careers.py"""
    
    def test_careers_apply(self):
        """POST /api/careers/apply still works"""
        # Using form data for careers apply
        response = requests.post(f"{BASE_URL}/api/careers/apply", data={
            "name": "TEST_Applicant",
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "555-0123",
            "location": "Fin & Feathers - Midtown (Atlanta)",
            "position_category": "Front of House",
            "position": "Server"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["status"] == "received"
        print(f"PASS: Careers apply - id: {data['id']}")


class TestRegressionEndpoints:
    """Additional regression tests for endpoints that should still work"""
    
    def test_menu_items(self):
        """GET /api/menu/items returns menu items"""
        response = requests.get(f"{BASE_URL}/api/menu/items")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Menu items - {len(data)} items returned")
    
    def test_homepage_content(self):
        """GET /api/homepage/content returns homepage content"""
        response = requests.get(f"{BASE_URL}/api/homepage/content")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print(f"PASS: Homepage content - keys: {list(data.keys())[:5]}...")
    
    def test_daily_specials(self):
        """GET /api/daily-specials returns daily specials"""
        response = requests.get(f"{BASE_URL}/api/daily-specials")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Daily specials - {len(data)} specials returned")
    
    def test_dj_profiles(self):
        """GET /api/dj/profiles returns DJ profiles"""
        response = requests.get(f"{BASE_URL}/api/dj/profiles")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: DJ profiles - {len(data)} profiles returned")
    
    def test_dj_weekly_schedule(self):
        """GET /api/dj/weekly-schedule returns schedule"""
        response = requests.get(f"{BASE_URL}/api/dj/weekly-schedule")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: DJ weekly schedule - {len(data)} entries returned")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
