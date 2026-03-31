"""
Test suite for Cocktails Menu feature
Tests the updated cocktail descriptions, images, and Happy Hour items
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCocktailsMenu:
    """Tests for cocktails menu items with updated descriptions and images"""
    
    def test_menu_items_endpoint_returns_200(self):
        """Test that menu items endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/menu/items?location_slug=edgewood-atlanta")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Menu items endpoint returns 200")
    
    def test_cocktails_have_card_layout(self):
        """Test that signature cocktails have layout='card'"""
        response = requests.get(f"{BASE_URL}/api/menu/items?location_slug=edgewood-atlanta")
        assert response.status_code == 200
        
        items = response.json()
        cocktails = [item for item in items if item.get('category') == 'cocktails' and item.get('name') in [
            'California Dreaming', 'Marina Del Rey', 'Melrose Ave', 'Baldwin Hills', 
            'Sunset Blvd', 'The 405', 'East LA', 'The Hollywood', 'Fin-A-Rita', 'LAX Sidecar'
        ]]
        
        for cocktail in cocktails:
            assert cocktail.get('layout') == 'card', f"{cocktail['name']} should have layout='card', got {cocktail.get('layout')}"
        
        print(f"✓ {len(cocktails)} signature cocktails have card layout")
    
    def test_the_405_has_uncle_nearest_whiskey(self):
        """Test that The 405 description contains Uncle Nearest Whiskey"""
        response = requests.get(f"{BASE_URL}/api/menu/items?location_slug=edgewood-atlanta")
        assert response.status_code == 200
        
        items = response.json()
        the_405 = next((item for item in items if item.get('name') == 'The 405' and item.get('category') == 'cocktails'), None)
        
        assert the_405 is not None, "The 405 cocktail not found"
        assert 'Uncle Nearest Whiskey' in the_405.get('description', ''), f"The 405 description should contain 'Uncle Nearest Whiskey', got: {the_405.get('description')}"
        print("✓ The 405 description contains 'Uncle Nearest Whiskey'")
    
    def test_sunset_blvd_has_hennessy(self):
        """Test that Sunset Blvd description contains Hennessy"""
        response = requests.get(f"{BASE_URL}/api/menu/items?location_slug=edgewood-atlanta")
        assert response.status_code == 200
        
        items = response.json()
        sunset = next((item for item in items if item.get('name') == 'Sunset Blvd' and item.get('category') == 'cocktails'), None)
        
        assert sunset is not None, "Sunset Blvd cocktail not found"
        assert 'Hennessy' in sunset.get('description', ''), f"Sunset Blvd description should contain 'Hennessy', got: {sunset.get('description')}"
        print("✓ Sunset Blvd description contains 'Hennessy'")
    
    def test_california_dreaming_has_malibu_rum(self):
        """Test that California Dreaming description contains Malibu Rum"""
        response = requests.get(f"{BASE_URL}/api/menu/items?location_slug=edgewood-atlanta")
        assert response.status_code == 200
        
        items = response.json()
        cali = next((item for item in items if item.get('name') == 'California Dreaming' and item.get('category') == 'cocktails'), None)
        
        assert cali is not None, "California Dreaming cocktail not found"
        assert 'Malibu Rum' in cali.get('description', ''), f"California Dreaming description should contain 'Malibu Rum', got: {cali.get('description')}"
        print("✓ California Dreaming description contains 'Malibu Rum'")
    
    def test_cocktails_have_images(self):
        """Test that signature cocktails have image paths"""
        response = requests.get(f"{BASE_URL}/api/menu/items?location_slug=edgewood-atlanta")
        assert response.status_code == 200
        
        items = response.json()
        cocktails_with_images = ['California Dreaming', 'Marina Del Rey', 'Melrose Ave', 
                                  'Sunset Blvd', 'The 405', 'East LA', 'The Hollywood', 'Fin-A-Rita']
        
        for name in cocktails_with_images:
            cocktail = next((item for item in items if item.get('name') == name and item.get('category') == 'cocktails'), None)
            if cocktail:
                assert cocktail.get('image'), f"{name} should have an image path"
                assert '/images/cocktails/' in cocktail.get('image', ''), f"{name} image should be in /images/cocktails/"
        
        print(f"✓ Cocktails have image paths")
    
    def test_happy_hour_margarita_exists(self):
        """Test that Happy Hour Margarita exists with $10 price"""
        response = requests.get(f"{BASE_URL}/api/menu/items?location_slug=edgewood-atlanta")
        assert response.status_code == 200
        
        items = response.json()
        margarita = next((item for item in items if item.get('name') == 'Margarita' and item.get('category') == 'cocktails'), None)
        
        assert margarita is not None, "Happy Hour Margarita not found in cocktails category"
        assert margarita.get('price') == 10, f"Margarita should be $10, got ${margarita.get('price')}"
        print("✓ Happy Hour Margarita exists with $10 price")
    
    def test_happy_hour_rum_punch_exists(self):
        """Test that Happy Hour Rum Punch exists with $10 price"""
        response = requests.get(f"{BASE_URL}/api/menu/items?location_slug=edgewood-atlanta")
        assert response.status_code == 200
        
        items = response.json()
        rum_punch = next((item for item in items if item.get('name') == 'Rum Punch' and item.get('category') == 'cocktails'), None)
        
        assert rum_punch is not None, "Happy Hour Rum Punch not found in cocktails category"
        assert rum_punch.get('price') == 10, f"Rum Punch should be $10, got ${rum_punch.get('price')}"
        print("✓ Happy Hour Rum Punch exists with $10 price")
    
    def test_happy_hour_whiskey_sour_exists(self):
        """Test that Happy Hour Whiskey Sour exists with $10 price"""
        response = requests.get(f"{BASE_URL}/api/menu/items?location_slug=edgewood-atlanta")
        assert response.status_code == 200
        
        items = response.json()
        whiskey_sour = next((item for item in items if item.get('name') == 'Whiskey Sour' and item.get('category') == 'cocktails'), None)
        
        assert whiskey_sour is not None, "Happy Hour Whiskey Sour not found in cocktails category"
        assert whiskey_sour.get('price') == 10, f"Whiskey Sour should be $10, got ${whiskey_sour.get('price')}"
        print("✓ Happy Hour Whiskey Sour exists with $10 price")
    
    def test_happy_hour_long_island_exists(self):
        """Test that Happy Hour Long Island exists with $10 price"""
        response = requests.get(f"{BASE_URL}/api/menu/items?location_slug=edgewood-atlanta")
        assert response.status_code == 200
        
        items = response.json()
        long_island = next((item for item in items if item.get('name') == 'Long Island' and item.get('category') == 'cocktails'), None)
        
        assert long_island is not None, "Happy Hour Long Island not found in cocktails category"
        assert long_island.get('price') == 10, f"Long Island should be $10, got ${long_island.get('price')}"
        print("✓ Happy Hour Long Island exists with $10 price")


