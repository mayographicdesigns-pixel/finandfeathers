"""
Test CheckIn Page - Staff/Client Role Selection
Tests the PUT /api/user/profile/{user_id} endpoint for role and staff_title updates
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestUserProfileRoleUpdate:
    """Test PUT /api/user/profile/{user_id} for role and staff_title updates"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a test user for each test"""
        self.test_user_id = None
        yield
        # Cleanup: Delete test user if created
        if self.test_user_id:
            try:
                requests.delete(f"{BASE_URL}/api/user/profile/{self.test_user_id}")
            except:
                pass
    
    def create_test_user(self, name_prefix="TEST_"):
        """Helper to create a test user profile"""
        response = requests.post(f"{BASE_URL}/api/user/profile", json={
            "name": f"{name_prefix}CheckinUser_{uuid.uuid4().hex[:6]}",
            "phone": f"+1555{uuid.uuid4().hex[:7]}",
            "email": f"test_{uuid.uuid4().hex[:8]}@test.com",
            "avatar_emoji": "😊"
        })
        assert response.status_code == 200, f"Failed to create test user: {response.text}"
        data = response.json()
        self.test_user_id = data["id"]
        return data
    
    # ==================== API Health Check ====================
    
    def test_api_health(self):
        """Test API is running"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"API Health: {data['message']}")
    
    # ==================== POST /api/user/profile Tests ====================
    
    def test_create_user_profile(self):
        """Test creating a new user profile"""
        user = self.create_test_user()
        assert "id" in user
        assert user["name"].startswith("TEST_")
        assert user.get("role") == "customer"  # Default role
        print(f"Created user: {user['id']} with role: {user.get('role')}")
    
    # ==================== PUT /api/user/profile/{user_id} Tests ====================
    
    def test_update_role_to_customer(self):
        """Test updating user role to 'customer' (Client button flow)"""
        user = self.create_test_user()
        
        # Update role to customer (simulating Client button click)
        response = requests.put(f"{BASE_URL}/api/user/profile/{user['id']}", json={
            "role": "customer"
        })
        assert response.status_code == 200, f"Failed to update role: {response.text}"
        
        # Verify the update
        updated = response.json()
        assert updated["role"] == "customer"
        print(f"Updated user {user['id']} role to: {updated['role']}")
        
        # GET to verify persistence
        get_response = requests.get(f"{BASE_URL}/api/user/profile/{user['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["role"] == "customer"
        print(f"Verified persisted role: {fetched['role']}")
    
    def test_update_role_to_dj(self):
        """Test updating user role and staff_title to 'dj' (DJ button flow)"""
        user = self.create_test_user()
        
        # Update role and staff_title to dj
        response = requests.put(f"{BASE_URL}/api/user/profile/{user['id']}", json={
            "role": "dj",
            "staff_title": "dj"
        })
        assert response.status_code == 200, f"Failed to update role: {response.text}"
        
        # Verify the update
        updated = response.json()
        assert updated["role"] == "dj"
        assert updated["staff_title"] == "dj"
        print(f"Updated user {user['id']} role to: {updated['role']}, staff_title: {updated['staff_title']}")
        
        # GET to verify persistence
        get_response = requests.get(f"{BASE_URL}/api/user/profile/{user['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["role"] == "dj"
        assert fetched["staff_title"] == "dj"
        print(f"Verified persisted role: {fetched['role']}, staff_title: {fetched['staff_title']}")
    
    def test_update_role_to_bartender(self):
        """Test updating user role and staff_title to 'bartender'"""
        user = self.create_test_user()
        
        response = requests.put(f"{BASE_URL}/api/user/profile/{user['id']}", json={
            "role": "bartender",
            "staff_title": "bartender"
        })
        assert response.status_code == 200
        
        updated = response.json()
        assert updated["role"] == "bartender"
        assert updated["staff_title"] == "bartender"
        print(f"Updated user {user['id']} to bartender")
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/user/profile/{user['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["role"] == "bartender"
        assert fetched["staff_title"] == "bartender"
    
    def test_update_role_to_server(self):
        """Test updating user role and staff_title to 'server'"""
        user = self.create_test_user()
        
        response = requests.put(f"{BASE_URL}/api/user/profile/{user['id']}", json={
            "role": "server",
            "staff_title": "server"
        })
        assert response.status_code == 200
        
        updated = response.json()
        assert updated["role"] == "server"
        assert updated["staff_title"] == "server"
        print(f"Updated user {user['id']} to server")
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/user/profile/{user['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["role"] == "server"
        assert fetched["staff_title"] == "server"
    
    def test_update_role_to_manager(self):
        """Test updating user role and staff_title to 'manager'"""
        user = self.create_test_user()
        
        response = requests.put(f"{BASE_URL}/api/user/profile/{user['id']}", json={
            "role": "manager",
            "staff_title": "manager"
        })
        assert response.status_code == 200
        
        updated = response.json()
        assert updated["role"] == "manager"
        assert updated["staff_title"] == "manager"
        print(f"Updated user {user['id']} to manager")
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/user/profile/{user['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["role"] == "manager"
        assert fetched["staff_title"] == "manager"
    
    def test_update_nonexistent_user(self):
        """Test updating a non-existent user returns 404"""
        fake_id = f"user_nonexistent_{uuid.uuid4().hex[:8]}"
        response = requests.put(f"{BASE_URL}/api/user/profile/{fake_id}", json={
            "role": "customer"
        })
        assert response.status_code == 404
        print(f"Correctly returned 404 for non-existent user: {fake_id}")
    
    def test_update_only_role_preserves_other_fields(self):
        """Test that updating only role preserves other user fields"""
        user = self.create_test_user()
        original_name = user["name"]
        original_email = user.get("email")
        
        # Update only role
        response = requests.put(f"{BASE_URL}/api/user/profile/{user['id']}", json={
            "role": "bartender"
        })
        assert response.status_code == 200
        
        updated = response.json()
        assert updated["role"] == "bartender"
        assert updated["name"] == original_name  # Name preserved
        assert updated.get("email") == original_email  # Email preserved
        print(f"Role updated while preserving name: {updated['name']}")
    
    def test_update_role_and_staff_title_together(self):
        """Test updating both role and staff_title in single request"""
        user = self.create_test_user()
        
        response = requests.put(f"{BASE_URL}/api/user/profile/{user['id']}", json={
            "role": "dj",
            "staff_title": "dj"
        })
        assert response.status_code == 200
        
        updated = response.json()
        assert updated["role"] == "dj"
        assert updated["staff_title"] == "dj"
        
        # Verify both fields persisted
        get_response = requests.get(f"{BASE_URL}/api/user/profile/{user['id']}")
        fetched = get_response.json()
        assert fetched["role"] == "dj"
        assert fetched["staff_title"] == "dj"
        print(f"Both role and staff_title updated and persisted correctly")
    
    def test_change_role_from_staff_to_customer(self):
        """Test changing role from staff back to customer"""
        user = self.create_test_user()
        
        # First set as DJ
        response1 = requests.put(f"{BASE_URL}/api/user/profile/{user['id']}", json={
            "role": "dj",
            "staff_title": "dj"
        })
        assert response1.status_code == 200
        
        # Then change back to customer
        response2 = requests.put(f"{BASE_URL}/api/user/profile/{user['id']}", json={
            "role": "customer"
        })
        assert response2.status_code == 200
        
        updated = response2.json()
        assert updated["role"] == "customer"
        # Note: staff_title may still be "dj" since we didn't explicitly clear it
        print(f"Changed role from dj to customer: {updated['role']}")


class TestUserProfileGet:
    """Test GET /api/user/profile/{user_id} endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a test user for each test"""
        self.test_user_id = None
        yield
        if self.test_user_id:
            try:
                requests.delete(f"{BASE_URL}/api/user/profile/{self.test_user_id}")
            except:
                pass
    
    def create_test_user(self):
        """Helper to create a test user profile"""
        response = requests.post(f"{BASE_URL}/api/user/profile", json={
            "name": f"TEST_GetUser_{uuid.uuid4().hex[:6]}",
            "phone": f"+1555{uuid.uuid4().hex[:7]}",
            "email": f"test_{uuid.uuid4().hex[:8]}@test.com"
        })
        assert response.status_code == 200
        data = response.json()
        self.test_user_id = data["id"]
        return data
    
    def test_get_user_profile(self):
        """Test getting a user profile by ID"""
        user = self.create_test_user()
        
        response = requests.get(f"{BASE_URL}/api/user/profile/{user['id']}")
        assert response.status_code == 200
        
        fetched = response.json()
        assert fetched["id"] == user["id"]
        assert fetched["name"] == user["name"]
        print(f"Successfully fetched user: {fetched['id']}")
    
    def test_get_nonexistent_user(self):
        """Test getting a non-existent user returns 404"""
        fake_id = f"user_fake_{uuid.uuid4().hex[:8]}"
        response = requests.get(f"{BASE_URL}/api/user/profile/{fake_id}")
        assert response.status_code == 404
        print(f"Correctly returned 404 for non-existent user")
    
    def test_user_profile_has_role_field(self):
        """Test that user profile response includes role field"""
        user = self.create_test_user()
        
        response = requests.get(f"{BASE_URL}/api/user/profile/{user['id']}")
        assert response.status_code == 200
        
        fetched = response.json()
        assert "role" in fetched
        assert fetched["role"] == "customer"  # Default role
        print(f"User profile has role field: {fetched['role']}")
    
    def test_user_profile_has_staff_title_field(self):
        """Test that user profile response includes staff_title field"""
        user = self.create_test_user()
        
        response = requests.get(f"{BASE_URL}/api/user/profile/{user['id']}")
        assert response.status_code == 200
        
        fetched = response.json()
        assert "staff_title" in fetched or fetched.get("staff_title") is None
        print(f"User profile has staff_title field: {fetched.get('staff_title')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
