"""
Test CheckIn Page Flow - Backend API Tests
Tests the PUT /api/user/profile/{user_id} endpoint for role and staff_title updates
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://venue-social-wall.preview.emergentagent.com')

# Test user ID provided in the review request
TEST_USER_ID = "ec0e3093-fe70-4103-bfff-04975859c474"


class TestUserProfileRoleUpdate:
    """Tests for PUT /api/user/profile/{user_id} endpoint - role and staff_title updates"""
    
    def test_api_health_check(self):
        """Test that API is running"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API health check passed: {data['message']}")
    
    def test_get_user_profile(self):
        """Test GET /api/user/profile/{user_id} returns user profile"""
        response = requests.get(f"{BASE_URL}/api/user/profile/{TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["id"] == TEST_USER_ID
        print(f"✓ GET user profile passed: {data.get('name', 'Unknown')}")
        return data
    
    def test_update_role_to_staff_bartender(self):
        """Test PUT /api/user/profile/{user_id} updates role to staff and staff_title to bartender"""
        payload = {
            "role": "staff",
            "staff_title": "bartender"
        }
        response = requests.put(
            f"{BASE_URL}/api/user/profile/{TEST_USER_ID}",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response contains updated fields
        assert data["role"] == "staff", f"Expected role='staff', got '{data.get('role')}'"
        assert data["staff_title"] == "bartender", f"Expected staff_title='bartender', got '{data.get('staff_title')}'"
        print(f"✓ Update role to staff/bartender passed")
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/user/profile/{TEST_USER_ID}")
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["role"] == "staff"
        assert get_data["staff_title"] == "bartender"
        print(f"✓ Verified persistence: role={get_data['role']}, staff_title={get_data['staff_title']}")
    
    def test_update_role_to_staff_server(self):
        """Test PUT /api/user/profile/{user_id} updates role to staff and staff_title to server"""
        payload = {
            "role": "staff",
            "staff_title": "server"
        }
        response = requests.put(
            f"{BASE_URL}/api/user/profile/{TEST_USER_ID}",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["role"] == "staff"
        assert data["staff_title"] == "server"
        print(f"✓ Update role to staff/server passed")
    
    def test_update_role_to_staff_manager(self):
        """Test PUT /api/user/profile/{user_id} updates role to staff and staff_title to manager"""
        payload = {
            "role": "staff",
            "staff_title": "manager"
        }
        response = requests.put(
            f"{BASE_URL}/api/user/profile/{TEST_USER_ID}",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["role"] == "staff"
        assert data["staff_title"] == "manager"
        print(f"✓ Update role to staff/manager passed")
    
    def test_update_role_to_staff_dj(self):
        """Test PUT /api/user/profile/{user_id} updates role to staff and staff_title to dj"""
        payload = {
            "role": "dj",
            "staff_title": "dj"
        }
        response = requests.put(
            f"{BASE_URL}/api/user/profile/{TEST_USER_ID}",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["role"] == "dj"
        assert data["staff_title"] == "dj"
        print(f"✓ Update role to dj passed")
    
    def test_update_role_to_customer(self):
        """Test PUT /api/user/profile/{user_id} updates role back to customer"""
        payload = {
            "role": "customer"
        }
        response = requests.put(
            f"{BASE_URL}/api/user/profile/{TEST_USER_ID}",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["role"] == "customer"
        print(f"✓ Update role to customer passed")
    
    def test_update_nonexistent_user_returns_404(self):
        """Test PUT /api/user/profile/{user_id} returns 404 for non-existent user"""
        payload = {
            "role": "staff",
            "staff_title": "bartender"
        }
        response = requests.put(
            f"{BASE_URL}/api/user/profile/nonexistent-user-id-12345",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 404
        print(f"✓ Non-existent user returns 404 as expected")
    
    def test_partial_update_only_role(self):
        """Test PUT /api/user/profile/{user_id} with only role field"""
        # First set both fields
        requests.put(
            f"{BASE_URL}/api/user/profile/{TEST_USER_ID}",
            json={"role": "staff", "staff_title": "bartender"},
            headers={"Content-Type": "application/json"}
        )
        
        # Now update only role
        payload = {"role": "customer"}
        response = requests.put(
            f"{BASE_URL}/api/user/profile/{TEST_USER_ID}",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["role"] == "customer"
        # staff_title should remain from previous update (bartender)
        assert data["staff_title"] == "bartender"
        print(f"✓ Partial update (only role) passed")
    
    def test_partial_update_only_staff_title(self):
        """Test PUT /api/user/profile/{user_id} with only staff_title field"""
        # First set role to staff
        requests.put(
            f"{BASE_URL}/api/user/profile/{TEST_USER_ID}",
            json={"role": "staff"},
            headers={"Content-Type": "application/json"}
        )
        
        # Now update only staff_title
        payload = {"staff_title": "server"}
        response = requests.put(
            f"{BASE_URL}/api/user/profile/{TEST_USER_ID}",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["staff_title"] == "server"
        print(f"✓ Partial update (only staff_title) passed")


class TestCreateUserProfile:
    """Tests for POST /api/user/profile endpoint - creating new users"""
    
    def test_create_user_profile(self):
        """Test POST /api/user/profile creates a new user"""
        import uuid
        test_name = f"TEST_CheckIn_{uuid.uuid4().hex[:8]}"
        
        payload = {
            "name": test_name,
            "phone": "555-TEST-001",
            "email": f"{test_name.lower()}@test.com"
        }
        response = requests.post(
            f"{BASE_URL}/api/user/profile",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["name"] == test_name
        print(f"✓ Create user profile passed: {data['id']}")
        
        # Cleanup - we can't delete but we can verify it exists
        get_response = requests.get(f"{BASE_URL}/api/user/profile/{data['id']}")
        assert get_response.status_code == 200
        print(f"✓ Verified new user exists")
        
        return data["id"]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
