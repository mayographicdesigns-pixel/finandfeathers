"""
Test Role-Based User System:
- User roles: customer, staff, management
- Staff receives tips to cashout_balance
- Staff cashout requires minimum $20 at 80% rate
- Staff can transfer tips to personal token balance
- Admin can change user roles
- Admin can view and process cashout requests
- Customers can tip staff via token transfer
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestRoleBasedSystem:
    """Test all role-based functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.admin_token = None
        self.customer_id = None
        self.staff_id = "c3b77d74-3fa1-4f3d-8e95-8f3642c3089e"  # Existing staff from main agent
        
    def get_admin_token(self):
        """Get admin authentication token"""
        if self.admin_token:
            return self.admin_token
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        self.admin_token = response.json()["access_token"]
        return self.admin_token
    
    def admin_headers(self):
        """Get headers with admin token"""
        return {"Authorization": f"Bearer {self.get_admin_token()}"}
    
    # ==================== USER PROFILE & ROLE TESTS ====================
    
    def test_user_profile_has_role_fields(self):
        """Test that user profile contains role-related fields"""
        # Get existing staff profile
        response = requests.get(f"{BASE_URL}/api/user/profile/{self.staff_id}")
        assert response.status_code == 200, f"Failed to get profile: {response.text}"
        
        profile = response.json()
        assert "role" in profile, "Profile missing 'role' field"
        assert "staff_title" in profile, "Profile missing 'staff_title' field"
        assert "cashout_balance" in profile, "Profile missing 'cashout_balance' field"
        assert "total_earnings" in profile, "Profile missing 'total_earnings' field"
        
        # Verify staff role is set correctly
        assert profile["role"] == "staff", f"Expected role 'staff', got '{profile['role']}'"
        print(f"PASS: User profile has role={profile['role']}, cashout_balance=${profile['cashout_balance']}")
    
    def test_new_user_defaults_to_customer(self):
        """Test that new users default to customer role"""
        # Create a new user
        new_user = {
            "name": f"TEST_customer_{uuid.uuid4().hex[:8]}",
            "email": f"test_customer_{uuid.uuid4().hex[:8]}@example.com",
            "avatar_emoji": "😊"
        }
        response = requests.post(f"{BASE_URL}/api/user/profile", json=new_user)
        assert response.status_code == 200, f"Failed to create user: {response.text}"
        
        profile = response.json()
        self.customer_id = profile["id"]
        
        # Verify default role
        assert profile["role"] == "customer", f"Expected role 'customer', got '{profile['role']}'"
        assert profile["cashout_balance"] == 0.0, "New user should have 0 cashout_balance"
        print(f"PASS: New user created with role=customer, id={profile['id']}")
        
        return profile["id"]
    
    # ==================== ADMIN ROLE MANAGEMENT TESTS ====================
    
    def test_admin_can_change_user_role(self):
        """Test admin can change user role to staff/management/customer"""
        # First create a test user
        customer_id = self.test_new_user_defaults_to_customer()
        
        # Admin changes role to staff
        response = requests.post(
            f"{BASE_URL}/api/admin/users/role",
            json={"user_id": customer_id, "new_role": "staff", "staff_title": "Test Server"},
            headers=self.admin_headers()
        )
        assert response.status_code == 200, f"Failed to update role: {response.text}"
        
        # Verify the role was changed
        verify = requests.get(f"{BASE_URL}/api/user/profile/{customer_id}")
        assert verify.status_code == 200
        updated_profile = verify.json()
        
        assert updated_profile["role"] == "staff", f"Role not updated: {updated_profile['role']}"
        assert updated_profile["staff_title"] == "Test Server", f"Staff title not set"
        print(f"PASS: Admin changed user role to staff with title='Test Server'")
        
        # Change to management
        response = requests.post(
            f"{BASE_URL}/api/admin/users/role",
            json={"user_id": customer_id, "new_role": "management"},
            headers=self.admin_headers()
        )
        assert response.status_code == 200
        
        verify = requests.get(f"{BASE_URL}/api/user/profile/{customer_id}")
        assert verify.json()["role"] == "management"
        print(f"PASS: Admin changed user role to management")
        
        # Change back to customer
        response = requests.post(
            f"{BASE_URL}/api/admin/users/role",
            json={"user_id": customer_id, "new_role": "customer"},
            headers=self.admin_headers()
        )
        assert response.status_code == 200
        
        verify = requests.get(f"{BASE_URL}/api/user/profile/{customer_id}")
        assert verify.json()["role"] == "customer"
        print(f"PASS: Admin changed user role back to customer")
    
    def test_admin_role_change_requires_auth(self):
        """Test that role change requires admin auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/role",
            json={"user_id": self.staff_id, "new_role": "customer"}
        )
        assert response.status_code in [401, 403], f"Should require auth: {response.status_code}"
        print("PASS: Role change properly requires admin auth")
    
    def test_admin_invalid_role_rejected(self):
        """Test that invalid roles are rejected"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/role",
            json={"user_id": self.staff_id, "new_role": "superadmin"},
            headers=self.admin_headers()
        )
        assert response.status_code == 400, f"Should reject invalid role: {response.status_code}"
        print("PASS: Invalid role 'superadmin' correctly rejected")
    
    # ==================== STAFF LIST FOR TIPPING ====================
    
    def test_get_staff_list_for_tipping(self):
        """Test getting list of staff members for tipping"""
        response = requests.get(f"{BASE_URL}/api/staff/list")
        assert response.status_code == 200, f"Failed to get staff list: {response.text}"
        
        staff_list = response.json()
        assert isinstance(staff_list, list), "Staff list should be an array"
        
        # We know at least one staff exists
        if len(staff_list) > 0:
            staff = staff_list[0]
            assert "id" in staff, "Staff entry missing 'id'"
            assert "name" in staff, "Staff entry missing 'name'"
            assert "staff_title" in staff, "Staff entry missing 'staff_title'"
            print(f"PASS: Staff list returned {len(staff_list)} staff members")
            for s in staff_list:
                print(f"  - {s['name']} ({s.get('staff_title', 'Staff')})")
        else:
            print("WARNING: No staff members in list (may need to create staff users)")
    
    # ==================== TOKEN TRANSFER / TIPPING TESTS ====================
    
    def test_customer_tip_staff_updates_cashout_balance(self):
        """Test that tipping staff adds to their cashout_balance (not token_balance)"""
        # Create a customer with tokens
        customer = {
            "name": f"TEST_tipper_{uuid.uuid4().hex[:8]}",
            "email": f"test_tipper_{uuid.uuid4().hex[:8]}@example.com"
        }
        create_resp = requests.post(f"{BASE_URL}/api/user/profile", json=customer)
        assert create_resp.status_code == 200
        customer_id = create_resp.json()["id"]
        
        # Give customer tokens via purchase
        purchase_resp = requests.post(
            f"{BASE_URL}/api/user/tokens/purchase/{customer_id}",
            json={"amount_usd": 10}  # $10 = 100 tokens
        )
        assert purchase_resp.status_code == 200
        assert purchase_resp.json()["new_balance"] == 100
        
        # Get staff's current cashout balance
        staff_before = requests.get(f"{BASE_URL}/api/user/profile/{self.staff_id}").json()
        cashout_before = staff_before["cashout_balance"]
        
        # Tip the staff 50 tokens ($5)
        tip_resp = requests.post(
            f"{BASE_URL}/api/user/tokens/transfer/{customer_id}",
            json={
                "to_user_id": self.staff_id,
                "amount": 50,
                "transfer_type": "tip",
                "message": "Great service!"
            }
        )
        assert tip_resp.status_code == 200, f"Tip failed: {tip_resp.text}"
        
        result = tip_resp.json()
        assert result["sender_new_balance"] == 50, "Customer should have 50 tokens left"
        print(f"PASS: Customer transferred 50 tokens as tip")
        
        # Verify staff's cashout_balance increased by $5 (50 tokens = $5)
        staff_after = requests.get(f"{BASE_URL}/api/user/profile/{self.staff_id}").json()
        expected_cashout = cashout_before + 5.0  # 50 tokens / 10 = $5
        assert abs(staff_after["cashout_balance"] - expected_cashout) < 0.01, \
            f"Expected cashout_balance={expected_cashout}, got {staff_after['cashout_balance']}"
        print(f"PASS: Staff cashout_balance updated: ${cashout_before} -> ${staff_after['cashout_balance']}")
    
    def test_non_tip_transfer_goes_to_token_balance(self):
        """Test that non-tip transfers (gift, transfer) go to token_balance not cashout"""
        # Create two regular users
        user1 = {"name": f"TEST_sender_{uuid.uuid4().hex[:8]}", "email": f"sender_{uuid.uuid4().hex[:8]}@example.com"}
        user2 = {"name": f"TEST_receiver_{uuid.uuid4().hex[:8]}", "email": f"receiver_{uuid.uuid4().hex[:8]}@example.com"}
        
        u1 = requests.post(f"{BASE_URL}/api/user/profile", json=user1).json()
        u2 = requests.post(f"{BASE_URL}/api/user/profile", json=user2).json()
        
        # Give user1 tokens
        requests.post(f"{BASE_URL}/api/user/tokens/purchase/{u1['id']}", json={"amount_usd": 5})
        
        # Transfer (not tip) to user2
        resp = requests.post(
            f"{BASE_URL}/api/user/tokens/transfer/{u1['id']}",
            json={"to_user_id": u2['id'], "amount": 30, "transfer_type": "gift"}
        )
        assert resp.status_code == 200
        
        # Verify user2's token_balance increased (not cashout_balance)
        u2_updated = requests.get(f"{BASE_URL}/api/user/profile/{u2['id']}").json()
        assert u2_updated["token_balance"] == 30, f"Expected token_balance=30, got {u2_updated['token_balance']}"
        assert u2_updated["cashout_balance"] == 0.0, "Cashout balance should be 0 for non-tip"
        print("PASS: Gift transfer goes to token_balance, not cashout_balance")
    
    # ==================== STAFF CASHOUT TESTS ====================
    
    def test_staff_cashout_requires_minimum_20(self):
        """Test that staff cannot cash out with less than $20"""
        # The existing staff has $5 cashout balance
        response = requests.post(
            f"{BASE_URL}/api/staff/cashout/{self.staff_id}",
            json={"amount_tokens": 50, "payment_method": "venmo", "payment_details": "@testuser"}
        )
        assert response.status_code == 400, f"Should reject low balance cashout: {response.status_code}"
        assert "minimum" in response.text.lower() or "$20" in response.text, \
            f"Should mention minimum: {response.text}"
        print("PASS: Cashout correctly rejected with less than $20 balance")
    
    def test_staff_cashout_80_percent_rate(self):
        """Test that staff cashout applies 80% payout rate"""
        # Create a new staff member with enough balance for testing
        staff_user = {
            "name": f"TEST_cashout_staff_{uuid.uuid4().hex[:8]}",
            "email": f"cashout_staff_{uuid.uuid4().hex[:8]}@example.com"
        }
        create_resp = requests.post(f"{BASE_URL}/api/user/profile", json=staff_user)
        assert create_resp.status_code == 200
        staff_id = create_resp.json()["id"]
        
        # Set role to staff
        requests.post(
            f"{BASE_URL}/api/admin/users/role",
            json={"user_id": staff_id, "new_role": "staff", "staff_title": "Cashout Tester"},
            headers=self.admin_headers()
        )
        
        # Simulate tips by creating a customer and having them tip
        tipper = {"name": f"TEST_bigtipper_{uuid.uuid4().hex[:8]}", "email": f"bigtipper_{uuid.uuid4().hex[:8]}@example.com"}
        tipper_resp = requests.post(f"{BASE_URL}/api/user/profile", json=tipper)
        tipper_id = tipper_resp.json()["id"]
        
        # Give tipper $30 worth of tokens (300 tokens)
        requests.post(f"{BASE_URL}/api/user/tokens/purchase/{tipper_id}", json={"amount_usd": 30})
        
        # Tip the staff $25 (250 tokens)
        requests.post(
            f"{BASE_URL}/api/user/tokens/transfer/{tipper_id}",
            json={"to_user_id": staff_id, "amount": 250, "transfer_type": "tip"}
        )
        
        # Verify staff has $25 in cashout_balance
        staff_profile = requests.get(f"{BASE_URL}/api/user/profile/{staff_id}").json()
        assert staff_profile["cashout_balance"] == 25.0, \
            f"Expected cashout_balance=25.0, got {staff_profile['cashout_balance']}"
        
        # Now request cashout (200 tokens = $20)
        cashout_resp = requests.post(
            f"{BASE_URL}/api/staff/cashout/{staff_id}",
            json={"amount_tokens": 200, "payment_method": "cashapp", "payment_details": "$testcashout"}
        )
        assert cashout_resp.status_code == 200, f"Cashout failed: {cashout_resp.text}"
        
        result = cashout_resp.json()
        # 200 tokens = $20, at 80% = $16 payout
        assert result["payout_amount"] == 16.0, f"Expected payout $16, got ${result['payout_amount']}"
        print(f"PASS: Cashout applies 80% rate: $20 tokens -> $16 payout")
        
        # Verify balance reduced by $20
        staff_updated = requests.get(f"{BASE_URL}/api/user/profile/{staff_id}").json()
        assert staff_updated["cashout_balance"] == 5.0, \
            f"Expected remaining balance $5, got ${staff_updated['cashout_balance']}"
        print(f"PASS: Staff balance reduced from $25 to ${staff_updated['cashout_balance']}")
    
    def test_only_staff_can_cashout(self):
        """Test that only users with staff role can request cashout"""
        # Create a customer
        customer = {"name": f"TEST_notstaff_{uuid.uuid4().hex[:8]}", "email": f"notstaff_{uuid.uuid4().hex[:8]}@example.com"}
        cust_resp = requests.post(f"{BASE_URL}/api/user/profile", json=customer)
        cust_id = cust_resp.json()["id"]
        
        # Try to cashout (should fail)
        response = requests.post(
            f"{BASE_URL}/api/staff/cashout/{cust_id}",
            json={"amount_tokens": 200, "payment_method": "venmo", "payment_details": "@notstaff"}
        )
        assert response.status_code == 403, f"Non-staff should not cashout: {response.status_code}"
        print("PASS: Non-staff users cannot request cashout")
    
    # ==================== TRANSFER TIPS TO PERSONAL BALANCE ====================
    
    def test_staff_transfer_tips_to_personal(self):
        """Test that staff can transfer cashout_balance to personal token_balance"""
        # Use existing staff with some cashout balance
        staff_before = requests.get(f"{BASE_URL}/api/user/profile/{self.staff_id}").json()
        
        # Only run if staff has some cashout balance
        if staff_before["cashout_balance"] >= 1.0:
            initial_cashout = staff_before["cashout_balance"]
            initial_tokens = staff_before["token_balance"]
            
            # Transfer $1 to personal (should get 10 tokens)
            resp = requests.post(f"{BASE_URL}/api/staff/transfer-to-personal/{self.staff_id}?amount=1.0")
            assert resp.status_code == 200, f"Transfer failed: {resp.text}"
            
            result = resp.json()
            assert result["tokens_added"] == 10, f"Expected 10 tokens, got {result['tokens_added']}"
            
            # Verify balances updated
            staff_after = requests.get(f"{BASE_URL}/api/user/profile/{self.staff_id}").json()
            assert staff_after["cashout_balance"] == initial_cashout - 1.0
            assert staff_after["token_balance"] == initial_tokens + 10
            print(f"PASS: Staff transferred $1 tips -> 10 personal tokens")
        else:
            print("SKIP: Staff has insufficient cashout balance for this test")
    
    def test_staff_transfer_cannot_exceed_balance(self):
        """Test that staff cannot transfer more than their cashout_balance"""
        # Try to transfer more than available
        response = requests.post(f"{BASE_URL}/api/staff/transfer-to-personal/{self.staff_id}?amount=99999")
        assert response.status_code == 400, f"Should reject: {response.status_code}"
        print("PASS: Transfer correctly rejected when exceeding balance")
    
    # ==================== ADMIN CASHOUT MANAGEMENT ====================
    
    def test_admin_can_view_cashout_requests(self):
        """Test admin can view all cashout requests"""
        response = requests.get(f"{BASE_URL}/api/admin/cashouts", headers=self.admin_headers())
        assert response.status_code == 200, f"Failed to get cashouts: {response.text}"
        
        cashouts = response.json()
        assert isinstance(cashouts, list), "Should return list of cashouts"
        print(f"PASS: Admin can view {len(cashouts)} cashout requests")
    
    def test_admin_can_process_cashout(self):
        """Test admin can approve/reject cashout requests"""
        # Get existing cashout requests
        cashouts = requests.get(f"{BASE_URL}/api/admin/cashouts", headers=self.admin_headers()).json()
        
        if len(cashouts) > 0:
            cashout_id = cashouts[0]["id"]
            
            # Process it
            resp = requests.put(
                f"{BASE_URL}/api/admin/cashouts/{cashout_id}?status=approved",
                headers=self.admin_headers()
            )
            assert resp.status_code == 200, f"Failed to process: {resp.text}"
            print(f"PASS: Admin processed cashout request {cashout_id}")
        else:
            print("SKIP: No cashout requests to process")
    
    # ==================== TRANSFER HISTORY ====================
    
    def test_get_transfer_history(self):
        """Test retrieving user's transfer history"""
        response = requests.get(f"{BASE_URL}/api/user/tokens/transfers/{self.staff_id}")
        assert response.status_code == 200, f"Failed to get history: {response.text}"
        
        transfers = response.json()
        assert isinstance(transfers, list), "Should return list"
        print(f"PASS: Retrieved {len(transfers)} transfer records for staff")
    
    def test_get_cashout_history(self):
        """Test retrieving staff cashout history"""
        response = requests.get(f"{BASE_URL}/api/staff/cashout/history/{self.staff_id}")
        assert response.status_code == 200, f"Failed to get history: {response.text}"
        
        history = response.json()
        assert isinstance(history, list), "Should return list"
        print(f"PASS: Retrieved {len(history)} cashout records for staff")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
