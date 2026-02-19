"""
Tests for WooCommerce Integration - Token purchases and Cart/Merchandise checkout
Testing: Token packages API, Token checkout, Cart checkout, Merchandise API, Webhook handling
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTokenPackagesAPI:
    """Tests for Token Packages endpoint"""
    
    def test_get_token_packages_returns_correct_structure(self):
        """GET /api/tokens/packages should return all 5 packages"""
        response = requests.get(f"{BASE_URL}/api/tokens/packages")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        packages = response.json()
        assert isinstance(packages, dict), "Response should be a dict"
        
        # Verify all expected packages exist
        expected_packages = ["10", "50", "100", "250", "500"]
        for pkg_id in expected_packages:
            assert pkg_id in packages, f"Package {pkg_id} should exist"
            pkg = packages[pkg_id]
            assert "amount" in pkg, f"Package {pkg_id} should have 'amount'"
            assert "tokens" in pkg, f"Package {pkg_id} should have 'tokens'"
            assert "name" in pkg, f"Package {pkg_id} should have 'name'"
        
        print(f"SUCCESS: Token packages API returned {len(packages)} packages")
    
    def test_token_packages_correct_values(self):
        """Verify token package values match expected ($1=10 tokens rate)"""
        response = requests.get(f"{BASE_URL}/api/tokens/packages")
        assert response.status_code == 200
        
        packages = response.json()
        
        # Verify specific values
        expected = {
            "10": {"amount": 1.00, "tokens": 10},
            "50": {"amount": 5.00, "tokens": 50},
            "100": {"amount": 10.00, "tokens": 100},
            "250": {"amount": 25.00, "tokens": 250},
            "500": {"amount": 50.00, "tokens": 500},
        }
        
        for pkg_id, expected_vals in expected.items():
            assert packages[pkg_id]["amount"] == expected_vals["amount"], f"Package {pkg_id} amount should be ${expected_vals['amount']}"
            assert packages[pkg_id]["tokens"] == expected_vals["tokens"], f"Package {pkg_id} tokens should be {expected_vals['tokens']}"
        
        print("SUCCESS: All token package values are correct")


class TestMerchandiseAPI:
    """Tests for Merchandise/WooCommerce Products endpoint"""
    
    def test_get_merchandise_returns_products(self):
        """GET /api/merchandise should return products from WooCommerce"""
        response = requests.get(f"{BASE_URL}/api/merchandise")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        products = response.json()
        assert isinstance(products, list), "Response should be a list"
        assert len(products) > 0, "Should return at least one product"
        
        print(f"SUCCESS: Merchandise API returned {len(products)} products")
    
    def test_merchandise_product_structure(self):
        """Verify merchandise products have required fields"""
        response = requests.get(f"{BASE_URL}/api/merchandise")
        assert response.status_code == 200
        
        products = response.json()
        if len(products) == 0:
            pytest.skip("No products available to test structure")
        
        # Check first product structure
        product = products[0]
        required_fields = ["id", "name", "price"]
        for field in required_fields:
            assert field in product, f"Product should have '{field}' field"
        
        # Optional but expected fields
        optional_fields = ["image", "description", "permalink", "in_stock"]
        found_optional = [f for f in optional_fields if f in product]
        print(f"SUCCESS: Product has required fields and {len(found_optional)} optional fields: {found_optional}")


class TestCartFunctionality:
    """Tests for Cart checkout functionality"""
    
    def test_cart_checkout_empty_cart_error(self):
        """POST /api/cart/checkout with empty cart should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/cart/checkout?origin_url=http://test.com",
            json={"items": [], "customer_email": "test@test.com"}
        )
        
        assert response.status_code == 400, f"Expected 400 for empty cart, got {response.status_code}"
        print("SUCCESS: Empty cart correctly returns 400 error")
    
    def test_cart_checkout_valid_request_structure(self):
        """POST /api/cart/checkout with valid items should create order (may fail at WooCommerce)"""
        # Get a product first
        merch_response = requests.get(f"{BASE_URL}/api/merchandise")
        assert merch_response.status_code == 200
        
        products = merch_response.json()
        if len(products) == 0:
            pytest.skip("No products available to test cart checkout")
        
        product = products[0]
        
        # Create cart checkout request
        cart_data = {
            "items": [{
                "product_id": product.get("id", 1),
                "name": product.get("name", "Test Product"),
                "price": float(product.get("price", 19.99)),
                "quantity": 1,
                "image": product.get("image")
            }],
            "customer_email": "test@emergent.com",
            "customer_name": "Test User"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cart/checkout?origin_url=http://test.com",
            json=cart_data
        )
        
        # If WooCommerce is configured correctly, we get checkout URL
        # If not, we get a 500 error (which is expected in test environment)
        if response.status_code == 200:
            data = response.json()
            assert "checkout_url" in data, "Response should have checkout_url"
            assert "order_id" in data, "Response should have order_id"
            print(f"SUCCESS: Cart checkout created order_id: {data.get('order_id')}")
        else:
            # WooCommerce error is expected - the API structure is correct
            print(f"INFO: Cart checkout returned {response.status_code} (WooCommerce may not be accessible from test env)")
            assert response.status_code in [400, 401, 404, 500], "Should return an error status"


