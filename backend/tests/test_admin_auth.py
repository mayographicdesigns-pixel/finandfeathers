"""
Backend Tests for Restaurant Admin Portal
Tests: Auth, Admin Dashboard, Loyalty Members, Contacts, Menu Items, Notifications
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dine-connect-51.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

# Test credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"


class TestHealthCheck:
    """API health check tests"""
    
    def test_api_root(self):
        """Test API is running"""
        response = requests.get(f"{API_URL}/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API Health check passed: {data['message']}")


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_login_success(self):
        """Test successful admin login with correct credentials"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0
        print(f"✓ Admin login successful, token received")
        return data["access_token"]
    
    def test_login_invalid_username(self):
        """Test login with invalid username"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "username": "wronguser",
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print(f"✓ Invalid username correctly rejected: {data['detail']}")
    
    def test_login_invalid_password(self):
        """Test login with invalid password"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print(f"✓ Invalid password correctly rejected: {data['detail']}")
    
    def test_auth_me_endpoint(self):
        """Test /auth/me endpoint with valid token"""
        # First login to get token
        login_response = requests.post(f"{API_URL}/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["access_token"]
        
        # Test /auth/me
        response = requests.get(f"{API_URL}/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == ADMIN_USERNAME
        assert data["is_admin"] == True
        print(f"✓ Auth me endpoint returned user: {data['username']}")
    
    def test_auth_me_without_token(self):
        """Test /auth/me endpoint without token"""
        response = requests.get(f"{API_URL}/auth/me")
        assert response.status_code in [401, 403]
        print(f"✓ Unauthorized access correctly rejected")
    
    def test_auth_me_invalid_token(self):
        """Test /auth/me endpoint with invalid token"""
        response = requests.get(f"{API_URL}/auth/me", headers={
            "Authorization": "Bearer invalid_token_here"
        })
        assert response.status_code == 401
        print(f"✓ Invalid token correctly rejected")


class TestAdminDashboard:
    """Admin dashboard stats tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get valid auth token"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_admin_stats(self, auth_token):
        """Test admin stats endpoint"""
        response = requests.get(f"{API_URL}/admin/stats", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify all required stats fields
        assert "loyalty_members" in data
        assert "total_contacts" in data
        assert "new_contacts" in data
        assert "menu_items" in data
        assert "notifications_sent" in data
        
        # Verify values are integers
        assert isinstance(data["loyalty_members"], int)
        assert isinstance(data["total_contacts"], int)
        print(f"✓ Admin stats: Members={data['loyalty_members']}, Contacts={data['total_contacts']}, Menu Items={data['menu_items']}")
    
    def test_admin_stats_without_auth(self):
        """Test stats endpoint requires auth"""
        response = requests.get(f"{API_URL}/admin/stats")
        assert response.status_code in [401, 403]
        print(f"✓ Stats endpoint correctly requires authentication")


class TestLoyaltyMembers:
    """Loyalty members CRUD tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get valid auth token"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_loyalty_signup_public(self):
        """Test public loyalty signup endpoint"""
        unique_email = f"TEST_loyalty_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{API_URL}/loyalty/signup", json={
            "name": "Test Loyalty User",
            "email": unique_email,
            "phone": "555-1234",
            "marketing_consent": True
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == unique_email
        assert data["name"] == "Test Loyalty User"
        assert "id" in data
        print(f"✓ Loyalty signup successful for {unique_email}")
        return data["id"]
    
    def test_loyalty_signup_duplicate_email(self):
        """Test loyalty signup with duplicate email"""
        unique_email = f"TEST_duplicate_{uuid.uuid4().hex[:8]}@test.com"
        
        # First signup
        requests.post(f"{API_URL}/loyalty/signup", json={
            "name": "First User",
            "email": unique_email,
            "marketing_consent": True
        })
        
        # Second signup with same email
        response = requests.post(f"{API_URL}/loyalty/signup", json={
            "name": "Second User",
            "email": unique_email,
            "marketing_consent": True
        })
        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data["detail"].lower()
        print(f"✓ Duplicate email correctly rejected")
    
    def test_get_loyalty_members(self, auth_token):
        """Test admin get all loyalty members"""
        response = requests.get(f"{API_URL}/admin/loyalty-members", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} loyalty members")
    
    def test_delete_loyalty_member(self, auth_token):
        """Test delete loyalty member"""
        # First create a member
        unique_email = f"TEST_delete_{uuid.uuid4().hex[:8]}@test.com"
        create_response = requests.post(f"{API_URL}/loyalty/signup", json={
            "name": "To Be Deleted",
            "email": unique_email,
            "marketing_consent": True
        })
        member_id = create_response.json()["id"]
        
        # Delete the member
        response = requests.delete(f"{API_URL}/admin/loyalty-members/{member_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        print(f"✓ Loyalty member deleted successfully")


class TestContacts:
    """Contact form tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get valid auth token"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_submit_contact_form(self):
        """Test public contact form submission"""
        unique_email = f"TEST_contact_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{API_URL}/contact", json={
            "name": "Test Contact",
            "email": unique_email,
            "phone": "555-9876",
            "message": "This is a test contact message"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == unique_email
        assert data["status"] == "new"
        assert "id" in data
        print(f"✓ Contact form submitted successfully")
        return data["id"]
    
    def test_get_contacts_admin(self, auth_token):
        """Test admin get all contacts"""
        response = requests.get(f"{API_URL}/admin/contacts", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} contacts")
    
    def test_update_contact_status(self, auth_token):
        """Test update contact status"""
        # First create a contact
        unique_email = f"TEST_status_{uuid.uuid4().hex[:8]}@test.com"
        create_response = requests.post(f"{API_URL}/contact", json={
            "name": "Status Test",
            "email": unique_email,
            "message": "Test message for status update"
        })
        contact_id = create_response.json()["id"]
        
        # Update status
        response = requests.patch(f"{API_URL}/admin/contacts/{contact_id}", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"status": "reviewed"}
        )
        assert response.status_code == 200
        print(f"✓ Contact status updated to reviewed")


class TestMenuItems:
    """Menu items CRUD tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get valid auth token"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_menu_items(self, auth_token):
        """Test get all menu items"""
        response = requests.get(f"{API_URL}/admin/menu-items", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} menu items")
    
    def test_create_menu_item(self, auth_token):
        """Test create new menu item"""
        response = requests.post(f"{API_URL}/admin/menu-items", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": f"TEST_Item_{uuid.uuid4().hex[:6]}",
                "description": "Test menu item description",
                "price": 12.99,
                "category": "starters",
                "image": "https://example.com/image.jpg",
                "badges": ["New", "Spicy"]
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["price"] == 12.99
        print(f"✓ Menu item created with id: {data['id']}")
        return data["id"]
    
    def test_update_menu_item(self, auth_token):
        """Test update menu item"""
        # First create an item
        create_response = requests.post(f"{API_URL}/admin/menu-items", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": f"TEST_Update_{uuid.uuid4().hex[:6]}",
                "description": "Original description",
                "price": 10.00,
                "category": "entrees",
                "image": "https://example.com/original.jpg"
            }
        )
        item_id = create_response.json()["id"]
        
        # Update the item
        response = requests.put(f"{API_URL}/admin/menu-items/{item_id}", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "Updated Menu Item",
                "price": 15.99
            }
        )
        assert response.status_code == 200
        print(f"✓ Menu item updated successfully")
    
    def test_delete_menu_item(self, auth_token):
        """Test delete menu item"""
        # First create an item
        create_response = requests.post(f"{API_URL}/admin/menu-items", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": f"TEST_Delete_{uuid.uuid4().hex[:6]}",
                "description": "To be deleted",
                "price": 5.00,
                "category": "desserts",
                "image": "https://example.com/delete.jpg"
            }
        )
        item_id = create_response.json()["id"]
        
        # Delete the item
        response = requests.delete(f"{API_URL}/admin/menu-items/{item_id}", 
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        # Verify deletion - item should not be in list
        list_response = requests.get(f"{API_URL}/admin/menu-items", 
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        items = list_response.json()
        item_ids = [item["id"] for item in items]
        assert item_id not in item_ids
        print(f"✓ Menu item deleted and verified not in list")


class TestNotifications:
    """Push notifications tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get valid auth token"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_send_notification(self, auth_token):
        """Test send push notification"""
        response = requests.post(f"{API_URL}/admin/notifications/send", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "Test Notification",
                "body": "This is a test push notification",
                "url": "/menu",
                "send_to_all": True
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "result" in data
        print(f"✓ Notification sent: {data['message']}")
    
    def test_get_notification_history(self, auth_token):
        """Test get notification history"""
        response = requests.get(f"{API_URL}/admin/notifications/history", 
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} notification history items")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
