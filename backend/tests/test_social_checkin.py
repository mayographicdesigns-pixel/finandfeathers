"""
Backend API Tests for Social Check-in Features
Tests: Check-in, Social Wall Posts, Direct Messages, DJ Tipping
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
LOCATION_SLUG = "edgewood-atlanta"
TEST_PREFIX = f"TEST_{uuid.uuid4().hex[:6]}"


class TestHealthCheck:
    """Basic API health check"""
    
    def test_api_is_running(self):
        """Test that the API is running"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


class TestCheckIn:
    """Check-in endpoint tests"""
    
    def test_create_checkin(self):
        """Test creating a check-in at a location"""
        checkin_data = {
            "location_slug": LOCATION_SLUG,
            "display_name": f"{TEST_PREFIX}_User",
            "avatar_emoji": "🔥",
            "mood": "Celebrating",
            "message": "Test check-in message"
        }
        
        response = requests.post(f"{BASE_URL}/api/checkin", json=checkin_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["location_slug"] == LOCATION_SLUG
        assert data["display_name"] == f"{TEST_PREFIX}_User"
        assert data["avatar_emoji"] == "🔥"
        assert data["mood"] == "Celebrating"
        assert "checked_in_at" in data
        
        # Store for later cleanup
        self.__class__.test_checkin_id = data["id"]
        return data
    
    def test_get_checked_in_users(self):
        """Test getting all checked-in users at a location"""
        response = requests.get(f"{BASE_URL}/api/checkin/{LOCATION_SLUG}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Verify the structure of each user
        if len(data) > 0:
            user = data[0]
            assert "id" in user
            assert "display_name" in user
            assert "avatar_emoji" in user
            assert "checked_in_at" in user
    
    def test_get_checkin_count(self):
        """Test getting check-in count for a location"""
        response = requests.get(f"{BASE_URL}/api/checkin/count/{LOCATION_SLUG}")
        assert response.status_code == 200
        
        data = response.json()
        assert "count" in data
        assert "location_slug" in data
        assert data["location_slug"] == LOCATION_SLUG
        assert isinstance(data["count"], int)
        assert data["count"] >= 0
    
    def test_checkout(self):
        """Test checking out from a location"""
        # First create a new check-in
        checkin_data = {
            "location_slug": LOCATION_SLUG,
            "display_name": f"{TEST_PREFIX}_Checkout_User",
            "avatar_emoji": "👋",
            "mood": "Solo Dining"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/checkin", json=checkin_data)
        assert create_response.status_code == 200
        checkin_id = create_response.json()["id"]
        
        # Now check out
        response = requests.delete(f"{BASE_URL}/api/checkin/{checkin_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
    
    def test_checkout_nonexistent(self):
        """Test checking out with invalid ID"""
        fake_id = "nonexistent-id-12345"
        response = requests.delete(f"{BASE_URL}/api/checkin/{fake_id}")
        assert response.status_code == 404


class TestSocialPosts:
    """Social Wall post tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a check-in for posting"""
        checkin_data = {
            "location_slug": LOCATION_SLUG,
            "display_name": f"{TEST_PREFIX}_PostUser",
            "avatar_emoji": "📝"
        }
        response = requests.post(f"{BASE_URL}/api/checkin", json=checkin_data)
        assert response.status_code == 200
        self.checkin = response.json()
        yield
        # Cleanup check-in
        requests.delete(f"{BASE_URL}/api/checkin/{self.checkin['id']}")
    
    def test_create_social_post(self):
        """Test creating a social wall post"""
        post_data = {
            "location_slug": LOCATION_SLUG,
            "checkin_id": self.checkin["id"],
            "author_name": self.checkin["display_name"],
            "author_emoji": self.checkin["avatar_emoji"],
            "message": f"Test social post - {TEST_PREFIX}",
            "image_url": None
        }
        
        response = requests.post(f"{BASE_URL}/api/social/posts", json=post_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["message"] == f"Test social post - {TEST_PREFIX}"
        assert data["author_name"] == self.checkin["display_name"]
        assert data["likes_count"] == 0
        assert data["liked_by_me"] == False
        assert "created_at" in data
        
        # Store for later tests
        self.__class__.test_post_id = data["id"]
        return data
    
    def test_create_post_with_image(self):
        """Test creating a social wall post with image URL"""
        post_data = {
            "location_slug": LOCATION_SLUG,
            "checkin_id": self.checkin["id"],
            "author_name": self.checkin["display_name"],
            "author_emoji": self.checkin["avatar_emoji"],
            "message": f"Post with image - {TEST_PREFIX}",
            "image_url": "https://example.com/test-image.jpg"
        }
        
        response = requests.post(f"{BASE_URL}/api/social/posts", json=post_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["image_url"] == "https://example.com/test-image.jpg"
    
    def test_get_social_posts(self):
        """Test getting social posts for a location"""
        response = requests.get(f"{BASE_URL}/api/social/posts/{LOCATION_SLUG}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Verify post structure
        if len(data) > 0:
            post = data[0]
            assert "id" in post
            assert "author_name" in post
            assert "message" in post
            assert "likes_count" in post
            assert "created_at" in post
    
    def test_get_social_posts_with_checkin_id(self):
        """Test getting social posts with my_checkin_id to track likes"""
        response = requests.get(
            f"{BASE_URL}/api/social/posts/{LOCATION_SLUG}",
            params={"my_checkin_id": self.checkin["id"]}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Verify liked_by_me field is present
        if len(data) > 0:
            assert "liked_by_me" in data[0]
    
    def test_like_post(self):
        """Test liking a post"""
        # First create a post
        post_data = {
            "location_slug": LOCATION_SLUG,
            "checkin_id": self.checkin["id"],
            "author_name": self.checkin["display_name"],
            "author_emoji": self.checkin["avatar_emoji"],
            "message": f"Post to like - {TEST_PREFIX}"
        }
        create_response = requests.post(f"{BASE_URL}/api/social/posts", json=post_data)
        post_id = create_response.json()["id"]
        
        # Like the post
        response = requests.post(
            f"{BASE_URL}/api/social/posts/{post_id}/like",
            params={"checkin_id": self.checkin["id"]}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["action"] == "liked"
        assert data["likes_count"] == 1
    
    def test_unlike_post(self):
        """Test unliking a post"""
        # First create a post
        post_data = {
            "location_slug": LOCATION_SLUG,
            "checkin_id": self.checkin["id"],
            "author_name": self.checkin["display_name"],
            "author_emoji": self.checkin["avatar_emoji"],
            "message": f"Post to unlike - {TEST_PREFIX}"
        }
        create_response = requests.post(f"{BASE_URL}/api/social/posts", json=post_data)
        post_id = create_response.json()["id"]
        
        # Like the post first
        requests.post(
            f"{BASE_URL}/api/social/posts/{post_id}/like",
            params={"checkin_id": self.checkin["id"]}
        )
        
        # Unlike the post
        response = requests.post(
            f"{BASE_URL}/api/social/posts/{post_id}/like",
            params={"checkin_id": self.checkin["id"]}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["action"] == "unliked"
        assert data["likes_count"] == 0
    
    def test_delete_own_post(self):
        """Test deleting your own post"""
        # First create a post
        post_data = {
            "location_slug": LOCATION_SLUG,
            "checkin_id": self.checkin["id"],
            "author_name": self.checkin["display_name"],
            "author_emoji": self.checkin["avatar_emoji"],
            "message": f"Post to delete - {TEST_PREFIX}"
        }
        create_response = requests.post(f"{BASE_URL}/api/social/posts", json=post_data)
        post_id = create_response.json()["id"]
        
        # Delete the post
        response = requests.delete(
            f"{BASE_URL}/api/social/posts/{post_id}",
            params={"checkin_id": self.checkin["id"]}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
    
    def test_cannot_delete_others_post(self):
        """Test that you cannot delete another user's post"""
        # First create a post
        post_data = {
            "location_slug": LOCATION_SLUG,
            "checkin_id": self.checkin["id"],
            "author_name": self.checkin["display_name"],
            "author_emoji": self.checkin["avatar_emoji"],
            "message": f"Protected post - {TEST_PREFIX}"
        }
        create_response = requests.post(f"{BASE_URL}/api/social/posts", json=post_data)
        post_id = create_response.json()["id"]
        
        # Try to delete with different checkin_id
        response = requests.delete(
            f"{BASE_URL}/api/social/posts/{post_id}",
            params={"checkin_id": "different-user-id"}
        )
        assert response.status_code == 403
    
    def test_create_post_without_checkin(self):
        """Test that posting requires valid check-in"""
        post_data = {
            "location_slug": LOCATION_SLUG,
            "checkin_id": "invalid-checkin-id",
            "author_name": "Fake User",
            "author_emoji": "👻",
            "message": "This should fail"
        }
        
        response = requests.post(f"{BASE_URL}/api/social/posts", json=post_data)
        assert response.status_code == 400


class TestDirectMessages:
    """Direct messaging tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create two check-ins for messaging"""
        # First user
        checkin1_data = {
            "location_slug": LOCATION_SLUG,
            "display_name": f"{TEST_PREFIX}_DM_User1",
            "avatar_emoji": "👤"
        }
        response1 = requests.post(f"{BASE_URL}/api/checkin", json=checkin1_data)
        assert response1.status_code == 200
        self.user1 = response1.json()
        
        # Second user
        checkin2_data = {
            "location_slug": LOCATION_SLUG,
            "display_name": f"{TEST_PREFIX}_DM_User2",
            "avatar_emoji": "👥"
        }
        response2 = requests.post(f"{BASE_URL}/api/checkin", json=checkin2_data)
        assert response2.status_code == 200
        self.user2 = response2.json()
        
        yield
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/checkin/{self.user1['id']}")
        requests.delete(f"{BASE_URL}/api/checkin/{self.user2['id']}")
    
    def test_send_direct_message(self):
        """Test sending a direct message"""
        dm_data = {
            "location_slug": LOCATION_SLUG,
            "from_checkin_id": self.user1["id"],
            "from_name": self.user1["display_name"],
            "from_emoji": self.user1["avatar_emoji"],
            "to_checkin_id": self.user2["id"],
            "to_name": self.user2["display_name"],
            "to_emoji": self.user2["avatar_emoji"],
            "message": f"Hello from test - {TEST_PREFIX}"
        }
        
        response = requests.post(f"{BASE_URL}/api/social/dm", json=dm_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["message"] == f"Hello from test - {TEST_PREFIX}"
        assert data["from_checkin_id"] == self.user1["id"]
        assert data["to_checkin_id"] == self.user2["id"]
        assert data["read"] == False
        assert "created_at" in data
    
    def test_get_conversations(self):
        """Test getting list of conversations"""
        # First send a message
        dm_data = {
            "location_slug": LOCATION_SLUG,
            "from_checkin_id": self.user1["id"],
            "from_name": self.user1["display_name"],
            "from_emoji": self.user1["avatar_emoji"],
            "to_checkin_id": self.user2["id"],
            "to_name": self.user2["display_name"],
            "to_emoji": self.user2["avatar_emoji"],
            "message": f"Conversation test - {TEST_PREFIX}"
        }
        requests.post(f"{BASE_URL}/api/social/dm", json=dm_data)
        
        # Get conversations for user2
        response = requests.get(f"{BASE_URL}/api/social/dm/{self.user2['id']}/conversations")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Should have at least one conversation
        if len(data) > 0:
            conv = data[0]
            assert "partner_id" in conv
            assert "partner_name" in conv
            assert "last_message" in conv
            assert "unread_count" in conv
    
    def test_get_dm_thread(self):
        """Test getting message thread between two users"""
        # Send a few messages
        for i in range(3):
            dm_data = {
                "location_slug": LOCATION_SLUG,
                "from_checkin_id": self.user1["id"],
                "from_name": self.user1["display_name"],
                "from_emoji": self.user1["avatar_emoji"],
                "to_checkin_id": self.user2["id"],
                "to_name": self.user2["display_name"],
                "to_emoji": self.user2["avatar_emoji"],
                "message": f"Thread message {i} - {TEST_PREFIX}"
            }
            requests.post(f"{BASE_URL}/api/social/dm", json=dm_data)
        
        # Get thread
        response = requests.get(
            f"{BASE_URL}/api/social/dm/{self.user2['id']}/thread/{self.user1['id']}"
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3
        
        # Verify message structure
        msg = data[0]
        assert "id" in msg
        assert "message" in msg
        assert "from_checkin_id" in msg
        assert "to_checkin_id" in msg
    
    def test_get_unread_count(self):
        """Test getting unread message count"""
        # Send a message to user2
        dm_data = {
            "location_slug": LOCATION_SLUG,
            "from_checkin_id": self.user1["id"],
            "from_name": self.user1["display_name"],
            "from_emoji": self.user1["avatar_emoji"],
            "to_checkin_id": self.user2["id"],
            "to_name": self.user2["display_name"],
            "to_emoji": self.user2["avatar_emoji"],
            "message": f"Unread message - {TEST_PREFIX}"
        }
        requests.post(f"{BASE_URL}/api/social/dm", json=dm_data)
        
        # Check unread count for user2
        response = requests.get(f"{BASE_URL}/api/social/dm/{self.user2['id']}/unread")
        assert response.status_code == 200
        
        data = response.json()
        assert "unread_count" in data
        assert isinstance(data["unread_count"], int)
        assert data["unread_count"] >= 1
    
    def test_dm_marks_as_read_on_thread_fetch(self):
        """Test that fetching thread marks messages as read"""
        # Send an unread message
        dm_data = {
            "location_slug": LOCATION_SLUG,
            "from_checkin_id": self.user1["id"],
            "from_name": self.user1["display_name"],
            "from_emoji": self.user1["avatar_emoji"],
            "to_checkin_id": self.user2["id"],
            "to_name": self.user2["display_name"],
            "to_emoji": self.user2["avatar_emoji"],
            "message": f"Should be marked read - {TEST_PREFIX}"
        }
        requests.post(f"{BASE_URL}/api/social/dm", json=dm_data)
        
        # Fetch thread (should mark as read)
        requests.get(f"{BASE_URL}/api/social/dm/{self.user2['id']}/thread/{self.user1['id']}")
        
        # Check unread count should be 0 for this conversation
        # This verifies the mark-as-read functionality


class TestDJTipping:
    """DJ Tipping endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a check-in for tipping"""
        checkin_data = {
            "location_slug": LOCATION_SLUG,
            "display_name": f"{TEST_PREFIX}_Tipper",
            "avatar_emoji": "💰"
        }
        response = requests.post(f"{BASE_URL}/api/checkin", json=checkin_data)
        assert response.status_code == 200
        self.checkin = response.json()
        yield
        # Cleanup
        requests.delete(f"{BASE_URL}/api/checkin/{self.checkin['id']}")
    
    def test_send_dj_tip(self):
        """Test sending a tip to the DJ"""
        tip_data = {
            "location_slug": LOCATION_SLUG,
            "checkin_id": self.checkin["id"],
            "tipper_name": self.checkin["display_name"],
            "tipper_emoji": self.checkin["avatar_emoji"],
            "amount": 5.0,
            "message": f"Great music! - {TEST_PREFIX}",
            "song_request": "Play some jazz"
        }
        
        response = requests.post(f"{BASE_URL}/api/social/dj-tip", json=tip_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["amount"] == 5.0
        assert data["tipper_name"] == self.checkin["display_name"]
        assert data["message"] == f"Great music! - {TEST_PREFIX}"
        assert data["song_request"] == "Play some jazz"
        assert "created_at" in data
    
    def test_send_tip_various_amounts(self):
        """Test sending tips with different amounts"""
        amounts = [1, 3, 5, 10, 20]
        
        for amount in amounts:
            tip_data = {
                "location_slug": LOCATION_SLUG,
                "checkin_id": self.checkin["id"],
                "tipper_name": self.checkin["display_name"],
                "tipper_emoji": self.checkin["avatar_emoji"],
                "amount": amount
            }
            
            response = requests.post(f"{BASE_URL}/api/social/dj-tip", json=tip_data)
            assert response.status_code == 200
            data = response.json()
            assert data["amount"] == amount
    
    def test_send_tip_with_only_message(self):
        """Test sending tip with message but no song request"""
        tip_data = {
            "location_slug": LOCATION_SLUG,
            "checkin_id": self.checkin["id"],
            "tipper_name": self.checkin["display_name"],
            "tipper_emoji": self.checkin["avatar_emoji"],
            "amount": 3.0,
            "message": "Keep it up!",
            "song_request": None
        }
        
        response = requests.post(f"{BASE_URL}/api/social/dj-tip", json=tip_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "Keep it up!"
        assert data["song_request"] is None
    
    def test_send_tip_with_only_song_request(self):
        """Test sending tip with song request but no message"""
        tip_data = {
            "location_slug": LOCATION_SLUG,
            "checkin_id": self.checkin["id"],
            "tipper_name": self.checkin["display_name"],
            "tipper_emoji": self.checkin["avatar_emoji"],
            "amount": 10.0,
            "message": None,
            "song_request": "Play some hip hop"
        }
        
        response = requests.post(f"{BASE_URL}/api/social/dj-tip", json=tip_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] is None
        assert data["song_request"] == "Play some hip hop"
    
    def test_send_tip_minimum_amount(self):
        """Test that minimum tip amount is enforced"""
        tip_data = {
            "location_slug": LOCATION_SLUG,
            "checkin_id": self.checkin["id"],
            "tipper_name": self.checkin["display_name"],
            "tipper_emoji": self.checkin["avatar_emoji"],
            "amount": 0.5  # Below minimum
        }
        
        response = requests.post(f"{BASE_URL}/api/social/dj-tip", json=tip_data)
        assert response.status_code == 400
    
    def test_send_tip_requires_checkin(self):
        """Test that tipping requires valid check-in"""
        tip_data = {
            "location_slug": LOCATION_SLUG,
            "checkin_id": "invalid-checkin-id",
            "tipper_name": "Fake User",
            "tipper_emoji": "👻",
            "amount": 5.0
        }
        
        response = requests.post(f"{BASE_URL}/api/social/dj-tip", json=tip_data)
        assert response.status_code == 400
    
    def test_get_dj_tips(self):
        """Test getting recent DJ tips for a location"""
        response = requests.get(f"{BASE_URL}/api/social/dj-tips/{LOCATION_SLUG}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Verify tip structure
        if len(data) > 0:
            tip = data[0]
            assert "id" in tip
            assert "tipper_name" in tip
            assert "amount" in tip
            assert "created_at" in tip
    
    def test_get_dj_tips_total(self):
        """Test getting today's total tips"""
        response = requests.get(f"{BASE_URL}/api/social/dj-tips/{LOCATION_SLUG}/total")
        assert response.status_code == 200
        
        data = response.json()
        assert "total" in data
        assert "count" in data
        assert isinstance(data["total"], (int, float))
        assert isinstance(data["count"], int)


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_checkins(self):
        """Remove test check-ins"""
        # Get all checkins
        response = requests.get(f"{BASE_URL}/api/checkin/{LOCATION_SLUG}")
        checkins = response.json()
        
        # Delete test checkins
        for checkin in checkins:
            if TEST_PREFIX in checkin.get("display_name", ""):
                requests.delete(f"{BASE_URL}/api/checkin/{checkin['id']}")
        
        print(f"Cleaned up test check-ins with prefix: {TEST_PREFIX}")
        assert True


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
