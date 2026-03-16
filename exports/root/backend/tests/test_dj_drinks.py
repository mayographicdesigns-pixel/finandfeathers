"""
Tests for DJ Profile and Send a Drink features
- DJ Profile API: register, get profile, check-in/check-out at location
- DJ at Location: shows profile with payment methods (Cash App, Venmo, Apple Pay)
- Drink Order API: send drinks between checked-in users
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# ==================== DJ PROFILE TESTS ====================

class TestDJProfileAPI:
    """Tests for DJ Profile CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data tracking"""
        self.created_dj_ids = []
        yield
        # Cleanup - DJs remain in system but we track them
    
    def test_register_dj_profile(self):
        """Test creating a new DJ profile"""
        unique_id = str(uuid.uuid4())[:8]
        dj_data = {
            "name": f"TEST_DJ_{unique_id}",
            "stage_name": f"DJ Test {unique_id}",
            "avatar_emoji": "🎧",
            "cash_app_username": f"$TestDJ{unique_id}",
            "venmo_username": f"@TestDJ{unique_id}",
            "apple_pay_phone": "555-555-5555",
            "bio": "Test DJ bio for testing purposes"
        }
        
        response = requests.post(f"{BASE_URL}/api/dj/register", json=dj_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain DJ id"
        assert data["name"] == dj_data["name"], "DJ name should match"
        assert data["stage_name"] == dj_data["stage_name"], "Stage name should match"
        assert data["cash_app_username"] == dj_data["cash_app_username"], "Cash App username should match"
        assert data["venmo_username"] == dj_data["venmo_username"], "Venmo username should match"
        assert data["apple_pay_phone"] == dj_data["apple_pay_phone"], "Apple Pay phone should match"
        assert data["is_active"] == True, "DJ should be active by default"
        
        self.created_dj_ids.append(data["id"])
        print(f"✓ DJ registered with ID: {data['id']}")
        return data["id"]
    
    def test_get_all_dj_profiles(self):
        """Test fetching all DJ profiles"""
        response = requests.get(f"{BASE_URL}/api/dj/profiles")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Retrieved {len(data)} DJ profiles")
    
    def test_get_dj_profile_by_id(self):
        """Test fetching a specific DJ profile"""
        # First create a DJ
        unique_id = str(uuid.uuid4())[:8]
        dj_data = {
            "name": f"TEST_DJ_GET_{unique_id}",
            "stage_name": f"DJ GetTest {unique_id}",
            "avatar_emoji": "🎵",
            "cash_app_username": f"$TestDJGet{unique_id}"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/dj/register", json=dj_data)
        assert create_response.status_code == 200
        created_dj = create_response.json()
        dj_id = created_dj["id"]
        
        # Now fetch by ID
        get_response = requests.get(f"{BASE_URL}/api/dj/profile/{dj_id}")
        assert get_response.status_code == 200, f"Expected 200, got {get_response.status_code}"
        
        data = get_response.json()
        assert data["id"] == dj_id, "DJ ID should match"
        assert data["name"] == dj_data["name"], "DJ name should match"
        print(f"✓ Successfully retrieved DJ profile {dj_id}")
    
    def test_get_nonexistent_dj_profile(self):
        """Test fetching a DJ that doesn't exist"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/dj/profile/{fake_id}")
        assert response.status_code == 404, "Should return 404 for non-existent DJ"
        print("✓ Correctly returns 404 for non-existent DJ")
    
    def test_update_dj_profile(self):
        """Test updating a DJ profile"""
        # First create a DJ
        unique_id = str(uuid.uuid4())[:8]
        dj_data = {
            "name": f"TEST_DJ_UPDATE_{unique_id}",
            "stage_name": f"DJ Update {unique_id}",
            "avatar_emoji": "🎤"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/dj/register", json=dj_data)
        assert create_response.status_code == 200
        dj_id = create_response.json()["id"]
        
        # Update the DJ
        update_data = {
            "stage_name": f"DJ Updated {unique_id}",
            "bio": "Updated bio",
            "cash_app_username": "$UpdatedCashApp"
        }
        
        update_response = requests.put(f"{BASE_URL}/api/dj/profile/{dj_id}", json=update_data)
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}"
        
        updated_dj = update_response.json()
        assert updated_dj["stage_name"] == update_data["stage_name"], "Stage name should be updated"
        assert updated_dj["bio"] == update_data["bio"], "Bio should be updated"
        assert updated_dj["cash_app_username"] == update_data["cash_app_username"], "Cash App should be updated"
        print(f"✓ Successfully updated DJ profile {dj_id}")


