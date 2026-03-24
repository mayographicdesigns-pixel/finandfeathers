"""
Test Events API, Account-CheckIn Link, and DMs features
Tests for iteration 35
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://staff-client-roles.preview.emergentagent.com').rstrip('/')

# Test users from previous iterations
TEST_USER_1 = {"id": "user_bd567f64f881", "name": "Test Refactor"}
TEST_USER_2 = {"id": "user_5c80ec820826", "name": "Chat Buddy"}


class TestEventsAPI:
    """Test Events endpoints - public and admin"""
    
    def test_get_public_events_returns_active_only(self):
        """GET /api/events should return only active events"""
        response = requests.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        events = response.json()
        assert isinstance(events, list), "Events should be a list"
        assert len(events) > 0, "Should have at least one event"
        
        # All returned events should be active
        for event in events:
            assert event.get("is_active") == True, f"Event {event.get('id')} should be active"
            assert "name" in event, "Event should have name"
            assert "id" in event, "Event should have id"
        
        print(f"PASS: GET /api/events returns {len(events)} active events")
    
    def test_events_have_required_fields(self):
        """Events should have all required fields"""
        response = requests.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        
        events = response.json()
        required_fields = ["id", "name", "is_active"]
        
        for event in events[:3]:  # Check first 3 events
            for field in required_fields:
                assert field in event, f"Event missing required field: {field}"
        
        print("PASS: Events have required fields")
    
    def test_event_packages_endpoint(self):
        """GET /api/events/packages should return package definitions"""
        response = requests.get(f"{BASE_URL}/api/events/packages")
        assert response.status_code == 200
        
        packages = response.json()
        assert isinstance(packages, dict), "Packages should be a dict"
        
        # Should have at least general package
        assert "general" in packages, "Should have general package"
        
        print(f"PASS: GET /api/events/packages returns {len(packages)} packages")


class TestDMsAPI:
    """Test DM (Direct Messages) endpoints"""
    
    def test_get_dm_conversations(self):
        """GET /api/wall/dm/conversations/{userId} should return conversations"""
        response = requests.get(f"{BASE_URL}/api/wall/dm/conversations/{TEST_USER_1['id']}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        conversations = response.json()
        assert isinstance(conversations, list), "Conversations should be a list"
        
        print(f"PASS: GET /api/wall/dm/conversations returns {len(conversations)} conversations")
        return conversations
    
    def test_dm_conversations_have_partner_info(self):
        """DM conversations should have partner info"""
        response = requests.get(f"{BASE_URL}/api/wall/dm/conversations/{TEST_USER_1['id']}")
        assert response.status_code == 200
        
        conversations = response.json()
        if len(conversations) > 0:
            convo = conversations[0]
            assert "partner_id" in convo, "Conversation should have partner_id"
            assert "partner_name" in convo, "Conversation should have partner_name"
            print(f"PASS: Conversation has partner info: {convo.get('partner_name')}")
        else:
            print("PASS: No conversations yet (expected for new user)")
    
    def test_get_dm_thread(self):
        """GET /api/wall/dm/thread/{userId}/{partnerId} should return messages"""
        response = requests.get(f"{BASE_URL}/api/wall/dm/thread/{TEST_USER_1['id']}/{TEST_USER_2['id']}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        messages = response.json()
        assert isinstance(messages, list), "Thread should be a list"
        
        print(f"PASS: GET /api/wall/dm/thread returns {len(messages)} messages")
        return messages
    
    def test_dm_thread_messages_have_required_fields(self):
        """DM messages should have required fields"""
        response = requests.get(f"{BASE_URL}/api/wall/dm/thread/{TEST_USER_1['id']}/{TEST_USER_2['id']}")
        assert response.status_code == 200
        
        messages = response.json()
        if len(messages) > 0:
            msg = messages[0]
            required_fields = ["id", "from_user_id", "to_user_id", "content", "created_at"]
            for field in required_fields:
                assert field in msg, f"Message missing field: {field}"
            print("PASS: DM messages have required fields")
        else:
            print("PASS: No messages yet (will test send)")
    
    def test_get_unread_count(self):
        """GET /api/wall/dm/unread/{userId} should return unread count"""
        response = requests.get(f"{BASE_URL}/api/wall/dm/unread/{TEST_USER_1['id']}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "unread" in data, "Response should have unread count"
        assert isinstance(data["unread"], int), "Unread should be an integer"
        
        print(f"PASS: GET /api/wall/dm/unread returns unread={data['unread']}")
    
    def test_send_dm(self):
        """POST /api/wall/dm should send a DM"""
        test_content = f"TEST_DM_{uuid.uuid4().hex[:8]}"
        
        payload = {
            "from_user_id": TEST_USER_1["id"],
            "from_user_name": TEST_USER_1["name"],
            "from_user_avatar": "😊",
            "to_user_id": TEST_USER_2["id"],
            "to_user_name": TEST_USER_2["name"],
            "content": test_content
        }
        
        response = requests.post(
            f"{BASE_URL}/api/wall/dm",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        msg = response.json()
        assert msg.get("content") == test_content, "Message content should match"
        assert msg.get("from_user_id") == TEST_USER_1["id"], "Sender should match"
        assert msg.get("to_user_id") == TEST_USER_2["id"], "Recipient should match"
        
        print(f"PASS: POST /api/wall/dm sent message successfully")
        return msg
    
    def test_sent_dm_appears_in_thread(self):
        """Sent DM should appear in thread"""
        # Send a unique message
        test_content = f"TEST_VERIFY_{uuid.uuid4().hex[:8]}"
        
        payload = {
            "from_user_id": TEST_USER_1["id"],
            "from_user_name": TEST_USER_1["name"],
            "from_user_avatar": "😊",
            "to_user_id": TEST_USER_2["id"],
            "to_user_name": TEST_USER_2["name"],
            "content": test_content
        }
        
        send_response = requests.post(f"{BASE_URL}/api/wall/dm", json=payload)
        assert send_response.status_code == 200
        
        # Verify it appears in thread
        thread_response = requests.get(f"{BASE_URL}/api/wall/dm/thread/{TEST_USER_1['id']}/{TEST_USER_2['id']}")
        assert thread_response.status_code == 200
        
        messages = thread_response.json()
        found = any(m.get("content") == test_content for m in messages)
        assert found, "Sent message should appear in thread"
        
        print("PASS: Sent DM appears in thread")


class TestUserProfileAPI:
    """Test User Profile endpoints"""
    
    def test_get_user_profile(self):
        """GET /api/user/profile/{id} should return user profile"""
        response = requests.get(f"{BASE_URL}/api/user/profile/{TEST_USER_1['id']}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        profile = response.json()
        assert profile.get("id") == TEST_USER_1["id"], "Profile ID should match"
        assert "name" in profile, "Profile should have name"
        
        print(f"PASS: GET /api/user/profile returns profile for {profile.get('name')}")
    
    def test_user_profile_has_required_fields(self):
        """User profile should have required fields"""
        response = requests.get(f"{BASE_URL}/api/user/profile/{TEST_USER_1['id']}")
        assert response.status_code == 200
        
        profile = response.json()
        required_fields = ["id", "name"]
        for field in required_fields:
            assert field in profile, f"Profile missing field: {field}"
        
        print("PASS: User profile has required fields")


class TestLocationsAPI:
    """Test Locations endpoints for navigation"""
    
    def test_get_locations(self):
        """GET /api/locations should return locations list"""
        response = requests.get(f"{BASE_URL}/api/locations")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        locations = response.json()
        assert isinstance(locations, list), "Locations should be a list"
        assert len(locations) > 0, "Should have at least one location"
        
        print(f"PASS: GET /api/locations returns {len(locations)} locations")


class TestGalleryAPI:
    """Test Gallery/Photos endpoints"""
    
    def test_get_user_gallery_submissions(self):
        """GET /api/user/gallery/submissions/{userId} should return user's photos"""
        response = requests.get(f"{BASE_URL}/api/user/gallery/submissions/{TEST_USER_1['id']}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        submissions = response.json()
        assert isinstance(submissions, list), "Submissions should be a list"
        
        print(f"PASS: GET /api/user/gallery/submissions returns {len(submissions)} submissions")


class TestAdminEventsAPI:
    """Test Admin Events endpoints - toggle is_active functionality"""
    
    def test_admin_toggle_event_inactive(self):
        """PUT /api/admin/events/{id} with is_active=false should work"""
        # First get current state
        response = requests.get(f"{BASE_URL}/api/events")
        initial_count = len(response.json())
        
        # Set event to inactive
        response = requests.put(
            f"{BASE_URL}/api/admin/events/friday-night-live",
            json={"is_active": False},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("is_active") == False, "Event should be inactive"
        
        # Verify it's removed from public events
        public_response = requests.get(f"{BASE_URL}/api/events")
        public_events = public_response.json()
        friday_event = [e for e in public_events if e.get("id") == "friday-night-live"]
        assert len(friday_event) == 0, "Inactive event should not appear in public events"
        
        print(f"PASS: Event set to inactive and removed from public events ({len(public_events)} events)")
    
    def test_admin_toggle_event_active(self):
        """PUT /api/admin/events/{id} with is_active=true should add back to public"""
        # Set event back to active
        response = requests.put(
            f"{BASE_URL}/api/admin/events/friday-night-live",
            json={"is_active": True},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("is_active") == True, "Event should be active"
        
        # Verify it's back in public events
        public_response = requests.get(f"{BASE_URL}/api/events")
        public_events = public_response.json()
        friday_event = [e for e in public_events if e.get("id") == "friday-night-live"]
        assert len(friday_event) == 1, "Active event should appear in public events"
        
        print(f"PASS: Event set to active and added back to public events ({len(public_events)} events)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
