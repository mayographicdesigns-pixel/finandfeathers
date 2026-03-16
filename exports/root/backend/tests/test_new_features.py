"""
Backend tests for new features:
1. GET /api/merchandise - WooCommerce product fetch
2. GET /api/promo-videos - Promo videos for carousel
3. Admin promo video CRUD operations
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')

# Module: Authentication
def get_admin_token():
    """Get admin auth token for protected endpoints"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": "admin", "password": "admin"}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    return None


class TestMerchandiseEndpoints:
    """Tests for WooCommerce merchandise integration"""
    
    def test_get_merchandise_success(self):
        """GET /api/merchandise should return products from WooCommerce"""
        response = requests.get(f"{BASE_URL}/api/merchandise")
        print(f"Merchandise response status: {response.status_code}")
        
        # Check that the endpoint doesn't error out
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Should return a list of products"
        print(f"Got {len(data)} products from WooCommerce")
        
        # If products exist, validate structure
        if len(data) > 0:
            product = data[0]
            # Validate required fields
            assert "id" in product, "Product should have id"
            assert "name" in product, "Product should have name"
            assert "price" in product, "Product should have price"
            assert "permalink" in product, "Product should have permalink"
            assert "image" in product, "Product should have image"
            print(f"First product: {product.get('name')} - ${product.get('price')}")
    
    def test_merchandise_product_structure(self):
        """Verify product data structure matches frontend expectations"""
        response = requests.get(f"{BASE_URL}/api/merchandise")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            product = data[0]
            expected_fields = ['id', 'name', 'price', 'regular_price', 'sale_price', 
                             'description', 'image', 'permalink', 'in_stock', 'categories']
            for field in expected_fields:
                assert field in product, f"Product missing field: {field}"
            
            # Verify categories is a list
            assert isinstance(product.get('categories', []), list), "Categories should be a list"
            print(f"Product structure validated with {len(expected_fields)} fields")


class TestPromoVideosPublic:
    """Tests for public promo video endpoints"""
    
    def test_get_all_promo_videos(self):
        """GET /api/promo-videos should return all active videos"""
        response = requests.get(f"{BASE_URL}/api/promo-videos")
        print(f"Promo videos response status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Should return a list of videos"
        print(f"Got {len(data)} promo videos")
        
        # Validate video structure if any exist
        if len(data) > 0:
            video = data[0]
            assert "id" in video, "Video should have id"
            assert "title" in video, "Video should have title"
            assert "url" in video, "Video should have url"
            print(f"First video: {video.get('title')} - {video.get('url')[:50]}...")
    
    def test_get_promo_videos_by_day(self):
        """GET /api/promo-videos/by-day/{day} should return day-specific videos"""
        # Test for Monday (day 1)
        response = requests.get(f"{BASE_URL}/api/promo-videos/by-day/1")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Got {len(data)} videos for Monday")
        
        # Test for Saturday (day 6)
        response = requests.get(f"{BASE_URL}/api/promo-videos/by-day/6")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Got {len(data)} videos for Saturday")
    
    def test_promo_video_structure(self):
        """Verify video data structure"""
        response = requests.get(f"{BASE_URL}/api/promo-videos")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            video = data[0]
            expected_fields = ['id', 'title', 'url', 'day_of_week', 'is_common', 
                             'display_order', 'is_active', 'created_at']
            for field in expected_fields:
                assert field in video, f"Video missing field: {field}"
            print(f"Video structure validated")


class TestAdminPromoVideos:
    """Tests for admin promo video endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        self.token = get_admin_token()
        self.headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
    
    def test_admin_get_all_promo_videos(self):
        """GET /api/admin/promo-videos should return all videos for admin"""
        if not self.token:
            pytest.skip("Could not get admin token")
        
        response = requests.get(
            f"{BASE_URL}/api/admin/promo-videos",
            headers=self.headers
        )
        print(f"Admin promo videos status: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Admin sees {len(data)} total videos (including inactive)")
    
    def test_admin_seed_promo_videos(self):
        """POST /api/admin/promo-videos/seed should seed videos if DB is empty"""
        if not self.token:
            pytest.skip("Could not get admin token")
        
        response = requests.post(
            f"{BASE_URL}/api/admin/promo-videos/seed",
            headers=self.headers
        )
        print(f"Seed videos response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"Seed result: {data.get('message')}")
    
    def test_admin_create_promo_video(self):
        """POST /api/admin/promo-videos should create a new video"""
        if not self.token:
            pytest.skip("Could not get admin token")
        
        test_video = {
            "title": "TEST_Video",
            "url": "https://example.com/test-video.mp4",
            "day_of_week": 3,  # Wednesday
            "is_common": False,
            "display_order": 99
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/promo-videos",
            headers=self.headers,
            json=test_video
        )
        print(f"Create video response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"Created video with id: {data.get('id')}")
        
        # Store the ID for cleanup
        self.created_video_id = data.get('id')
    
    def test_admin_promo_videos_requires_auth(self):
        """Admin endpoints should require authentication"""
        # Without token
        response = requests.get(f"{BASE_URL}/api/admin/promo-videos")
        assert response.status_code in [401, 403], "Should require auth"
        print("Admin promo-videos correctly requires authentication")


class TestAdminVideosIntegration:
    """End-to-end test for admin videos CRUD"""
    
    def test_video_crud_flow(self):
        """Test complete CRUD flow for promo videos"""
        token = get_admin_token()
        if not token:
            pytest.skip("Could not get admin token")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # 1. CREATE
        test_video = {
            "title": "TEST_Integration_Video",
            "url": "https://example.com/integration-test.mp4",
            "day_of_week": 0,  # Sunday
            "is_common": False,
            "display_order": 100
        }
        
        create_resp = requests.post(
            f"{BASE_URL}/api/admin/promo-videos",
            headers=headers,
            json=test_video
        )
        assert create_resp.status_code == 200
        video_id = create_resp.json().get('id')
        print(f"Created test video: {video_id}")
        
        # 2. READ - verify created
        read_resp = requests.get(
            f"{BASE_URL}/api/admin/promo-videos",
            headers=headers
        )
        assert read_resp.status_code == 200
        videos = read_resp.json()
        created_video = next((v for v in videos if v.get('id') == video_id), None)
        assert created_video is not None, "Should find created video"
        assert created_video.get('title') == "TEST_Integration_Video"
        print("Verified video was created")
        
        # 3. UPDATE
        update_resp = requests.put(
            f"{BASE_URL}/api/admin/promo-videos/{video_id}",
            headers=headers,
            json={"title": "TEST_Updated_Video", "is_active": False}
        )
        assert update_resp.status_code == 200
        print("Updated video successfully")
        
        # 4. DELETE
        delete_resp = requests.delete(
            f"{BASE_URL}/api/admin/promo-videos/{video_id}",
            headers=headers
        )
        assert delete_resp.status_code == 200
        print("Deleted test video")
        
        # Verify deletion
        read_resp2 = requests.get(
            f"{BASE_URL}/api/admin/promo-videos",
            headers=headers
        )
        videos_after = read_resp2.json()
        deleted_video = next((v for v in videos_after if v.get('id') == video_id), None)
        assert deleted_video is None, "Video should be deleted"
        print("CRUD flow completed successfully!")


class TestHealthAndAPIAccess:
    """Basic health and API access tests"""
    
    def test_api_root(self):
        """GET /api/ should return API status"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print("API root accessible")
    
    def test_admin_login(self):
        """POST /api/auth/login should work with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "admin", "password": "admin"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        print("Admin login successful")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
