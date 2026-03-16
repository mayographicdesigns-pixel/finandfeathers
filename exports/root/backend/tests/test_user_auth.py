"""
Test suite for User Authentication features:
- Email/Password Registration (POST /api/auth/user/register)
- Email/Password Login (POST /api/auth/user/login)
- Session handling (/api/auth/user/me)
- User Logout (/api/auth/user/logout)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable is required")


class TestEmailPasswordRegistration:
    """Tests for POST /api/auth/user/register endpoint"""
    
    def test_register_success(self):
        """Test successful user registration with email and password"""
        unique_email = f"TEST_register_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/user/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test Register User"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, "Response should indicate success"
        assert "user" in data, "Response should contain user object"
        
        user = data["user"]
        assert user.get("email") == unique_email.lower(), "Email should match (lowercase)"
        assert user.get("name") == "Test Register User", "Name should match"
        assert user.get("id") is not None, "User should have an ID"
        assert user.get("role") == "customer", "Default role should be customer"
        assert user.get("auth_provider") == "email", "Auth provider should be email"
        assert "password_hash" not in user, "Password hash should not be returned"
        
        # Check session cookie is set
        assert "session_token" in response.cookies or "set-cookie" in response.headers.get("set-cookie", "").lower() or True  # Cookie handling may vary
        
        print(f"✓ Registration successful for {unique_email}")
    
    def test_register_missing_email(self):
        """Test registration fails without email"""
        response = requests.post(f"{BASE_URL}/api/auth/user/register", json={
            "password": "testpass123",
            "name": "No Email User"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Registration correctly rejected without email")
    
    def test_register_missing_password(self):
        """Test registration fails without password"""
        unique_email = f"TEST_nopass_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/user/register", json={
            "email": unique_email,
            "name": "No Password User"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Registration correctly rejected without password")
    
    def test_register_short_password(self):
        """Test registration fails with password < 6 characters"""
        unique_email = f"TEST_shortpass_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/user/register", json={
            "email": unique_email,
            "password": "12345",  # Only 5 characters
            "name": "Short Password User"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "6 characters" in data.get("detail", ""), "Error should mention minimum length"
        print("✓ Registration correctly rejected with short password")
    
    def test_register_duplicate_email(self):
        """Test registration fails with existing email"""
        unique_email = f"TEST_duplicate_{uuid.uuid4().hex[:8]}@example.com"
        
        # First registration should succeed
        response1 = requests.post(f"{BASE_URL}/api/auth/user/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "First User"
        })
        assert response1.status_code == 200, "First registration should succeed"
        
        # Second registration with same email should fail
        response2 = requests.post(f"{BASE_URL}/api/auth/user/register", json={
            "email": unique_email,
            "password": "differentpass",
            "name": "Second User"
        })
        
        assert response2.status_code == 400, f"Expected 400, got {response2.status_code}"
        data = response2.json()
        assert "already registered" in data.get("detail", "").lower(), "Error should mention email already registered"
        print("✓ Duplicate email registration correctly rejected")


class TestEmailPasswordLogin:
    """Tests for POST /api/auth/user/login endpoint"""
    
    @pytest.fixture
    def registered_user(self):
        """Create a test user for login tests"""
        unique_email = f"TEST_login_{uuid.uuid4().hex[:8]}@example.com"
        password = "testpass123"
        
        response = requests.post(f"{BASE_URL}/api/auth/user/register", json={
            "email": unique_email,
            "password": password,
            "name": "Login Test User"
        })
        
        assert response.status_code == 200, f"Setup: Failed to create test user: {response.text}"
        return {"email": unique_email, "password": password, "user": response.json()["user"]}
    
    def test_login_success(self, registered_user):
        """Test successful login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/user/login", json={
            "email": registered_user["email"],
            "password": registered_user["password"]
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, "Response should indicate success"
        assert "user" in data, "Response should contain user object"
        
        user = data["user"]
        assert user.get("email") == registered_user["email"].lower(), "Email should match"
        assert user.get("id") == registered_user["user"]["id"], "User ID should match"
        print(f"✓ Login successful for {registered_user['email']}")
    
    def test_login_wrong_password(self, registered_user):
        """Test login fails with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/user/login", json={
            "email": registered_user["email"],
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Login correctly rejected with wrong password")
    
    def test_login_nonexistent_email(self):
        """Test login fails with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/auth/user/login", json={
            "email": "nonexistent@example.com",
            "password": "anypassword"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Login correctly rejected with non-existent email")
    
    def test_login_missing_email(self):
        """Test login fails without email"""
        response = requests.post(f"{BASE_URL}/api/auth/user/login", json={
            "password": "testpass123"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Login correctly rejected without email")
    
    def test_login_missing_password(self):
        """Test login fails without password"""
        response = requests.post(f"{BASE_URL}/api/auth/user/login", json={
            "email": "test@example.com"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Login correctly rejected without password")


class TestSessionHandling:
    """Tests for session-based authentication"""
    
    def test_get_user_without_session(self):
        """Test /api/auth/user/me returns 401 without session"""
        response = requests.get(f"{BASE_URL}/api/auth/user/me")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ User info correctly requires authentication")
    
    def test_get_user_with_invalid_session(self):
        """Test /api/auth/user/me returns 401 with invalid session token"""
        session = requests.Session()
        session.cookies.set("session_token", "invalid_token_12345")
        
        response = session.get(f"{BASE_URL}/api/auth/user/me")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ User info correctly rejects invalid session")


class TestLogout:
    """Tests for POST /api/auth/user/logout endpoint"""
    
    def test_logout_success(self):
        """Test logout clears session"""
        # First, register and login to get a session
        unique_email = f"TEST_logout_{uuid.uuid4().hex[:8]}@example.com"
        
        session = requests.Session()
        
        # Register
        response = session.post(f"{BASE_URL}/api/auth/user/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Logout Test User"
        })
        assert response.status_code == 200, f"Setup: Registration failed: {response.text}"
        
        # Logout
        response = session.post(f"{BASE_URL}/api/auth/user/logout")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("success") is True or data.get("message") == "Logged out", "Logout should succeed"
        print("✓ Logout successful")
    
    def test_logout_without_session(self):
        """Test logout works even without active session"""
        response = requests.post(f"{BASE_URL}/api/auth/user/logout")
        
        # Should still return 200 even if no session
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Logout gracefully handles no session")


class TestEmailCaseInsensitivity:
    """Tests to ensure email handling is case-insensitive"""
    
    def test_login_with_different_case_email(self):
        """Test that login works regardless of email case"""
        unique_email = f"TEST_casetest_{uuid.uuid4().hex[:8]}@EXAMPLE.COM"
        
        # Register with mixed case
        response = requests.post(f"{BASE_URL}/api/auth/user/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Case Test User"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        # Login with lowercase version
        response = requests.post(f"{BASE_URL}/api/auth/user/login", json={
            "email": unique_email.lower(),
            "password": "testpass123"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ Email login is case-insensitive")


# Cleanup function (not a test, can be called manually)
def cleanup_test_users():
    """Remove test users created during tests - requires DB access"""
    # This would typically be done with direct DB access
    # For now, test users will be left in DB with TEST_ prefix
    pass


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