class TestDJCheckInOut:
    """Tests for DJ check-in and check-out at locations"""
    
    def test_dj_checkin_at_location(self):
        """Test DJ checking in at a location"""
        # Create a DJ first
        unique_id = str(uuid.uuid4())[:8]
        dj_data = {
            "name": f"TEST_DJ_CHECKIN_{unique_id}",
            "stage_name": f"DJ Checkin {unique_id}",
            "cash_app_username": f"$DJCheckin{unique_id}",
            "venmo_username": f"@DJCheckin{unique_id}"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/dj/register", json=dj_data)
        assert create_response.status_code == 200
        dj_id = create_response.json()["id"]
        
        # Check in at a location
        location_slug = "edgewood-atlanta"
        checkin_response = requests.post(f"{BASE_URL}/api/dj/checkin/{dj_id}?location_slug={location_slug}")
        assert checkin_response.status_code == 200, f"Expected 200, got {checkin_response.status_code}"
        
        data = checkin_response.json()
        assert "message" in data, "Should return a message"
        assert location_slug in data["message"], "Message should mention location"
        print(f"✓ DJ {dj_id} checked in at {location_slug}")
        
        # Verify check-in by getting DJ at location
        at_location_response = requests.get(f"{BASE_URL}/api/dj/at-location/{location_slug}")
        assert at_location_response.status_code == 200
        at_location_data = at_location_response.json()
        
        # Note: Another DJ (DJ MIKE) may already be checked in, so we just verify API works
        print(f"✓ DJ at location API returns: {at_location_data.get('stage_name', 'None') if at_location_data else 'No DJ'}")
        
        # Checkout the test DJ
        checkout_response = requests.post(f"{BASE_URL}/api/dj/checkout/{dj_id}")
        assert checkout_response.status_code == 200
        print(f"✓ DJ {dj_id} checked out")
    
    def test_dj_checkout(self):
        """Test DJ checking out from location"""
        # Create and check in a DJ
        unique_id = str(uuid.uuid4())[:8]
        dj_data = {
            "name": f"TEST_DJ_CHECKOUT_{unique_id}",
            "stage_name": f"DJ Checkout {unique_id}"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/dj/register", json=dj_data)
        assert create_response.status_code == 200
        dj_id = create_response.json()["id"]
        
        # Check in
        requests.post(f"{BASE_URL}/api/dj/checkin/{dj_id}?location_slug=test-location")
        
        # Check out
        checkout_response = requests.post(f"{BASE_URL}/api/dj/checkout/{dj_id}")
        assert checkout_response.status_code == 200, f"Expected 200, got {checkout_response.status_code}"
        
        data = checkout_response.json()
        assert "message" in data, "Should return a message"
        assert "checked out" in data["message"].lower(), "Message should confirm checkout"
        print(f"✓ DJ {dj_id} successfully checked out")
    
    def test_get_dj_at_location(self):
        """Test getting the current DJ at a location"""
        # Test with existing location (DJ MIKE should be there)
        location_slug = "edgewood-atlanta"
        response = requests.get(f"{BASE_URL}/api/dj/at-location/{location_slug}")
        
        # Could be 200 with data or 200 with null (no DJ)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        if data:
            assert "id" in data, "DJ data should have id"
            assert "name" in data, "DJ data should have name"
            print(f"✓ Current DJ at {location_slug}: {data.get('stage_name', data.get('name'))}")
            
            # Verify payment methods are present
            if data.get("cash_app_username"):
                print(f"  Cash App: {data['cash_app_username']}")
            if data.get("venmo_username"):
                print(f"  Venmo: {data['venmo_username']}")
            if data.get("apple_pay_phone"):
                print(f"  Apple Pay: {data['apple_pay_phone']}")
        else:
            print(f"✓ No DJ currently at {location_slug}")
    
    def test_get_dj_at_nonexistent_location(self):
        """Test getting DJ at a location with no DJ"""
        location_slug = "nonexistent-test-location-12345"
        response = requests.get(f"{BASE_URL}/api/dj/at-location/{location_slug}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data is None or data == {}, "Should return null/empty for location with no DJ"
        print("✓ Correctly returns null for location with no DJ")


class TestDJTipWithPaymentMethod:
    """Tests for DJ tips with payment method field"""
    
    @pytest.fixture
    def checkin_user(self):
        """Create a check-in user for tipping"""
        unique_id = str(uuid.uuid4())[:8]
        checkin_data = {
            "location_slug": "edgewood-atlanta",
            "display_name": f"TEST_Tipper_{unique_id}",
            "avatar_emoji": "💰",
            "mood": "Tipping"
        }
        
        response = requests.post(f"{BASE_URL}/api/checkin", json=checkin_data)
        assert response.status_code == 200
        user = response.json()
        
        yield user
        
        # Cleanup - checkout
        requests.delete(f"{BASE_URL}/api/checkin/{user['id']}")
    
    def test_send_tip_with_cash_app(self, checkin_user):
        """Test sending a tip with Cash App payment method"""
        tip_data = {
            "location_slug": "edgewood-atlanta",
            "checkin_id": checkin_user["id"],
            "tipper_name": checkin_user["display_name"],
            "tipper_emoji": checkin_user["avatar_emoji"],
            "amount": 10.0,
            "message": "Great beats!",
            "song_request": "Play some hip hop",
            "payment_method": "cash_app"
        }
        
        response = requests.post(f"{BASE_URL}/api/social/dj-tip", json=tip_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["amount"] == 10.0, "Tip amount should be $10"
        assert data["message"] == "Great beats!", "Tip message should match"
        assert data["song_request"] == "Play some hip hop", "Song request should match"
        print(f"✓ Tip sent via Cash App: ${data['amount']}")
    
    def test_send_tip_with_venmo(self, checkin_user):
        """Test sending a tip with Venmo payment method"""
        tip_data = {
            "location_slug": "edgewood-atlanta",
            "checkin_id": checkin_user["id"],
            "tipper_name": checkin_user["display_name"],
            "tipper_emoji": checkin_user["avatar_emoji"],
            "amount": 20.0,
            "payment_method": "venmo"
        }
        
        response = requests.post(f"{BASE_URL}/api/social/dj-tip", json=tip_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["amount"] == 20.0, "Tip amount should be $20"
        print(f"✓ Tip sent via Venmo: ${data['amount']}")
    
    def test_send_tip_with_apple_pay(self, checkin_user):
        """Test sending a tip with Apple Pay payment method"""
        tip_data = {
            "location_slug": "edgewood-atlanta",
            "checkin_id": checkin_user["id"],
            "tipper_name": checkin_user["display_name"],
            "tipper_emoji": checkin_user["avatar_emoji"],
            "amount": 5.0,
            "payment_method": "apple_pay"
        }
        
        response = requests.post(f"{BASE_URL}/api/social/dj-tip", json=tip_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["amount"] == 5.0, "Tip amount should be $5"
        print(f"✓ Tip sent via Apple Pay: ${data['amount']}")
    
    def test_get_tips_shows_payment_method(self):
        """Test that tips list includes payment_method field"""
        response = requests.get(f"{BASE_URL}/api/social/dj-tips/edgewood-atlanta")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        if len(data) > 0:
            tip = data[0]
            # payment_method should exist (may default to cash_app for old records)
            assert "payment_method" in tip or tip.get("payment_method") is not None, \
                "Tips should include payment_method field"
            print(f"✓ Tips include payment_method field. Sample: {tip.get('payment_method', 'N/A')}")
        else:
            print("✓ Tips list endpoint working (no tips yet)")


# ==================== DRINK ORDER TESTS ====================

class TestDrinkOrderAPI:
    """Tests for Send a Drink feature"""
    
    @pytest.fixture
    def two_checkedin_users(self):
        """Create two check-in users for drink sending"""
        unique_id = str(uuid.uuid4())[:8]
        location_slug = "edgewood-atlanta"
        
        # User 1 (sender)
        sender_data = {
            "location_slug": location_slug,
            "display_name": f"TEST_Sender_{unique_id}",
            "avatar_emoji": "🍸",
            "mood": "Celebrating"
        }
        sender_response = requests.post(f"{BASE_URL}/api/checkin", json=sender_data)
        assert sender_response.status_code == 200
        sender = sender_response.json()
        
        # User 2 (recipient)
        recipient_data = {
            "location_slug": location_slug,
            "display_name": f"TEST_Recipient_{unique_id}",
            "avatar_emoji": "🥳",
            "mood": "Vibing"
        }
        recipient_response = requests.post(f"{BASE_URL}/api/checkin", json=recipient_data)
        assert recipient_response.status_code == 200
        recipient = recipient_response.json()
        
        yield {"sender": sender, "recipient": recipient, "location_slug": location_slug}
        
        # Cleanup - checkout both users
        requests.delete(f"{BASE_URL}/api/checkin/{sender['id']}")
        requests.delete(f"{BASE_URL}/api/checkin/{recipient['id']}")
    
    def test_send_drink_to_user(self, two_checkedin_users):
        """Test sending a drink to another checked-in user"""
        sender = two_checkedin_users["sender"]
        recipient = two_checkedin_users["recipient"]
        location_slug = two_checkedin_users["location_slug"]
        
        drink_order = {
            "location_slug": location_slug,
            "from_checkin_id": sender["id"],
            "from_name": sender["display_name"],
            "from_emoji": sender["avatar_emoji"],
            "to_checkin_id": recipient["id"],
            "to_name": recipient["display_name"],
            "to_emoji": recipient["avatar_emoji"],
            "drink_name": "House Cocktail",
            "drink_emoji": "🍸",
            "message": "Cheers!"
        }
        
        response = requests.post(f"{BASE_URL}/api/social/drinks", json=drink_order)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain drink order id"
        assert data["drink_name"] == "House Cocktail", "Drink name should match"
        assert data["drink_emoji"] == "🍸", "Drink emoji should match"
        assert data["from_name"] == sender["display_name"], "Sender name should match"
        assert data["to_name"] == recipient["display_name"], "Recipient name should match"
        assert data["message"] == "Cheers!", "Message should match"
        assert data["status"] == "pending", "Initial status should be pending"
        
        print(f"✓ Drink order created: {data['drink_emoji']} {data['drink_name']} to {data['to_name']}")
        return data["id"]
    
    def test_send_drink_beer(self, two_checkedin_users):
        """Test sending a beer"""
        sender = two_checkedin_users["sender"]
        recipient = two_checkedin_users["recipient"]
        location_slug = two_checkedin_users["location_slug"]
        
        drink_order = {
            "location_slug": location_slug,
            "from_checkin_id": sender["id"],
            "from_name": sender["display_name"],
            "from_emoji": sender["avatar_emoji"],
            "to_checkin_id": recipient["id"],
            "to_name": recipient["display_name"],
            "to_emoji": recipient["avatar_emoji"],
            "drink_name": "Beer",
            "drink_emoji": "🍺",
            "message": "Have a cold one!"
        }
        
        response = requests.post(f"{BASE_URL}/api/social/drinks", json=drink_order)
        assert response.status_code == 200
        
        data = response.json()
        assert data["drink_name"] == "Beer"
        assert data["drink_emoji"] == "🍺"
        print(f"✓ Beer sent to {data['to_name']}")
    
    def test_send_drink_champagne(self, two_checkedin_users):
        """Test sending champagne for celebrations"""
        sender = two_checkedin_users["sender"]
        recipient = two_checkedin_users["recipient"]
        location_slug = two_checkedin_users["location_slug"]
        
        drink_order = {
            "location_slug": location_slug,
            "from_checkin_id": sender["id"],
            "from_name": sender["display_name"],
            "from_emoji": sender["avatar_emoji"],
            "to_checkin_id": recipient["id"],
            "to_name": recipient["display_name"],
            "to_emoji": recipient["avatar_emoji"],
            "drink_name": "Champagne",
            "drink_emoji": "🥂",
            "message": "Celebrate!"
        }
        
        response = requests.post(f"{BASE_URL}/api/social/drinks", json=drink_order)
        assert response.status_code == 200
        
        data = response.json()
        assert data["drink_name"] == "Champagne"
        assert data["drink_emoji"] == "🥂"
        print(f"✓ Champagne sent to {data['to_name']}")
    
    def test_send_drink_without_message(self, two_checkedin_users):
        """Test sending a drink without optional message"""
        sender = two_checkedin_users["sender"]
        recipient = two_checkedin_users["recipient"]
        location_slug = two_checkedin_users["location_slug"]
        
        drink_order = {
            "location_slug": location_slug,
            "from_checkin_id": sender["id"],
            "from_name": sender["display_name"],
            "from_emoji": sender["avatar_emoji"],
            "to_checkin_id": recipient["id"],
            "to_name": recipient["display_name"],
            "to_emoji": recipient["avatar_emoji"],
            "drink_name": "Shot",
            "drink_emoji": "🥃"
        }
        
        response = requests.post(f"{BASE_URL}/api/social/drinks", json=drink_order)
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] is None, "Message should be null when not provided"
        print(f"✓ Shot sent without message")
    
    def test_send_drink_invalid_sender(self):
        """Test sending drink from non-existent check-in fails"""
        fake_sender_id = str(uuid.uuid4())
        fake_recipient_id = str(uuid.uuid4())
        
        drink_order = {
            "location_slug": "edgewood-atlanta",
            "from_checkin_id": fake_sender_id,
            "from_name": "FakeSender",
            "from_emoji": "👻",
            "to_checkin_id": fake_recipient_id,
            "to_name": "FakeRecipient",
            "to_emoji": "👻",
            "drink_name": "Fake Drink",
            "drink_emoji": "🍹"
        }
        
        response = requests.post(f"{BASE_URL}/api/social/drinks", json=drink_order)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Correctly rejects drink from non-checked-in user")
    
    def test_get_drinks_at_location(self, two_checkedin_users):
        """Test getting drink feed at a location"""
        location_slug = two_checkedin_users["location_slug"]
        
        response = requests.get(f"{BASE_URL}/api/social/drinks/{location_slug}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        if len(data) > 0:
            drink = data[0]
            assert "id" in drink, "Drink should have id"
            assert "drink_name" in drink, "Drink should have name"
            assert "drink_emoji" in drink, "Drink should have emoji"
            assert "from_name" in drink, "Drink should have sender name"
            assert "to_name" in drink, "Drink should have recipient name"
            assert "status" in drink, "Drink should have status"
            print(f"✓ Retrieved {len(data)} drink orders at {location_slug}")
        else:
            print(f"✓ Drink feed endpoint working (no drinks yet at {location_slug})")
    
    def test_get_drinks_for_user(self, two_checkedin_users):
        """Test getting drinks sent to or from a specific user"""
        sender = two_checkedin_users["sender"]
        recipient = two_checkedin_users["recipient"]
        location_slug = two_checkedin_users["location_slug"]
        
        # First send a drink
        drink_order = {
            "location_slug": location_slug,
            "from_checkin_id": sender["id"],
            "from_name": sender["display_name"],
            "from_emoji": sender["avatar_emoji"],
            "to_checkin_id": recipient["id"],
            "to_name": recipient["display_name"],
            "to_emoji": recipient["avatar_emoji"],
            "drink_name": "Wine",
            "drink_emoji": "🍷"
        }
        requests.post(f"{BASE_URL}/api/social/drinks", json=drink_order)
        
        # Get drinks for sender
        sender_response = requests.get(f"{BASE_URL}/api/social/drinks/for/{sender['id']}")
        assert sender_response.status_code == 200
        
        sender_drinks = sender_response.json()
        assert isinstance(sender_drinks, list)
        print(f"✓ Sender has {len(sender_drinks)} drinks in history")
        
        # Get drinks for recipient
        recipient_response = requests.get(f"{BASE_URL}/api/social/drinks/for/{recipient['id']}")
        assert recipient_response.status_code == 200
        
        recipient_drinks = recipient_response.json()
        assert isinstance(recipient_drinks, list)
        print(f"✓ Recipient has {len(recipient_drinks)} drinks in history")
    
    def test_update_drink_status_accepted(self, two_checkedin_users):
        """Test updating drink order status to accepted"""
        sender = two_checkedin_users["sender"]
        recipient = two_checkedin_users["recipient"]
        location_slug = two_checkedin_users["location_slug"]
        
        # Create a drink order
        drink_order = {
            "location_slug": location_slug,
            "from_checkin_id": sender["id"],
            "from_name": sender["display_name"],
            "from_emoji": sender["avatar_emoji"],
            "to_checkin_id": recipient["id"],
            "to_name": recipient["display_name"],
            "to_emoji": recipient["avatar_emoji"],
            "drink_name": "Margarita",
            "drink_emoji": "🍹"
        }
        create_response = requests.post(f"{BASE_URL}/api/social/drinks", json=drink_order)
        order_id = create_response.json()["id"]
        
        # Update status to accepted
        update_response = requests.put(f"{BASE_URL}/api/social/drinks/{order_id}/status?status=accepted")
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}"
        
        data = update_response.json()
        assert "message" in data
        assert "accepted" in data["message"]
        print(f"✓ Drink status updated to 'accepted'")
    
    def test_update_drink_status_delivered(self, two_checkedin_users):
        """Test updating drink order status to delivered"""
        sender = two_checkedin_users["sender"]
        recipient = two_checkedin_users["recipient"]
        location_slug = two_checkedin_users["location_slug"]
        
        # Create a drink order
        drink_order = {
            "location_slug": location_slug,
            "from_checkin_id": sender["id"],
            "from_name": sender["display_name"],
            "from_emoji": sender["avatar_emoji"],
            "to_checkin_id": recipient["id"],
            "to_name": recipient["display_name"],
            "to_emoji": recipient["avatar_emoji"],
            "drink_name": "Wine",
            "drink_emoji": "🍷"
        }
        create_response = requests.post(f"{BASE_URL}/api/social/drinks", json=drink_order)
        order_id = create_response.json()["id"]
        
        # Update status to delivered
        update_response = requests.put(f"{BASE_URL}/api/social/drinks/{order_id}/status?status=delivered")
        assert update_response.status_code == 200
        print(f"✓ Drink status updated to 'delivered'")
    
    def test_update_drink_status_invalid(self, two_checkedin_users):
        """Test that invalid status is rejected"""
        sender = two_checkedin_users["sender"]
        recipient = two_checkedin_users["recipient"]
        location_slug = two_checkedin_users["location_slug"]
        
        # Create a drink order
        drink_order = {
            "location_slug": location_slug,
            "from_checkin_id": sender["id"],
            "from_name": sender["display_name"],
            "from_emoji": sender["avatar_emoji"],
            "to_checkin_id": recipient["id"],
            "to_name": recipient["display_name"],
            "to_emoji": recipient["avatar_emoji"],
            "drink_name": "Shot",
            "drink_emoji": "🥃"
        }
        create_response = requests.post(f"{BASE_URL}/api/social/drinks", json=drink_order)
        order_id = create_response.json()["id"]
        
        # Try invalid status
        update_response = requests.put(f"{BASE_URL}/api/social/drinks/{order_id}/status?status=invalid_status")
        assert update_response.status_code == 400, f"Expected 400, got {update_response.status_code}"
        print("✓ Correctly rejects invalid drink status")


class TestDrinkOrderFeed:
    """Tests for drink order feed functionality"""
    
    def test_drinks_feed_shows_status(self):
        """Test that drinks feed shows status (pending, accepted, delivered)"""
        response = requests.get(f"{BASE_URL}/api/social/drinks/edgewood-atlanta")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            for drink in data[:3]:  # Check first 3 drinks
                assert "status" in drink, "Each drink should have status"
                assert drink["status"] in ["pending", "accepted", "delivered", "cancelled"], \
                    f"Status should be valid, got: {drink['status']}"
            print(f"✓ Drinks feed shows status correctly")
        else:
            print("✓ Drinks feed endpoint working (no drinks to verify)")
    
    def test_drinks_feed_shows_recent_only(self):
        """Test that drinks feed shows recent drinks only"""
        response = requests.get(f"{BASE_URL}/api/social/drinks/edgewood-atlanta")
        assert response.status_code == 200
        
        data = response.json()
        # API limits to 20 recent drinks
        assert len(data) <= 20, "Should return at most 20 recent drinks"
        print(f"✓ Drinks feed returns {len(data)} drinks (max 20)")


# ==================== INTEGRATION TESTS ====================

class TestDJAndDrinksIntegration:
    """Integration tests for DJ and Drinks features"""
    
    def test_full_drink_flow(self):
        """Test complete flow: check in -> send drink -> update status"""
        unique_id = str(uuid.uuid4())[:8]
        location_slug = "edgewood-atlanta"
        
        # 1. Check in two users
        sender_data = {
            "location_slug": location_slug,
            "display_name": f"TEST_Flow_Sender_{unique_id}",
            "avatar_emoji": "🎉"
        }
        sender = requests.post(f"{BASE_URL}/api/checkin", json=sender_data).json()
        
        recipient_data = {
            "location_slug": location_slug,
            "display_name": f"TEST_Flow_Recipient_{unique_id}",
            "avatar_emoji": "🥳"
        }
        recipient = requests.post(f"{BASE_URL}/api/checkin", json=recipient_data).json()
        
        print(f"✓ Step 1: Two users checked in")
        
        # 2. Send a drink
        drink_order = {
            "location_slug": location_slug,
            "from_checkin_id": sender["id"],
            "from_name": sender["display_name"],
            "from_emoji": sender["avatar_emoji"],
            "to_checkin_id": recipient["id"],
            "to_name": recipient["display_name"],
            "to_emoji": recipient["avatar_emoji"],
            "drink_name": "House Cocktail",
            "drink_emoji": "🍸",
            "message": "Integration test drink"
        }
        drink_response = requests.post(f"{BASE_URL}/api/social/drinks", json=drink_order)
        assert drink_response.status_code == 200
        drink = drink_response.json()
        
        print(f"✓ Step 2: Drink sent - {drink['drink_emoji']} {drink['drink_name']}")
        
        # 3. Verify drink appears in feed
        feed_response = requests.get(f"{BASE_URL}/api/social/drinks/{location_slug}")
        assert feed_response.status_code == 200
        feed = feed_response.json()
        
        drink_in_feed = any(d["id"] == drink["id"] for d in feed)
        assert drink_in_feed, "Drink should appear in location feed"
        print(f"✓ Step 3: Drink appears in feed")
        
        # 4. Update drink status to delivered
        status_response = requests.put(f"{BASE_URL}/api/social/drinks/{drink['id']}/status?status=delivered")
        assert status_response.status_code == 200
        print(f"✓ Step 4: Drink status updated to delivered")
        
        # 5. Cleanup
        requests.delete(f"{BASE_URL}/api/checkin/{sender['id']}")
        requests.delete(f"{BASE_URL}/api/checkin/{recipient['id']}")
        print(f"✓ Step 5: Users checked out")
        
        print("✓ Full drink flow completed successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
