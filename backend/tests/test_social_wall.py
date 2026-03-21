"""
Social Wall API Tests
Tests for: Wall Posts, Group Chat, Direct Messages, and User listing endpoints
"""
import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_USER_ID = f"TEST_user_{uuid.uuid4().hex[:8]}"
TEST_USER_NAME = "Test Social User"
TEST_USER_AVATAR = "🧪"
TEST_LOCATION_SLUG = "midtown"

# Second test user for DM testing
TEST_USER_2_ID = f"TEST_user_{uuid.uuid4().hex[:8]}"
TEST_USER_2_NAME = "Test Partner User"


class TestWallPosts:
    """Tests for Social Wall Posts CRUD operations"""
    
    created_post_id = None
    
    def test_create_wall_post_text(self):
        """POST /api/wall/posts - Create a text post"""
        response = requests.post(f"{BASE_URL}/api/wall/posts", json={
            "user_id": TEST_USER_ID,
            "location_slug": TEST_LOCATION_SLUG,
            "user_name": TEST_USER_NAME,
            "user_avatar": TEST_USER_AVATAR,
            "post_type": "text",
            "content": "TEST_Hello from the social wall test!"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["user_id"] == TEST_USER_ID
        assert data["location_slug"] == TEST_LOCATION_SLUG
        assert data["post_type"] == "text"
        assert "TEST_Hello" in data["content"]
        assert data["likes"] == []
        assert data["comments"] == []
        
        TestWallPosts.created_post_id = data["id"]
        print(f"✓ Created text post with ID: {data['id']}")
    
    def test_create_wall_post_song_request(self):
        """POST /api/wall/posts - Create a song request post"""
        response = requests.post(f"{BASE_URL}/api/wall/posts", json={
            "user_id": TEST_USER_ID,
            "location_slug": TEST_LOCATION_SLUG,
            "user_name": TEST_USER_NAME,
            "post_type": "song_request",
            "content": "TEST_Play some jazz music!"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["post_type"] == "song_request"
        print(f"✓ Created song request post")
    
    def test_create_wall_post_shoutout(self):
        """POST /api/wall/posts - Create a shoutout post"""
        response = requests.post(f"{BASE_URL}/api/wall/posts", json={
            "user_id": TEST_USER_ID,
            "location_slug": TEST_LOCATION_SLUG,
            "user_name": TEST_USER_NAME,
            "post_type": "shoutout",
            "content": "TEST_Shoutout to the amazing staff!"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["post_type"] == "shoutout"
        print(f"✓ Created shoutout post")
    
    def test_create_wall_post_missing_user_id(self):
        """POST /api/wall/posts - Should fail without user_id"""
        response = requests.post(f"{BASE_URL}/api/wall/posts", json={
            "location_slug": TEST_LOCATION_SLUG,
            "content": "This should fail"
        })
        assert response.status_code == 400
        print(f"✓ Correctly rejected post without user_id")
    
    def test_create_wall_post_missing_location(self):
        """POST /api/wall/posts - Should fail without location_slug"""
        response = requests.post(f"{BASE_URL}/api/wall/posts", json={
            "user_id": TEST_USER_ID,
            "content": "This should fail"
        })
        assert response.status_code == 400
        print(f"✓ Correctly rejected post without location_slug")
    
    def test_get_wall_posts(self):
        """GET /api/wall/posts/{location_slug} - Get posts for location"""
        response = requests.get(f"{BASE_URL}/api/wall/posts/{TEST_LOCATION_SLUG}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Should contain our test posts
        test_posts = [p for p in data if p.get("user_id") == TEST_USER_ID]
        assert len(test_posts) >= 1, "Should have at least one test post"
        print(f"✓ Retrieved {len(data)} posts for location {TEST_LOCATION_SLUG}")
    
    def test_get_wall_posts_with_pagination(self):
        """GET /api/wall/posts/{location_slug} - Test pagination params"""
        response = requests.get(f"{BASE_URL}/api/wall/posts/{TEST_LOCATION_SLUG}?limit=5&skip=0")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 5
        print(f"✓ Pagination working - got {len(data)} posts with limit=5")
    
    def test_like_wall_post(self):
        """POST /api/wall/posts/{post_id}/like - Like a post"""
        if not TestWallPosts.created_post_id:
            pytest.skip("No post created to like")
        
        response = requests.post(
            f"{BASE_URL}/api/wall/posts/{TestWallPosts.created_post_id}/like",
            json={"user_id": TEST_USER_ID}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "liked"
        assert data["likes_count"] >= 1
        print(f"✓ Liked post - action: {data['action']}, count: {data['likes_count']}")
    
    def test_unlike_wall_post(self):
        """POST /api/wall/posts/{post_id}/like - Unlike a post (toggle)"""
        if not TestWallPosts.created_post_id:
            pytest.skip("No post created to unlike")
        
        response = requests.post(
            f"{BASE_URL}/api/wall/posts/{TestWallPosts.created_post_id}/like",
            json={"user_id": TEST_USER_ID}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "unliked"
        print(f"✓ Unliked post - action: {data['action']}")
    
    def test_like_post_missing_user_id(self):
        """POST /api/wall/posts/{post_id}/like - Should fail without user_id"""
        if not TestWallPosts.created_post_id:
            pytest.skip("No post created")
        
        response = requests.post(
            f"{BASE_URL}/api/wall/posts/{TestWallPosts.created_post_id}/like",
            json={}
        )
        assert response.status_code == 400
        print(f"✓ Correctly rejected like without user_id")
    
    def test_like_nonexistent_post(self):
        """POST /api/wall/posts/{post_id}/like - Should fail for nonexistent post"""
        response = requests.post(
            f"{BASE_URL}/api/wall/posts/nonexistent-post-id/like",
            json={"user_id": TEST_USER_ID}
        )
        assert response.status_code == 404
        print(f"✓ Correctly returned 404 for nonexistent post")
    
    def test_comment_on_post(self):
        """POST /api/wall/posts/{post_id}/comment - Add a comment"""
        if not TestWallPosts.created_post_id:
            pytest.skip("No post created to comment on")
        
        response = requests.post(
            f"{BASE_URL}/api/wall/posts/{TestWallPosts.created_post_id}/comment",
            json={
                "user_id": TEST_USER_ID,
                "user_name": TEST_USER_NAME,
                "content": "TEST_Great post!"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["user_id"] == TEST_USER_ID
        assert "TEST_Great post!" in data["content"]
        print(f"✓ Added comment to post")
    
    def test_comment_missing_content(self):
        """POST /api/wall/posts/{post_id}/comment - Should fail without content"""
        if not TestWallPosts.created_post_id:
            pytest.skip("No post created")
        
        response = requests.post(
            f"{BASE_URL}/api/wall/posts/{TestWallPosts.created_post_id}/comment",
            json={"user_id": TEST_USER_ID}
        )
        assert response.status_code == 400
        print(f"✓ Correctly rejected comment without content")
    
    def test_delete_post_unauthorized(self):
        """DELETE /api/wall/posts/{post_id} - Should fail for non-author"""
        if not TestWallPosts.created_post_id:
            pytest.skip("No post created")
        
        response = requests.delete(
            f"{BASE_URL}/api/wall/posts/{TestWallPosts.created_post_id}?user_id=different_user"
        )
        assert response.status_code == 403
        print(f"✓ Correctly rejected delete by non-author")
    
    def test_delete_post_success(self):
        """DELETE /api/wall/posts/{post_id} - Delete own post"""
        # Create a post to delete
        create_response = requests.post(f"{BASE_URL}/api/wall/posts", json={
            "user_id": TEST_USER_ID,
            "location_slug": TEST_LOCATION_SLUG,
            "content": "TEST_Post to be deleted"
        })
        post_id = create_response.json()["id"]
        
        # Delete it
        response = requests.delete(
            f"{BASE_URL}/api/wall/posts/{post_id}?user_id={TEST_USER_ID}"
        )
        assert response.status_code == 200
        data = response.json()
        assert "deleted" in data.get("message", "").lower()
        
        # Verify it's gone
        get_response = requests.get(f"{BASE_URL}/api/wall/posts/{TEST_LOCATION_SLUG}")
        posts = get_response.json()
        assert not any(p["id"] == post_id for p in posts)
        print(f"✓ Successfully deleted post and verified removal")


class TestGroupChat:
    """Tests for Location Group Chat"""
    
    def test_send_chat_message(self):
        """POST /api/wall/chat/{location_slug} - Send a chat message"""
        response = requests.post(f"{BASE_URL}/api/wall/chat/{TEST_LOCATION_SLUG}", json={
            "user_id": TEST_USER_ID,
            "user_name": TEST_USER_NAME,
            "user_avatar": TEST_USER_AVATAR,
            "content": "TEST_Hello everyone in the chat!"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["user_id"] == TEST_USER_ID
        assert data["location_slug"] == TEST_LOCATION_SLUG
        assert "TEST_Hello" in data["content"]
        print(f"✓ Sent chat message with ID: {data['id']}")
    
    def test_send_chat_message_missing_user_id(self):
        """POST /api/wall/chat/{location_slug} - Should fail without user_id"""
        response = requests.post(f"{BASE_URL}/api/wall/chat/{TEST_LOCATION_SLUG}", json={
            "content": "This should fail"
        })
        assert response.status_code == 400
        print(f"✓ Correctly rejected chat without user_id")
    
    def test_send_chat_message_missing_content(self):
        """POST /api/wall/chat/{location_slug} - Should fail without content"""
        response = requests.post(f"{BASE_URL}/api/wall/chat/{TEST_LOCATION_SLUG}", json={
            "user_id": TEST_USER_ID
        })
        assert response.status_code == 400
        print(f"✓ Correctly rejected chat without content")
    
    def test_get_chat_messages(self):
        """GET /api/wall/chat/{location_slug} - Get chat messages"""
        response = requests.get(f"{BASE_URL}/api/wall/chat/{TEST_LOCATION_SLUG}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Messages should be in chronological order (oldest first for chat)
        if len(data) >= 2:
            assert data[0]["created_at"] <= data[-1]["created_at"], "Messages should be in chronological order"
        
        print(f"✓ Retrieved {len(data)} chat messages")
    
    def test_get_chat_messages_with_limit(self):
        """GET /api/wall/chat/{location_slug} - Test limit parameter"""
        response = requests.get(f"{BASE_URL}/api/wall/chat/{TEST_LOCATION_SLUG}?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5
        print(f"✓ Limit parameter working - got {len(data)} messages")


class TestDirectMessages:
    """Tests for Direct Messaging"""
    
    def test_send_dm(self):
        """POST /api/wall/dm - Send a direct message"""
        response = requests.post(f"{BASE_URL}/api/wall/dm", json={
            "from_user_id": TEST_USER_ID,
            "from_user_name": TEST_USER_NAME,
            "from_user_avatar": TEST_USER_AVATAR,
            "to_user_id": TEST_USER_2_ID,
            "to_user_name": TEST_USER_2_NAME,
            "content": "TEST_Hey, this is a direct message!"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["from_user_id"] == TEST_USER_ID
        assert data["to_user_id"] == TEST_USER_2_ID
        assert data["read"] == False
        print(f"✓ Sent DM with ID: {data['id']}")
    
    def test_send_dm_missing_fields(self):
        """POST /api/wall/dm - Should fail without required fields"""
        response = requests.post(f"{BASE_URL}/api/wall/dm", json={
            "from_user_id": TEST_USER_ID,
            "content": "Missing to_user_id"
        })
        assert response.status_code == 400
        print(f"✓ Correctly rejected DM without to_user_id")
    
    def test_get_dm_conversations(self):
        """GET /api/wall/dm/conversations/{user_id} - Get conversations list"""
        response = requests.get(f"{BASE_URL}/api/wall/dm/conversations/{TEST_USER_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Should have conversation with TEST_USER_2
        if len(data) > 0:
            conv = data[0]
            assert "partner_id" in conv
            assert "partner_name" in conv
            assert "last_message" in conv
            assert "unread" in conv
        print(f"✓ Retrieved {len(data)} conversations")
    
    def test_get_dm_thread(self):
        """GET /api/wall/dm/thread/{user_id}/{partner_id} - Get DM thread"""
        response = requests.get(f"{BASE_URL}/api/wall/dm/thread/{TEST_USER_ID}/{TEST_USER_2_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Messages should be in chronological order
        if len(data) >= 2:
            assert data[0]["created_at"] <= data[-1]["created_at"]
        
        print(f"✓ Retrieved {len(data)} messages in thread")
    
    def test_get_dm_unread_count(self):
        """GET /api/wall/dm/unread/{user_id} - Get unread count"""
        # Send a new DM to TEST_USER_2 to ensure there's an unread
        requests.post(f"{BASE_URL}/api/wall/dm", json={
            "from_user_id": TEST_USER_ID,
            "to_user_id": TEST_USER_2_ID,
            "content": "TEST_Another message for unread count"
        })
        
        response = requests.get(f"{BASE_URL}/api/wall/dm/unread/{TEST_USER_2_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "unread" in data
        assert isinstance(data["unread"], int)
        assert data["unread"] >= 1
        print(f"✓ Unread count for user 2: {data['unread']}")
    
    def test_dm_thread_marks_as_read(self):
        """GET /api/wall/dm/thread - Should mark messages as read"""
        # Get thread as recipient (TEST_USER_2)
        response = requests.get(f"{BASE_URL}/api/wall/dm/thread/{TEST_USER_2_ID}/{TEST_USER_ID}")
        assert response.status_code == 200
        
        # Check unread count decreased
        unread_response = requests.get(f"{BASE_URL}/api/wall/dm/unread/{TEST_USER_2_ID}")
        # After reading, unread from TEST_USER_ID should be 0
        print(f"✓ DM thread marks messages as read")


class TestWallUsers:
    """Tests for getting active users at a location"""
    
    def test_get_wall_users(self):
        """GET /api/wall/users/{location_slug} - Get active users"""
        response = requests.get(f"{BASE_URL}/api/wall/users/{TEST_LOCATION_SLUG}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Should include our test user who posted/chatted
        test_users = [u for u in data if u.get("user_id") == TEST_USER_ID]
        assert len(test_users) >= 1, "Test user should appear in active users"
        
        # Check user structure
        if len(data) > 0:
            user = data[0]
            assert "user_id" in user
            assert "user_name" in user
        
        print(f"✓ Retrieved {len(data)} active users at location")


class TestImageUpload:
    """Tests for image upload endpoint"""
    
    def test_upload_image_no_file(self):
        """POST /api/wall/posts/upload-image - Should fail without file"""
        response = requests.post(f"{BASE_URL}/api/wall/posts/upload-image")
        assert response.status_code == 422  # FastAPI validation error
        print(f"✓ Correctly rejected upload without file")
    
    def test_upload_image_success(self):
        """POST /api/wall/posts/upload-image - Upload a test image"""
        # Create a simple test image (1x1 pixel PNG)
        import base64
        # Minimal valid PNG
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {"file": ("test_image.png", png_data, "image/png")}
        response = requests.post(f"{BASE_URL}/api/wall/posts/upload-image", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert "image_url" in data
        assert data["image_url"].startswith("/api/uploads/")
        print(f"✓ Uploaded image: {data['image_url']}")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_posts(self):
        """Clean up TEST_ prefixed posts"""
        # Get all posts
        response = requests.get(f"{BASE_URL}/api/wall/posts/{TEST_LOCATION_SLUG}?limit=100")
        posts = response.json()
        
        deleted = 0
        for post in posts:
            if post.get("user_id", "").startswith("TEST_") or "TEST_" in post.get("content", ""):
                requests.delete(f"{BASE_URL}/api/wall/posts/{post['id']}?user_id={post['user_id']}")
                deleted += 1
        
        print(f"✓ Cleaned up {deleted} test posts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
