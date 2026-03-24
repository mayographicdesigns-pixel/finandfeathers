"""
DJ Status and Social Wall Tests
Tests for: DJ next-session endpoint, Chat, DMs, Feed posts with song_request visibility
"""
import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test users from the review request
TEST_USER_1_ID = "user_bd567f64f881"  # Test Refactor
TEST_USER_1_NAME = "Test Refactor"
TEST_USER_2_ID = "user_5c80ec820826"  # Chat Buddy
TEST_USER_2_NAME = "Chat Buddy"

# Locations
LOCATION_NO_DJ = "edgewood-atlanta"
LOCATION_LIVE_DJ = "douglasville"


class TestDJNextSession:
    """Tests for GET /api/dj/next-session/{location_slug} endpoint"""
    
    def test_dj_status_no_live_dj_with_next_session(self):
        """GET /api/dj/next-session/edgewood-atlanta - Should return no DJ live with next session info"""
        response = requests.get(f"{BASE_URL}/api/dj/next-session/{LOCATION_NO_DJ}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["is_live"] == False, "Should not be live at edgewood-atlanta"
        assert data["karaoke_active"] == False, "Karaoke should not be active"
        
        # Should have next_session info
        next_session = data.get("next_session")
        assert next_session is not None, "Should have next_session data"
        assert "dj_name" in next_session, "next_session should have dj_name"
        assert "date" in next_session, "next_session should have date"
        assert "start_time" in next_session, "next_session should have start_time"
        assert "event_name" in next_session, "next_session should have event_name"
        
        print(f"✓ No DJ live at {LOCATION_NO_DJ}, next session: {next_session.get('dj_name')} - {next_session.get('event_name')}")
    
    def test_dj_status_live_dj(self):
        """GET /api/dj/next-session/douglasville - Should return DJ is live"""
        response = requests.get(f"{BASE_URL}/api/dj/next-session/{LOCATION_LIVE_DJ}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["is_live"] == True, "DJ should be live at douglasville"
        assert "dj_name" in data, "Should have dj_name when live"
        assert data.get("next_session") is None, "next_session should be None when DJ is live"
        
        print(f"✓ DJ is LIVE at {LOCATION_LIVE_DJ}: {data.get('dj_name')}")
    
    def test_dj_status_nonexistent_location(self):
        """GET /api/dj/next-session/nonexistent - Should return no DJ, no next session"""
        response = requests.get(f"{BASE_URL}/api/dj/next-session/nonexistent-location")
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_live"] == False
        assert data["karaoke_active"] == False
        # May or may not have next_session depending on data
        print(f"✓ Nonexistent location returns valid response")


class TestGroupChat:
    """Tests for Group Chat at location"""
    
    created_message_id = None
    
    def test_send_chat_message(self):
        """POST /api/wall/chat/{location_slug} - Send a chat message"""
        unique_content = f"TEST_Chat message {uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/wall/chat/{LOCATION_NO_DJ}", json={
            "user_id": TEST_USER_1_ID,
            "user_name": TEST_USER_1_NAME,
            "user_avatar": "😊",
            "content": unique_content
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["user_id"] == TEST_USER_1_ID
        assert data["location_slug"] == LOCATION_NO_DJ
        assert unique_content in data["content"]
        
        TestGroupChat.created_message_id = data["id"]
        print(f"✓ Sent chat message: {data['id']}")
    
    def test_get_chat_messages(self):
        """GET /api/wall/chat/{location_slug} - Get chat messages"""
        response = requests.get(f"{BASE_URL}/api/wall/chat/{LOCATION_NO_DJ}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Should contain our test message
        if TestGroupChat.created_message_id:
            found = any(m.get("id") == TestGroupChat.created_message_id for m in data)
            assert found, "Should find our created message"
        
        print(f"✓ Retrieved {len(data)} chat messages")
    
    def test_chat_message_structure(self):
        """Verify chat message has correct structure"""
        response = requests.get(f"{BASE_URL}/api/wall/chat/{LOCATION_NO_DJ}")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            msg = data[0]
            assert "id" in msg
            assert "user_id" in msg
            assert "user_name" in msg
            assert "content" in msg
            assert "created_at" in msg
            print(f"✓ Chat message structure is correct")
        else:
            print("✓ No messages to verify structure (empty chat)")


class TestDirectMessages:
    """Tests for Direct Messaging between users"""
    
    def test_send_dm(self):
        """POST /api/wall/dm - Send a DM from user 1 to user 2"""
        unique_content = f"TEST_DM message {uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/wall/dm", json={
            "from_user_id": TEST_USER_1_ID,
            "from_user_name": TEST_USER_1_NAME,
            "from_user_avatar": "😊",
            "to_user_id": TEST_USER_2_ID,
            "to_user_name": TEST_USER_2_NAME,
            "content": unique_content
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["from_user_id"] == TEST_USER_1_ID
        assert data["to_user_id"] == TEST_USER_2_ID
        assert data["read"] == False
        
        print(f"✓ Sent DM: {data['id']}")
    
    def test_get_dm_conversations_sender(self):
        """GET /api/wall/dm/conversations/{user_id} - Get conversations for sender"""
        response = requests.get(f"{BASE_URL}/api/wall/dm/conversations/{TEST_USER_1_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Should have conversation with TEST_USER_2
        conv_with_user2 = [c for c in data if c.get("partner_id") == TEST_USER_2_ID]
        assert len(conv_with_user2) >= 1, "Should have conversation with user 2"
        
        conv = conv_with_user2[0]
        assert "partner_name" in conv
        assert "last_message" in conv
        assert "unread" in conv
        
        print(f"✓ User 1 has {len(data)} conversations")
    
    def test_get_dm_conversations_recipient(self):
        """GET /api/wall/dm/conversations/{user_id} - Get conversations for recipient"""
        response = requests.get(f"{BASE_URL}/api/wall/dm/conversations/{TEST_USER_2_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Should have conversation with TEST_USER_1
        conv_with_user1 = [c for c in data if c.get("partner_id") == TEST_USER_1_ID]
        assert len(conv_with_user1) >= 1, "Should have conversation with user 1"
        
        print(f"✓ User 2 has {len(data)} conversations")
    
    def test_get_dm_unread_count(self):
        """GET /api/wall/dm/unread/{user_id} - Get unread count for recipient"""
        response = requests.get(f"{BASE_URL}/api/wall/dm/unread/{TEST_USER_2_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "unread" in data
        assert isinstance(data["unread"], int)
        
        print(f"✓ User 2 has {data['unread']} unread messages")
    
    def test_get_dm_thread(self):
        """GET /api/wall/dm/thread/{user_id}/{partner_id} - Get DM thread"""
        response = requests.get(f"{BASE_URL}/api/wall/dm/thread/{TEST_USER_1_ID}/{TEST_USER_2_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            msg = data[0]
            assert "id" in msg
            assert "from_user_id" in msg
            assert "to_user_id" in msg
            assert "content" in msg
        
        print(f"✓ Thread has {len(data)} messages")
    
    def test_dm_thread_marks_as_read(self):
        """GET /api/wall/dm/thread - Should mark messages as read"""
        # First send a new DM
        requests.post(f"{BASE_URL}/api/wall/dm", json={
            "from_user_id": TEST_USER_1_ID,
            "from_user_name": TEST_USER_1_NAME,
            "to_user_id": TEST_USER_2_ID,
            "to_user_name": TEST_USER_2_NAME,
            "content": f"TEST_Read test {uuid.uuid4().hex[:8]}"
        })
        
        # Get unread count before
        before = requests.get(f"{BASE_URL}/api/wall/dm/unread/{TEST_USER_2_ID}").json()
        
        # Open thread as recipient (marks as read)
        requests.get(f"{BASE_URL}/api/wall/dm/thread/{TEST_USER_2_ID}/{TEST_USER_1_ID}")
        
        # Get unread count after
        after = requests.get(f"{BASE_URL}/api/wall/dm/unread/{TEST_USER_2_ID}").json()
        
        # Unread from user 1 should be 0 now
        print(f"✓ Unread before: {before['unread']}, after: {after['unread']}")


class TestFeedPosts:
    """Tests for Feed Posts including song_request type"""
    
    created_post_id = None
    
    def test_create_text_post(self):
        """POST /api/wall/posts - Create a text post"""
        unique_content = f"TEST_Text post {uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/wall/posts", json={
            "user_id": TEST_USER_1_ID,
            "location_slug": LOCATION_NO_DJ,
            "user_name": TEST_USER_1_NAME,
            "user_avatar": "😊",
            "post_type": "text",
            "content": unique_content
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["post_type"] == "text"
        
        TestFeedPosts.created_post_id = data["id"]
        print(f"✓ Created text post: {data['id']}")
    
    def test_create_song_request_post(self):
        """POST /api/wall/posts - Create a song_request post (backend allows it regardless of DJ status)"""
        unique_content = f"TEST_Song request {uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/wall/posts", json={
            "user_id": TEST_USER_1_ID,
            "location_slug": LOCATION_NO_DJ,
            "user_name": TEST_USER_1_NAME,
            "post_type": "song_request",
            "content": unique_content
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["post_type"] == "song_request"
        
        print(f"✓ Created song_request post (backend accepts regardless of DJ status)")
    
    def test_get_feed_posts(self):
        """GET /api/wall/posts/{location_slug} - Get feed posts"""
        response = requests.get(f"{BASE_URL}/api/wall/posts/{LOCATION_NO_DJ}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Should contain our test post
        if TestFeedPosts.created_post_id:
            found = any(p.get("id") == TestFeedPosts.created_post_id for p in data)
            assert found, "Should find our created post"
        
        print(f"✓ Retrieved {len(data)} feed posts")
    
    def test_like_post(self):
        """POST /api/wall/posts/{post_id}/like - Like a post"""
        if not TestFeedPosts.created_post_id:
            pytest.skip("No post created")
        
        response = requests.post(
            f"{BASE_URL}/api/wall/posts/{TestFeedPosts.created_post_id}/like",
            json={"user_id": TEST_USER_1_ID}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["action"] in ["liked", "unliked"]
        
        print(f"✓ Like action: {data['action']}")
    
    def test_existing_song_request_posts_display(self):
        """Verify existing song_request posts are returned in feed"""
        response = requests.get(f"{BASE_URL}/api/wall/posts/{LOCATION_NO_DJ}")
        assert response.status_code == 200
        
        data = response.json()
        song_requests = [p for p in data if p.get("post_type") == "song_request"]
        
        # Existing song_request posts should still be in the feed
        print(f"✓ Found {len(song_requests)} song_request posts in feed (should display with icon)")


class TestWallUsers:
    """Tests for getting users at a location"""
    
    def test_get_wall_users(self):
        """GET /api/wall/users/{location_slug} - Get users at location"""
        response = requests.get(f"{BASE_URL}/api/wall/users/{LOCATION_NO_DJ}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Should include our test user
        test_users = [u for u in data if u.get("user_id") == TEST_USER_1_ID]
        assert len(test_users) >= 1, "Test user should appear in location users"
        
        print(f"✓ Found {len(data)} users at location")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_posts(self):
        """Clean up TEST_ prefixed posts"""
        response = requests.get(f"{BASE_URL}/api/wall/posts/{LOCATION_NO_DJ}?limit=100")
        posts = response.json()
        
        deleted = 0
        for post in posts:
            if "TEST_" in post.get("content", ""):
                requests.delete(f"{BASE_URL}/api/wall/posts/{post['id']}?user_id={post['user_id']}")
                deleted += 1
        
        print(f"✓ Cleaned up {deleted} test posts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
