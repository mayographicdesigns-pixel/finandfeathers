"""
Test User Profile and F&F Token APIs
Tests for My Account feature including:
- User profile CRUD operations
- Token purchase ($1 = 10 tokens)
- Token balance and history
- Admin token gifting
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')


class TestUserProfile:
    """User Profile API Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test - get auth token"""
        # Login as admin for protected endpoints
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        if response.status_code == 200:
            self.admin_token = response.json().get("access_token")
        else:
            self.admin_token = None
    
    def test_create_user_profile(self):
        """Test creating a new user profile"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "name": "TEST_User",
            "phone": "1234567890",
            "email": unique_email,
            "avatar_emoji": "😊"
        }
        
        response = requests.post(f"{BASE_URL}/api/user/profile", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "id" in data
        assert data["name"] == payload["name"]
        assert data["email"] == unique_email
        assert data["avatar_emoji"] == "😊"
        assert data["token_balance"] == 0  # New users start with 0 tokens
        assert data["total_visits"] == 0
        assert data["total_posts"] == 0
        
        # Store for later tests
        self.__class__.created_user_id = data["id"]
        print(f"Created user profile: {data['id']}")
    
    def test_get_user_profile_by_id(self):
        """Test getting user profile by ID"""
        # First create a profile
        unique_email = f"test_get_{uuid.uuid4().hex[:8]}@example.com"
        create_response = requests.post(f"{BASE_URL}/api/user/profile", json={
            "name": "TEST_GetProfile",
            "email": unique_email,
            "avatar_emoji": "🎉"
        })
        assert create_response.status_code == 200
        user_id = create_response.json()["id"]
        
        # Now get the profile
        response = requests.get(f"{BASE_URL}/api/user/profile/{user_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user_id
        assert data["name"] == "TEST_GetProfile"
        assert data["email"] == unique_email
        print(f"Successfully retrieved profile: {user_id}")
    
    def test_get_user_profile_by_email(self):
        """Test getting user profile by email"""
        unique_email = f"test_email_{uuid.uuid4().hex[:8]}@example.com"
        
        # Create profile
        create_response = requests.post(f"{BASE_URL}/api/user/profile", json={
            "name": "TEST_EmailLookup",
            "email": unique_email
        })
        assert create_response.status_code == 200
        
        # Get by email
        response = requests.get(f"{BASE_URL}/api/user/profile/by-email/{unique_email}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == unique_email
        assert data["name"] == "TEST_EmailLookup"
        print(f"Found profile by email: {unique_email}")
    
    def test_update_user_profile(self):
        """Test updating user profile with special dates and social handles"""
        # Create profile
        unique_email = f"test_update_{uuid.uuid4().hex[:8]}@example.com"
        create_response = requests.post(f"{BASE_URL}/api/user/profile", json={
            "name": "TEST_UpdateProfile",
            "email": unique_email
        })
        assert create_response.status_code == 200
        user_id = create_response.json()["id"]
        
        # Update with birthdate, anniversary, social handles
        update_payload = {
            "name": "TEST_UpdatedName",
            "birthdate": "1990-05-15",
            "anniversary": "2015-06-20",
            "instagram_handle": "@test_user",
            "facebook_handle": "test.user",
            "twitter_handle": "@test_user",
            "tiktok_handle": "@test_tiktok"
        }
        
        response = requests.put(f"{BASE_URL}/api/user/profile/{user_id}", json=update_payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_UpdatedName"
        assert data["birthdate"] == "1990-05-15"
        assert data["anniversary"] == "2015-06-20"
        assert data["instagram_handle"] == "@test_user"
        assert data["facebook_handle"] == "test.user"
        print(f"Updated profile: {user_id}")
        
        # Verify GET returns updated data
        get_response = requests.get(f"{BASE_URL}/api/user/profile/{user_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["birthdate"] == "1990-05-15"
        assert fetched["instagram_handle"] == "@test_user"
    
    def test_user_profile_not_found(self):
        """Test 404 for non-existent user"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/user/profile/{fake_id}")
        
        assert response.status_code == 404
        print(f"Correctly returned 404 for non-existent user")


class TestTokenPurchase:
    """F&F Token Purchase Tests"""
    
    def test_purchase_tokens(self):
        """Test purchasing tokens - $1 = 10 tokens"""
        # Create user first
        unique_email = f"test_tokens_{uuid.uuid4().hex[:8]}@example.com"
        create_response = requests.post(f"{BASE_URL}/api/user/profile", json={
            "name": "TEST_TokenBuyer",
            "email": unique_email
        })
        assert create_response.status_code == 200
        user_id = create_response.json()["id"]
        
        # Purchase $5 worth of tokens (should get 50 tokens)
        purchase_response = requests.post(f"{BASE_URL}/api/user/tokens/purchase/{user_id}", json={
            "amount_usd": 5
        })
        
        assert purchase_response.status_code == 200
        data = purchase_response.json()
        assert "purchase" in data
        assert data["purchase"]["tokens_purchased"] == 50  # $5 * 10 = 50 tokens
        assert data["purchase"]["amount_usd"] == 5
        assert data["purchase"]["payment_method"] == "card"
        assert data["new_balance"] == 50
        print(f"Purchased 50 tokens for $5, new balance: {data['new_balance']}")
        
        # Verify balance via GET
        balance_response = requests.get(f"{BASE_URL}/api/user/tokens/balance/{user_id}")
        assert balance_response.status_code == 200
        assert balance_response.json()["token_balance"] == 50
    
    def test_purchase_minimum_amount(self):
        """Test minimum purchase amount is $1"""
        # Create user
        unique_email = f"test_min_{uuid.uuid4().hex[:8]}@example.com"
        create_response = requests.post(f"{BASE_URL}/api/user/profile", json={
            "name": "TEST_MinPurchase",
            "email": unique_email
        })
        user_id = create_response.json()["id"]
        
        # Try to purchase less than $1
        response = requests.post(f"{BASE_URL}/api/user/tokens/purchase/{user_id}", json={
            "amount_usd": 0.5
        })
        
        assert response.status_code == 400
        print("Correctly rejected purchase below $1 minimum")
    
    def test_token_history(self):
        """Test getting token purchase history"""
        # Create user and make purchases
        unique_email = f"test_history_{uuid.uuid4().hex[:8]}@example.com"
        create_response = requests.post(f"{BASE_URL}/api/user/profile", json={
            "name": "TEST_TokenHistory",
            "email": unique_email
        })
        user_id = create_response.json()["id"]
        
        # Make multiple purchases
        requests.post(f"{BASE_URL}/api/user/tokens/purchase/{user_id}", json={"amount_usd": 1})
        requests.post(f"{BASE_URL}/api/user/tokens/purchase/{user_id}", json={"amount_usd": 5})
        
        # Get history
        response = requests.get(f"{BASE_URL}/api/user/tokens/history/{user_id}")
        
        assert response.status_code == 200
        history = response.json()
        assert len(history) >= 2
        assert history[0]["tokens_purchased"] == 50  # Most recent first
        assert history[1]["tokens_purchased"] == 10
        print(f"Token history has {len(history)} records")


class TestAdminTokenGifting:
    """Admin Token Gifting Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test - get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        assert response.status_code == 200, "Admin login failed"
        self.admin_token = response.json().get("access_token")
    
    def test_admin_gift_tokens(self):
        """Test admin can gift tokens to users"""
        # Create user first
        unique_email = f"test_gift_{uuid.uuid4().hex[:8]}@example.com"
        create_response = requests.post(f"{BASE_URL}/api/user/profile", json={
            "name": "TEST_GiftRecipient",
            "email": unique_email
        })
        assert create_response.status_code == 200
        user_id = create_response.json()["id"]
        
        # Admin gifts 100 tokens
        gift_payload = {
            "user_id": user_id,
            "tokens": 100,
            "message": "Welcome gift!"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/tokens/gift",
            json=gift_payload,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["gift"]["tokens_purchased"] == 100
        assert data["gift"]["payment_method"] == "gift"
        assert data["gift"]["gifted_by"] == "admin"
        assert data["new_balance"] == 100
        print(f"Admin gifted 100 tokens, new balance: {data['new_balance']}")
        
        # Verify in history
        history_response = requests.get(f"{BASE_URL}/api/user/tokens/history/{user_id}")
        assert history_response.status_code == 200
        history = history_response.json()
        assert any(h["payment_method"] == "gift" for h in history)
    
    def test_admin_gift_requires_auth(self):
        """Test token gifting requires admin auth"""
        response = requests.post(f"{BASE_URL}/api/admin/tokens/gift", json={
            "user_id": "fake-id",
            "tokens": 50
        })
        
        assert response.status_code in [401, 403]
        print("Token gifting correctly requires authentication")
    
    def test_admin_get_all_users(self):
        """Test admin can get all user profiles"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)
        print(f"Admin retrieved {len(users)} user profiles")


class TestGallerySubmission:
    """User Gallery Submission Tests (auto-approved)"""
    
    def test_submit_photo_to_gallery(self):
        """Test user can submit photo to gallery (auto-approved)"""
        # Create user
        unique_email = f"test_gallery_{uuid.uuid4().hex[:8]}@example.com"
        create_response = requests.post(f"{BASE_URL}/api/user/profile", json={
            "name": "TEST_GalleryUser",
            "email": unique_email
        })
        user_id = create_response.json()["id"]
        
        # Submit photo
        submission_payload = {
            "image_url": "https://example.com/test-photo.jpg",
            "caption": "My dinner at F&F!",
            "location_slug": "edgewood-atlanta"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/user/gallery/submit/{user_id}",
            json=submission_payload
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["image_url"] == submission_payload["image_url"]
        assert data["caption"] == submission_payload["caption"]
        assert data["user_id"] == user_id
        print(f"Photo submitted to gallery: {data['id']}")
    
    def test_get_user_submissions(self):
        """Test getting user's gallery submissions"""
        # Create user and submit photo
        unique_email = f"test_submissions_{uuid.uuid4().hex[:8]}@example.com"
        create_response = requests.post(f"{BASE_URL}/api/user/profile", json={
            "name": "TEST_Submissions",
            "email": unique_email
        })
        user_id = create_response.json()["id"]
        
        # Submit a photo
        requests.post(f"{BASE_URL}/api/user/gallery/submit/{user_id}", json={
            "image_url": "https://example.com/my-photo.jpg",
            "caption": "Test submission"
        })
        
        # Get submissions
        response = requests.get(f"{BASE_URL}/api/user/gallery/submissions/{user_id}")
        
        assert response.status_code == 200
        submissions = response.json()
        assert len(submissions) >= 1
        assert submissions[0]["caption"] == "Test submission"
        print(f"User has {len(submissions)} gallery submissions")


class TestUserHistory:
    """User History APIs Tests"""
    
    def test_get_user_visits(self):
        """Test getting user visit history"""
        # Create user
        unique_email = f"test_visits_{uuid.uuid4().hex[:8]}@example.com"
        create_response = requests.post(f"{BASE_URL}/api/user/profile", json={
            "name": "TEST_Visits",
            "email": unique_email
        })
        user_id = create_response.json()["id"]
        
        response = requests.get(f"{BASE_URL}/api/user/history/visits/{user_id}")
        
        assert response.status_code == 200
        visits = response.json()
        assert isinstance(visits, list)
        print(f"User has {len(visits)} visit records")
    
    def test_get_user_posts(self):
        """Test getting user post history"""
        # Create user
        unique_email = f"test_posts_{uuid.uuid4().hex[:8]}@example.com"
        create_response = requests.post(f"{BASE_URL}/api/user/profile", json={
            "name": "TEST_Posts",
            "email": unique_email
        })
        user_id = create_response.json()["id"]
        
        response = requests.get(f"{BASE_URL}/api/user/history/posts/{user_id}")
        
        assert response.status_code == 200
        posts = response.json()
        assert isinstance(posts, list)
        print(f"User has {len(posts)} post records")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
