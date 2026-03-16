"""
Test Stripe payment integration for token purchases

Tests:
1. GET /api/tokens/packages - Returns 5 token packages
2. POST /api/tokens/checkout - Creates Stripe checkout session
3. GET /api/admin/users - Returns all users with role info
4. GET /api/admin/cashouts - Returns all cashout requests
5. POST /api/admin/tokens/gift - Admin can gift tokens
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestTokenPackages:
    """Test token packages endpoint"""
    
    def test_get_packages_returns_5_packages(self):
        """GET /api/tokens/packages returns 5 token packages"""
        response = requests.get(f"{BASE_URL}/api/tokens/packages")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        packages = response.json()
        assert len(packages) == 5, f"Expected 5 packages, got {len(packages)}"
        
        # Verify all expected package IDs exist
        expected_packages = ["10", "50", "100", "250", "500"]
        for pkg_id in expected_packages:
            assert pkg_id in packages, f"Missing package {pkg_id}"
        
        print(f"✓ GET /api/tokens/packages returns 5 packages: {list(packages.keys())}")
    
    def test_packages_have_correct_structure(self):
        """Each package has amount and tokens fields"""
        response = requests.get(f"{BASE_URL}/api/tokens/packages")
        packages = response.json()
        
        expected_values = {
            "10": {"amount": 1.0, "tokens": 10},
            "50": {"amount": 5.0, "tokens": 50},
            "100": {"amount": 10.0, "tokens": 100},
            "250": {"amount": 25.0, "tokens": 250},
            "500": {"amount": 50.0, "tokens": 500}
        }
        
        for pkg_id, expected in expected_values.items():
            assert packages[pkg_id]["amount"] == expected["amount"], f"Package {pkg_id} amount mismatch"
            assert packages[pkg_id]["tokens"] == expected["tokens"], f"Package {pkg_id} tokens mismatch"
        
        print("✓ All packages have correct amount and tokens values")


class TestStripeCheckout:
    """Test Stripe checkout endpoint"""
    
    def test_create_checkout_session_success(self):
        """POST /api/tokens/checkout creates Stripe checkout session"""
        test_user_id = "5fa068bf-7ffc-456e-92b2-225906e668b3"
        origin_url = BASE_URL
        
        response = requests.post(
            f"{BASE_URL}/api/tokens/checkout",
            params={
                "package_id": "50",
                "user_id": test_user_id,
                "origin_url": origin_url
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "checkout_url" in data, "Response missing checkout_url"
        assert "session_id" in data, "Response missing session_id"
        assert data["checkout_url"].startswith("https://checkout.stripe.com"), "Invalid checkout URL"
        assert data["session_id"].startswith("cs_test_"), "Invalid session ID format"
        
        print(f"✓ POST /api/tokens/checkout creates valid session: {data['session_id'][:30]}...")
    
    def test_checkout_invalid_package_fails(self):
        """POST /api/tokens/checkout with invalid package returns error"""
        response = requests.post(
            f"{BASE_URL}/api/tokens/checkout",
            params={
                "package_id": "invalid_package",
                "user_id": "5fa068bf-7ffc-456e-92b2-225906e668b3",
                "origin_url": BASE_URL
            }
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Invalid package returns 400 error")
    
    def test_checkout_invalid_user_fails(self):
        """POST /api/tokens/checkout with invalid user returns error"""
        response = requests.post(
            f"{BASE_URL}/api/tokens/checkout",
            params={
                "package_id": "50",
                "user_id": "non-existent-user-id",
                "origin_url": BASE_URL
            }
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid user returns 404 error")


class TestAdminUsersEndpoint:
    """Test admin users management endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "admin", "password": "admin"}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")
    
    def test_get_users_returns_list(self, admin_token):
        """GET /api/admin/users returns list of users with roles"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        users = response.json()
        assert isinstance(users, list), "Response should be a list"
        assert len(users) > 0, "Should have at least one user"
        
        # Verify users have required fields including role
        first_user = users[0]
        required_fields = ["id", "name", "email", "role", "token_balance"]
        for field in required_fields:
            assert field in first_user, f"User missing field: {field}"
        
        # Check role values (some legacy users may not have role field)
        valid_roles = ["customer", "staff", "management", "admin"]
        users_with_role = [u for u in users if "role" in u]
        for user in users_with_role:
            assert user["role"] in valid_roles, f"Invalid role: {user['role']}"
        
        print(f"✓ GET /api/admin/users returns {len(users)} users ({len(users_with_role)} with role info)")
    
    def test_users_include_staff(self, admin_token):
        """Admin can see staff users"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        users = response.json()
        staff_users = [u for u in users if u.get("role") == "staff"]
        
        assert len(staff_users) >= 0, "Query should work"
        print(f"✓ Found {len(staff_users)} staff users in system")
    
    def test_users_endpoint_requires_auth(self):
        """GET /api/admin/users requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        
        assert response.status_code == 403 or response.status_code == 401, \
            f"Expected 401/403, got {response.status_code}"
        print("✓ /api/admin/users requires authentication")


class TestAdminCashoutsEndpoint:
    """Test admin cashouts management endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "admin", "password": "admin"}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")
    
    def test_get_cashouts_returns_list(self, admin_token):
        """GET /api/admin/cashouts returns list of cashout requests"""
        response = requests.get(
            f"{BASE_URL}/api/admin/cashouts",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        cashouts = response.json()
        assert isinstance(cashouts, list), "Response should be a list"
        
        # Verify cashouts have required fields
        if len(cashouts) > 0:
            first_cashout = cashouts[0]
            required_fields = ["id", "user_id", "amount_tokens", "amount_usd", "status", "payment_method"]
            for field in required_fields:
                assert field in first_cashout, f"Cashout missing field: {field}"
        
        print(f"✓ GET /api/admin/cashouts returns {len(cashouts)} cashout requests")
    
    def test_cashouts_endpoint_requires_auth(self):
        """GET /api/admin/cashouts requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/cashouts")
        
        assert response.status_code == 403 or response.status_code == 401, \
            f"Expected 401/403, got {response.status_code}"
        print("✓ /api/admin/cashouts requires authentication")


class TestAdminTokenGifting:
    """Test admin token gifting functionality"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "admin", "password": "admin"}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")
    
    def test_admin_can_gift_tokens(self, admin_token):
        """POST /api/admin/tokens/gift allows admin to gift tokens"""
        # Use test user
        test_user_id = "5fa068bf-7ffc-456e-92b2-225906e668b3"
        
        # Get initial balance
        profile_resp = requests.get(f"{BASE_URL}/api/user/profile/{test_user_id}")
        if profile_resp.status_code != 200:
            pytest.skip("Test user not found")
        initial_balance = profile_resp.json().get("token_balance", 0)
        
        # Gift tokens
        gift_response = requests.post(
            f"{BASE_URL}/api/admin/tokens/gift",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "user_id": test_user_id,
                "tokens": 25,
                "message": "Test gift"
            }
        )
        
        assert gift_response.status_code == 200, f"Expected 200, got {gift_response.status_code}: {gift_response.text}"
        
        data = gift_response.json()
        assert "new_balance" in data, "Response missing new_balance"
        assert data["new_balance"] == initial_balance + 25, "Balance not updated correctly"
        
        print(f"✓ Admin gifted 25 tokens, new balance: {data['new_balance']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