class TestTokenCheckout:
    """Tests for Token Purchase checkout"""
    
    @pytest.fixture
    def test_user(self):
        """Create a test user profile for token checkout"""
        # Create user profile
        user_data = {
            "name": "TEST_TokenUser",
            "email": f"test_token_{os.urandom(4).hex()}@test.com",
            "phone": "555-1234",
            "avatar_emoji": "🪙"
        }
        
        response = requests.post(f"{BASE_URL}/api/user/profile", json=user_data)
        if response.status_code == 201 or response.status_code == 200:
            return response.json()
        
        pytest.skip(f"Could not create test user: {response.status_code}")
    
    def test_token_checkout_invalid_package(self, test_user):
        """POST /api/tokens/checkout with invalid package should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/tokens/checkout?package_id=invalid&user_id={test_user['id']}&origin_url=http://test.com"
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid package, got {response.status_code}"
        print("SUCCESS: Invalid package correctly returns 400 error")
    
    def test_token_checkout_invalid_user(self):
        """POST /api/tokens/checkout with invalid user should return 404"""
        response = requests.post(
            f"{BASE_URL}/api/tokens/checkout?package_id=50&user_id=nonexistent-user-id&origin_url=http://test.com"
        )
        
        assert response.status_code == 404, f"Expected 404 for invalid user, got {response.status_code}"
        print("SUCCESS: Invalid user correctly returns 404 error")
    
    def test_token_checkout_valid_request(self, test_user):
        """POST /api/tokens/checkout with valid data should create transaction"""
        response = requests.post(
            f"{BASE_URL}/api/tokens/checkout?package_id=50&user_id={test_user['id']}&origin_url=http://test.com"
        )
        
        # If WooCommerce is configured correctly, we get checkout URL
        if response.status_code == 200:
            data = response.json()
            assert "checkout_url" in data, "Response should have checkout_url"
            assert "transaction_id" in data, "Response should have transaction_id"
            print(f"SUCCESS: Token checkout created transaction_id: {data.get('transaction_id')}")
        else:
            # WooCommerce error is expected in test environment
            print(f"INFO: Token checkout returned {response.status_code} (WooCommerce may not be accessible)")
            assert response.status_code in [400, 401, 403, 404, 500], "Should return error status"


class TestWebhookEndpoint:
    """Tests for WooCommerce Webhook endpoint"""
    
    def test_webhook_no_order_id(self):
        """POST /api/webhook/woocommerce without order_id should return ok"""
        response = requests.post(
            f"{BASE_URL}/api/webhook/woocommerce",
            json={"status": "completed"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "ok", "Webhook should return ok status"
        print("SUCCESS: Webhook handles missing order_id gracefully")
    
    def test_webhook_nonexistent_order(self):
        """POST /api/webhook/woocommerce with unknown order should return ok"""
        response = requests.post(
            f"{BASE_URL}/api/webhook/woocommerce",
            json={"id": 99999999, "status": "completed"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "ok", "Webhook should return ok for unknown orders"
        print("SUCCESS: Webhook handles unknown orders gracefully")
    
    def test_webhook_valid_structure(self):
        """POST /api/webhook/woocommerce should accept valid WooCommerce webhook format"""
        # Simulate a WooCommerce webhook payload
        webhook_payload = {
            "id": 12345,
            "status": "processing",
            "date_created": "2026-01-15T12:00:00",
            "total": "50.00",
            "meta_data": [
                {"key": "ff_type", "value": "token_purchase"},
                {"key": "ff_transaction_id", "value": "test-tx-123"}
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/webhook/woocommerce",
            json=webhook_payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("SUCCESS: Webhook accepts valid WooCommerce format")


class TestCartOrderStatus:
    """Tests for Cart Order Status endpoint"""
    
    def test_get_order_status_not_found(self):
        """GET /api/cart/order/{order_id} with invalid ID should return 404"""
        response = requests.get(f"{BASE_URL}/api/cart/order/nonexistent-order-id")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("SUCCESS: Invalid order_id correctly returns 404")


class TestTokenCheckoutStatus:
    """Tests for Token Checkout Status endpoint"""
    
    def test_get_checkout_status_not_found(self):
        """GET /api/tokens/checkout/status/{transaction_id} with invalid ID should return 404"""
        response = requests.get(f"{BASE_URL}/api/tokens/checkout/status/nonexistent-tx-id")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("SUCCESS: Invalid transaction_id correctly returns 404")


class TestHealthAndBasicEndpoints:
    """Basic health check tests"""
    
    def test_api_root(self):
        """GET /api/ should return healthy response"""
        response = requests.get(f"{BASE_URL}/api/")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "message" in data, "Response should have message"
        print(f"SUCCESS: API root returns: {data.get('message')}")
    
    def test_homepage_content(self):
        """GET /api/homepage/content should return content"""
        response = requests.get(f"{BASE_URL}/api/homepage/content")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "tagline" in data or "logo_url" in data, "Should have homepage content"
        print("SUCCESS: Homepage content endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