class TestCocktailImages:
    """Tests for cocktail image accessibility"""
    
    def test_the_405_image_loads(self):
        """Test that The 405 image loads correctly"""
        response = requests.get(f"{BASE_URL}/images/cocktails/the%20405.jpg")
        assert response.status_code == 200, f"The 405 image should load, got {response.status_code}"
        print("✓ The 405 image loads correctly")
    
    def test_sunset_blvd_image_loads(self):
        """Test that Sunset Blvd image loads correctly"""
        response = requests.get(f"{BASE_URL}/images/cocktails/Sunset%20Blvd.jpg")
        assert response.status_code == 200, f"Sunset Blvd image should load, got {response.status_code}"
        print("✓ Sunset Blvd image loads correctly")
    
    def test_california_dreaming_image_loads(self):
        """Test that California Dreaming image loads correctly"""
        response = requests.get(f"{BASE_URL}/images/cocktails/California%20Dreamin.jpg")
        assert response.status_code == 200, f"California Dreaming image should load, got {response.status_code}"
        print("✓ California Dreaming image loads correctly")
    
    def test_marina_del_rey_image_loads(self):
        """Test that Marina Del Rey image loads correctly"""
        response = requests.get(f"{BASE_URL}/images/cocktails/Marina%20Del%20Rey.jpg")
        assert response.status_code == 200, f"Marina Del Rey image should load, got {response.status_code}"
        print("✓ Marina Del Rey image loads correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
