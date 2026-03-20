"""
Test cases for Karaoke/DJ system updates and role selection feature
Features tested:
- POST /api/user/register with role (Customer, Server, Bartender, Manager, DJ)
- GET /api/dj/at-location/{slug} - check if DJ is present at location
- GET /api/karaoke/status/{slug} - check if karaoke is active at location
- POST /api/dj/login, POST /api/dj/checkin, POST /api/karaoke/toggle
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestUserRegistrationWithRole:
    """Test user registration with role selection"""
    
    def test_register_user_as_customer(self):
        """Register a user with customer role (default)"""
        unique_id = uuid.uuid4().hex[:8]
        response = requests.post(f"{BASE_URL}/api/user/register", json={
            "name": f"TEST_Customer_{unique_id}",
            "phone": "555-111-0001",
            "email": f"test_customer_{unique_id}@example.com",
            "role": "customer"
        })
        print(f"Register customer response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "id" in data, "Response should contain user id"
        assert data.get("role") == "customer", "Role should be customer"
        print(f"SUCCESS: User registered with customer role")
    
    def test_register_user_as_server(self):
        """Register a user with server role"""
        unique_id = uuid.uuid4().hex[:8]
        response = requests.post(f"{BASE_URL}/api/user/register", json={
            "name": f"TEST_Server_{unique_id}",
            "phone": "555-111-0002",
            "email": f"test_server_{unique_id}@example.com",
            "role": "server"
        })
        print(f"Register server response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("role") == "server", "Role should be server"
        print(f"SUCCESS: User registered with server role")
    
    def test_register_user_as_bartender(self):
        """Register a user with bartender role"""
        unique_id = uuid.uuid4().hex[:8]
        response = requests.post(f"{BASE_URL}/api/user/register", json={
            "name": f"TEST_Bartender_{unique_id}",
            "phone": "555-111-0003",
            "email": f"test_bartender_{unique_id}@example.com",
            "role": "bartender"
        })
        print(f"Register bartender response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("role") == "bartender", "Role should be bartender"
        print(f"SUCCESS: User registered with bartender role")
    
    def test_register_user_as_manager(self):
        """Register a user with manager role"""
        unique_id = uuid.uuid4().hex[:8]
        response = requests.post(f"{BASE_URL}/api/user/register", json={
            "name": f"TEST_Manager_{unique_id}",
            "phone": "555-111-0004",
            "email": f"test_manager_{unique_id}@example.com",
            "role": "manager"
        })
        print(f"Register manager response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("role") == "manager", "Role should be manager"
        print(f"SUCCESS: User registered with manager role")
    
    def test_register_user_as_dj(self):
        """Register a user with DJ role"""
        unique_id = uuid.uuid4().hex[:8]
        response = requests.post(f"{BASE_URL}/api/user/register", json={
            "name": f"TEST_DJ_{unique_id}",
            "phone": "555-111-0005",
            "email": f"test_dj_{unique_id}@example.com",
            "role": "dj"
        })
        print(f"Register DJ response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("role") == "dj", "Role should be dj"
        print(f"SUCCESS: User registered with DJ role")
    
    def test_register_user_invalid_role_defaults_to_customer(self):
        """Invalid role should default to customer"""
        unique_id = uuid.uuid4().hex[:8]
        response = requests.post(f"{BASE_URL}/api/user/register", json={
            "name": f"TEST_InvalidRole_{unique_id}",
            "phone": "555-111-0006",
            "email": f"test_invalid_role_{unique_id}@example.com",
            "role": "invalid_role"
        })
        print(f"Register invalid role response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("role") == "customer", "Invalid role should default to customer"
        print(f"SUCCESS: Invalid role defaulted to customer")
    
    def test_register_user_without_role_defaults_to_customer(self):
        """Missing role should default to customer"""
        unique_id = uuid.uuid4().hex[:8]
        response = requests.post(f"{BASE_URL}/api/user/register", json={
            "name": f"TEST_NoRole_{unique_id}",
            "phone": "555-111-0007"
        })
        print(f"Register no role response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("role") == "customer", "Missing role should default to customer"
        print(f"SUCCESS: Missing role defaulted to customer")


class TestDJAtLocation:
    """Test DJ presence at location"""
    
    def test_dj_at_location_no_dj(self):
        """Check location with no DJ present"""
        response = requests.get(f"{BASE_URL}/api/dj/at-location/edgewood-atlanta")
        print(f"DJ at location (no DJ) response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "checked_in" in data, "Response should contain checked_in field"
        # Either True or False is valid depending on current state
        print(f"SUCCESS: DJ at location endpoint working, checked_in={data.get('checked_in')}")
    
    def test_dj_checkin_and_verify_at_location(self):
        """DJ logs in, checks in at location, verify presence"""
        unique_id = uuid.uuid4().hex[:8]
        
        # Step 1: DJ login
        login_response = requests.post(f"{BASE_URL}/api/dj/login", json={
            "name": f"TEST_DJ_CheckIn_{unique_id}"
        })
        print(f"DJ login response: {login_response.status_code} - {login_response.text}")
        assert login_response.status_code == 200, f"Expected 200, got {login_response.status_code}"
        dj_data = login_response.json()
        dj_id = dj_data.get("id")
        assert dj_id, "DJ login should return id"
        print(f"DJ logged in with ID: {dj_id}")
        
        # Step 2: DJ check in at location
        location_slug = "edgewood-atlanta"
        checkin_response = requests.post(f"{BASE_URL}/api/dj/checkin/{dj_id}?location_slug={location_slug}")
        print(f"DJ checkin response: {checkin_response.status_code} - {checkin_response.text}")
        assert checkin_response.status_code == 200, f"Expected 200, got {checkin_response.status_code}"
        
        # Step 3: Verify DJ is at location
        at_location_response = requests.get(f"{BASE_URL}/api/dj/at-location/{location_slug}")
        print(f"DJ at location response: {at_location_response.status_code} - {at_location_response.text}")
        assert at_location_response.status_code == 200
        location_data = at_location_response.json()
        assert location_data.get("checked_in") == True, "DJ should be checked in"
        assert location_data.get("dj_id") == dj_id, "DJ ID should match"
        print(f"SUCCESS: DJ checked in and verified at location")
        
        # Step 4: Checkout DJ to clean up
        checkout_response = requests.post(f"{BASE_URL}/api/dj/checkout/{dj_id}")
        print(f"DJ checkout response: {checkout_response.status_code}")
        
        # Verify checkout
        at_location_after = requests.get(f"{BASE_URL}/api/dj/at-location/{location_slug}")
        after_data = at_location_after.json()
        print(f"After checkout: checked_in={after_data.get('checked_in')}")


class TestKaraokeStatus:
    """Test karaoke status at location"""
    
    def test_karaoke_status_inactive(self):
        """Check karaoke status at location (should return active field)"""
        response = requests.get(f"{BASE_URL}/api/karaoke/status/edgewood-atlanta")
        print(f"Karaoke status response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "active" in data, "Response should contain active field"
        print(f"SUCCESS: Karaoke status endpoint working, active={data.get('active')}")
    
    def test_karaoke_toggle_on_and_off(self):
        """Toggle karaoke on and off"""
        unique_id = uuid.uuid4().hex[:8]
        location_slug = "edgewood-atlanta"
        
        # Step 1: DJ login
        login_response = requests.post(f"{BASE_URL}/api/dj/login", json={
            "name": f"TEST_DJ_Karaoke_{unique_id}"
        })
        dj_data = login_response.json()
        dj_id = dj_data.get("id")
        print(f"DJ logged in with ID: {dj_id}")
        
        # Step 2: DJ check in
        requests.post(f"{BASE_URL}/api/dj/checkin/{dj_id}?location_slug={location_slug}")
        
        # Step 3: Toggle karaoke ON
        toggle_on_response = requests.post(f"{BASE_URL}/api/karaoke/toggle/{location_slug}", json={
            "active": True,
            "dj_id": dj_id
        })
        print(f"Toggle karaoke ON response: {toggle_on_response.status_code} - {toggle_on_response.text}")
        assert toggle_on_response.status_code == 200
        
        # Step 4: Verify karaoke is active
        status_response = requests.get(f"{BASE_URL}/api/karaoke/status/{location_slug}")
        status_data = status_response.json()
        print(f"Karaoke status after toggle ON: {status_data}")
        assert status_data.get("active") == True, "Karaoke should be active"
        print(f"SUCCESS: Karaoke toggled ON")
        
        # Step 5: Toggle karaoke OFF
        toggle_off_response = requests.post(f"{BASE_URL}/api/karaoke/toggle/{location_slug}", json={
            "active": False,
            "dj_id": dj_id
        })
        print(f"Toggle karaoke OFF response: {toggle_off_response.status_code}")
        
        # Step 6: Verify karaoke is inactive
        status_after = requests.get(f"{BASE_URL}/api/karaoke/status/{location_slug}")
        status_after_data = status_after.json()
        print(f"Karaoke status after toggle OFF: {status_after_data}")
        assert status_after_data.get("active") == False, "Karaoke should be inactive"
        print(f"SUCCESS: Karaoke toggled OFF")
        
        # Cleanup: DJ checkout
        requests.post(f"{BASE_URL}/api/dj/checkout/{dj_id}")


class TestKaraokeVsRequestSongScenario:
    """Test the 'Karaoke Sign Up' vs 'Request a Song' button scenario"""
    
    def test_dj_present_without_karaoke_returns_request_song_state(self):
        """
        When DJ is present but karaoke is NOT active:
        - /api/dj/at-location/{slug} should return checked_in=True
        - /api/karaoke/status/{slug} should return active=False
        This triggers 'Request a Song' button on frontend
        """
        unique_id = uuid.uuid4().hex[:8]
        location_slug = "douglasville"
        
        # Step 1: DJ login and checkin
        login_response = requests.post(f"{BASE_URL}/api/dj/login", json={
            "name": f"TEST_DJ_RequestSong_{unique_id}"
        })
        dj_data = login_response.json()
        dj_id = dj_data.get("id")
        
        requests.post(f"{BASE_URL}/api/dj/checkin/{dj_id}?location_slug={location_slug}")
        
        # Step 2: Ensure karaoke is OFF
        requests.post(f"{BASE_URL}/api/karaoke/toggle/{location_slug}", json={
            "active": False,
            "dj_id": dj_id
        })
        
        # Step 3: Verify state - DJ present, karaoke inactive
        dj_at_loc = requests.get(f"{BASE_URL}/api/dj/at-location/{location_slug}").json()
        karaoke_status = requests.get(f"{BASE_URL}/api/karaoke/status/{location_slug}").json()
        
        print(f"DJ at location: {dj_at_loc}")
        print(f"Karaoke status: {karaoke_status}")
        
        assert dj_at_loc.get("checked_in") == True, "DJ should be checked in"
        assert karaoke_status.get("active") == False, "Karaoke should be inactive"
        print(f"SUCCESS: State for 'Request a Song' button verified")
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/dj/checkout/{dj_id}")
    
    def test_karaoke_active_returns_karaoke_signup_state(self):
        """
        When karaoke IS active:
        - /api/karaoke/status/{slug} should return active=True
        This triggers 'Karaoke Sign Up' button on frontend
        """
        unique_id = uuid.uuid4().hex[:8]
        location_slug = "decatur"
        
        # Step 1: DJ login and checkin
        login_response = requests.post(f"{BASE_URL}/api/dj/login", json={
            "name": f"TEST_DJ_KaraokeSignup_{unique_id}"
        })
        dj_data = login_response.json()
        dj_id = dj_data.get("id")
        
        requests.post(f"{BASE_URL}/api/dj/checkin/{dj_id}?location_slug={location_slug}")
        
        # Step 2: Turn karaoke ON
        requests.post(f"{BASE_URL}/api/karaoke/toggle/{location_slug}", json={
            "active": True,
            "dj_id": dj_id
        })
        
        # Step 3: Verify state - karaoke active
        karaoke_status = requests.get(f"{BASE_URL}/api/karaoke/status/{location_slug}").json()
        
        print(f"Karaoke status: {karaoke_status}")
        assert karaoke_status.get("active") == True, "Karaoke should be active"
        print(f"SUCCESS: State for 'Karaoke Sign Up' button verified")
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/karaoke/toggle/{location_slug}", json={
            "active": False,
            "dj_id": dj_id
        })
        requests.post(f"{BASE_URL}/api/dj/checkout/{dj_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
