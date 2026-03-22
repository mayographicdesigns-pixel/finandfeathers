"""
Regression tests for refactored routers after server.py split.
Tests auth.py, events.py, payments.py endpoints plus existing endpoints.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://staff-client-roles.preview.emergentagent.com').rstrip('/')


class TestHealthAndBasics:
    """Basic health checks to ensure API is running"""
    
    def test_api_health(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API health check passed: {data['message']}")


class TestAuthRouter:
    """Tests for routes/auth.py endpoints"""
    
    def test_admin_login_success(self):
        """Test POST /api/auth/login with valid admin credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "$outhcentral"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        print(f"✓ Admin login successful, token received")
        return data["access_token"]
    
    def test_admin_login_invalid_credentials(self):
        """Test POST /api/auth/login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print(f"✓ Invalid credentials correctly rejected")
    
    def test_get_current_admin(self):
        """Test GET /api/auth/me with valid token"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "$outhcentral"
        })
        token = login_response.json()["access_token"]
        
        # Get current admin info
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "username" in data
        assert data["is_admin"] == True
        print(f"✓ Get current admin info: username={data['username']}")
    
    def test_quick_user_registration(self):
        """Test POST /api/user/register (quick registration)"""
        test_name = f"TEST_User_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/user/register", json={
            "name": test_name,
            "phone": "555-0100",
            "email": f"{test_name.lower()}@test.com",
            "role": "customer"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["role"] == "customer"
        print(f"✓ Quick user registration successful: id={data['id']}")
        return data["id"]
    
    def test_full_user_registration(self):
        """Test POST /api/auth/user/register (full registration with password)"""
        test_username = f"test_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/auth/user/register", json={
            "username": test_username,
            "email": f"{test_username}@test.com",
            "password": "testpass123",
            "name": f"TEST_{test_username}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "user" in data
        assert data["user"]["username"] == test_username
        print(f"✓ Full user registration successful: username={test_username}")
        return test_username
    
    def test_user_login_with_password(self):
        """Test POST /api/auth/user/login"""
        # First register a user
        test_username = f"test_{uuid.uuid4().hex[:8]}"
        requests.post(f"{BASE_URL}/api/auth/user/register", json={
            "username": test_username,
            "email": f"{test_username}@test.com",
            "password": "testpass123",
            "name": f"TEST_{test_username}"
        })
        
        # Now login
        response = requests.post(f"{BASE_URL}/api/auth/user/login", json={
            "identifier": test_username,
            "password": "testpass123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "user" in data
        print(f"✓ User login successful: {test_username}")
    
    def test_forgot_password(self):
        """Test POST /api/auth/user/forgot-password"""
        response = requests.post(f"{BASE_URL}/api/auth/user/forgot-password", json={
            "identifier": "nonexistent@test.com"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        # Should return success even for non-existent users (security)
        print(f"✓ Forgot password endpoint working")
    
    def test_verify_reset_token_invalid(self):
        """Test GET /api/auth/user/verify-reset-token with invalid token"""
        response = requests.get(f"{BASE_URL}/api/auth/user/verify-reset-token?token=invalid_token")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
        print(f"✓ Invalid reset token correctly rejected")


class TestEventsRouter:
    """Tests for routes/events.py endpoints"""
    
    def test_get_public_events(self):
        """Test GET /api/events (public events list)"""
        response = requests.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Public events list: {len(data)} events")
    
    def test_get_event_packages(self):
        """Test GET /api/events/packages"""
        response = requests.get(f"{BASE_URL}/api/events/packages")
        assert response.status_code == 200
        data = response.json()
        assert "general" in data
        assert "vip" in data
        assert "table" in data
        print(f"✓ Event packages: {list(data.keys())}")
    
    def test_admin_get_events(self):
        """Test GET /api/admin/events (admin events list)"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "$outhcentral"
        })
        token = login_response.json()["access_token"]
        
        response = requests.get(f"{BASE_URL}/api/admin/events", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin events list: {len(data)} events")
    
    def test_admin_create_event(self):
        """Test POST /api/admin/events (create event)"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "$outhcentral"
        })
        token = login_response.json()["access_token"]
        
        test_event = {
            "name": f"TEST_Event_{uuid.uuid4().hex[:8]}",
            "description": "Test event description",
            "date": "2026-03-25",
            "time": "8PM - 11PM",
            "location": "Test Location",
            "image": "https://example.com/test-image.jpg",
            "featured": False,
            "packages": ["general"],
            "package_prices": {"general": 25.00}
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/events", 
            json=test_event,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == test_event["name"]
        print(f"✓ Event created: {data['name']}")
        return data["id"]
    
    def test_admin_update_event(self):
        """Test PUT /api/admin/events/{event_id}"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "$outhcentral"
        })
        token = login_response.json()["access_token"]
        
        # Create event first
        test_event = {
            "name": f"TEST_Event_{uuid.uuid4().hex[:8]}",
            "description": "Test event",
            "date": "2026-03-25",
            "time": "8PM",
            "location": "Test",
            "image": "https://example.com/test-image.jpg",
            "featured": False,
            "packages": ["general"],
            "package_prices": {"general": 25.00}
        }
        create_response = requests.post(f"{BASE_URL}/api/admin/events", 
            json=test_event,
            headers={"Authorization": f"Bearer {token}"}
        )
        event_id = create_response.json()["id"]
        
        # Update event
        response = requests.put(f"{BASE_URL}/api/admin/events/{event_id}",
            json={"description": "Updated description"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "Updated description"
        print(f"✓ Event updated: {event_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/events/{event_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
    
    def test_admin_delete_event(self):
        """Test DELETE /api/admin/events/{event_id}"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "$outhcentral"
        })
        token = login_response.json()["access_token"]
        
        # Create event first
        test_event = {
            "name": f"TEST_Event_{uuid.uuid4().hex[:8]}",
            "description": "Test event to delete",
            "date": "2026-03-25",
            "time": "8PM",
            "location": "Test",
            "image": "https://example.com/test-image.jpg",
            "featured": False,
            "packages": ["general"],
            "package_prices": {"general": 25.00}
        }
        create_response = requests.post(f"{BASE_URL}/api/admin/events", 
            json=test_event,
            headers={"Authorization": f"Bearer {token}"}
        )
        event_id = create_response.json()["id"]
        
        # Delete event
        response = requests.delete(f"{BASE_URL}/api/admin/events/{event_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ Event deleted: {event_id}")


class TestPaymentsRouter:
    """Tests for routes/payments.py endpoints"""
    
    def test_get_payment_methods(self):
        """Test GET /api/payment/methods"""
        response = requests.get(f"{BASE_URL}/api/payment/methods")
        assert response.status_code == 200
        data = response.json()
        assert "methods" in data
        assert len(data["methods"]) >= 2
        method_ids = [m["id"] for m in data["methods"]]
        assert "stripe" in method_ids
        print(f"✓ Payment methods: {method_ids}")
    
    def test_checkout_status_not_found(self):
        """Test GET /api/stripe/checkout/status/{session_id} with invalid session"""
        response = requests.get(f"{BASE_URL}/api/stripe/checkout/status/invalid_session_id")
        assert response.status_code == 404
        print(f"✓ Invalid checkout session correctly returns 404")


class TestExistingEndpoints:
    """Tests for endpoints still in server.py to ensure they work"""
    
    def test_get_locations(self):
        """Test GET /api/locations"""
        response = requests.get(f"{BASE_URL}/api/locations")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Locations list: {len(data)} locations")
    
    def test_get_token_packages(self):
        """Test GET /api/tokens/packages"""
        response = requests.get(f"{BASE_URL}/api/tokens/packages")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print(f"✓ Token packages: {list(data.keys())}")
    
    def test_get_menu_items(self):
        """Test GET /api/menu/items"""
        response = requests.get(f"{BASE_URL}/api/menu/items")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Menu items: {len(data)} items")
    
    def test_get_homepage_content(self):
        """Test GET /api/homepage/content"""
        response = requests.get(f"{BASE_URL}/api/homepage/content")
        assert response.status_code == 200
        data = response.json()
        assert "tagline" in data or "logo_url" in data
        print(f"✓ Homepage content retrieved")
    
    def test_get_specials(self):
        """Test GET /api/specials"""
        response = requests.get(f"{BASE_URL}/api/specials")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Specials: {len(data)} active specials")
    
    def test_get_gallery(self):
        """Test GET /api/gallery"""
        response = requests.get(f"{BASE_URL}/api/gallery")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Gallery: {len(data)} items")
    
    def test_get_social_links(self):
        """Test GET /api/social-links"""
        response = requests.get(f"{BASE_URL}/api/social-links")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Social links: {len(data)} links")


class TestWallRouter:
    """Tests for routes/wall.py endpoints"""
    
    def test_get_wall_posts(self):
        """Test GET /api/wall/posts/{location_slug}"""
        response = requests.get(f"{BASE_URL}/api/wall/posts/edgewood-atlanta")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Wall posts for edgewood-atlanta: {len(data)} posts")


class TestDJRouter:
    """Tests for routes/dj.py endpoints"""
    
    def test_get_dj_at_location(self):
        """Test GET /api/dj/at-location/{slug}"""
        response = requests.get(f"{BASE_URL}/api/dj/at-location/edgewood-atlanta")
        assert response.status_code == 200
        data = response.json()
        # May or may not have a DJ checked in
        print(f"✓ DJ at location check: checked_in={data.get('checked_in', False)}")
    
    def test_get_karaoke_status(self):
        """Test GET /api/karaoke/status/{location_slug}"""
        response = requests.get(f"{BASE_URL}/api/karaoke/status/edgewood-atlanta")
        assert response.status_code == 200
        data = response.json()
        assert "active" in data
        print(f"✓ Karaoke status: active={data['active']}")


class TestAdminEndpoints:
    """Tests for admin endpoints to ensure they still work"""
    
    def test_admin_stats(self):
        """Test GET /api/admin/stats"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "$outhcentral"
        })
        token = login_response.json()["access_token"]
        
        response = requests.get(f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "loyalty_members" in data
        assert "menu_items" in data
        print(f"✓ Admin stats: {data}")
    
    def test_admin_get_menu_items(self):
        """Test GET /api/admin/menu-items"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "$outhcentral"
        })
        token = login_response.json()["access_token"]
        
        response = requests.get(f"{BASE_URL}/api/admin/menu-items",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin menu items: {len(data)} items")
    
    def test_admin_get_specials(self):
        """Test GET /api/admin/specials"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "$outhcentral"
        })
        token = login_response.json()["access_token"]
        
        response = requests.get(f"{BASE_URL}/api/admin/specials",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin specials: {len(data)} specials")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
