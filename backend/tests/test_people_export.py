"""
Test suite for Admin People Tab and Export functionality
Tests: GET /api/admin/people, GET /api/admin/people/export
"""
import pytest
import requests
import os
import csv
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdminPeopleEndpoints:
    """Tests for unified People tab endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth header"""
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-admin-token'
        })
    
    def test_get_people_returns_list(self):
        """GET /api/admin/people returns a list of people"""
        response = self.session.get(f"{BASE_URL}/api/admin/people")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"GET /api/admin/people returned {len(data)} people")
    
    def test_get_people_has_required_fields(self):
        """Each person in the list has required fields"""
        response = self.session.get(f"{BASE_URL}/api/admin/people")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            person = data[0]
            required_fields = ['id', 'name', 'source', 'status', 'date']
            for field in required_fields:
                assert field in person, f"Missing required field: {field}"
            
            # Verify source is one of expected values
            valid_sources = ['loyalty', 'contact', 'checkin']
            assert person['source'] in valid_sources, f"Invalid source: {person['source']}"
            print(f"First person: {person['name']} (source: {person['source']})")
        else:
            print("No people in database - skipping field validation")
    
    def test_get_people_sources_present(self):
        """Verify people from different sources are included"""
        response = self.session.get(f"{BASE_URL}/api/admin/people")
        assert response.status_code == 200
        
        data = response.json()
        sources = set(p['source'] for p in data)
        print(f"Sources found: {sources}")
        
        # Count by source
        source_counts = {}
        for p in data:
            src = p['source']
            source_counts[src] = source_counts.get(src, 0) + 1
        print(f"Source counts: {source_counts}")
    
    def test_export_people_csv(self):
        """GET /api/admin/people/export returns valid CSV"""
        response = self.session.get(f"{BASE_URL}/api/admin/people/export")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check content type
        content_type = response.headers.get('Content-Type', '')
        assert 'text/csv' in content_type, f"Expected text/csv, got {content_type}"
        
        # Check content disposition header
        content_disp = response.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disp, f"Expected attachment header, got {content_disp}"
        assert 'fin_feathers_contacts.csv' in content_disp, f"Expected filename in header"
        
        print(f"CSV export successful, Content-Disposition: {content_disp}")
    
    def test_export_csv_has_headers(self):
        """CSV export has proper column headers"""
        response = self.session.get(f"{BASE_URL}/api/admin/people/export")
        assert response.status_code == 200
        
        # Parse CSV
        csv_content = response.text
        reader = csv.reader(io.StringIO(csv_content))
        headers = next(reader)
        
        expected_headers = ['Name', 'Email', 'Phone', 'Source', 'Status', 'Location', 'Message', 'Date']
        assert headers == expected_headers, f"Expected headers {expected_headers}, got {headers}"
        
        # Count rows
        rows = list(reader)
        print(f"CSV has {len(rows)} data rows with headers: {headers}")
    
    def test_export_csv_data_matches_api(self):
        """CSV export data count matches API response"""
        # Get API data
        api_response = self.session.get(f"{BASE_URL}/api/admin/people")
        assert api_response.status_code == 200
        api_data = api_response.json()
        
        # Get CSV data
        csv_response = self.session.get(f"{BASE_URL}/api/admin/people/export")
        assert csv_response.status_code == 200
        
        reader = csv.reader(io.StringIO(csv_response.text))
        next(reader)  # Skip header
        csv_rows = list(reader)
        
        print(f"API returned {len(api_data)} people, CSV has {len(csv_rows)} rows")
        assert len(csv_rows) == len(api_data), f"CSV row count ({len(csv_rows)}) should match API count ({len(api_data)})"


class TestLoyaltyMembersCRUD:
    """Tests for loyalty member operations used by People tab"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-admin-token'
        })
    
    def test_get_loyalty_members(self):
        """GET /api/admin/loyalty-members returns list"""
        response = self.session.get(f"{BASE_URL}/api/admin/loyalty-members")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} loyalty members")
    
    def test_create_loyalty_member(self):
        """POST /api/loyalty/signup creates a new member"""
        test_email = f"TEST_loyalty_{os.urandom(4).hex()}@example.com"
        payload = {
            "name": "TEST Loyalty User",
            "email": test_email,
            "phone": "555-0100",
            "marketing_consent": True
        }
        
        response = self.session.post(f"{BASE_URL}/api/loyalty/signup", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['email'] == test_email
        assert data['name'] == "TEST Loyalty User"
        assert 'id' in data
        
        print(f"Created loyalty member: {data['id']}")
        
        # Cleanup
        delete_response = self.session.delete(f"{BASE_URL}/api/admin/loyalty-members/{data['id']}")
        assert delete_response.status_code == 200
        print(f"Cleaned up test loyalty member")


class TestContactsCRUD:
    """Tests for contact form operations used by People tab"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-admin-token'
        })
    
    def test_get_contacts(self):
        """GET /api/admin/contacts returns list"""
        response = self.session.get(f"{BASE_URL}/api/admin/contacts")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} contacts")
    
    def test_create_contact(self):
        """POST /api/contact creates a new contact"""
        test_email = f"TEST_contact_{os.urandom(4).hex()}@example.com"
        payload = {
            "name": "TEST Contact User",
            "email": test_email,
            "phone": "555-0200",
            "message": "Test message from automated testing"
        }
        
        response = self.session.post(f"{BASE_URL}/api/contact", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['email'] == test_email
        assert data['name'] == "TEST Contact User"
        assert 'id' in data
        assert data.get('status') == 'new'
        
        print(f"Created contact: {data['id']}")
        return data['id']
    
    def test_update_contact_status(self):
        """PATCH /api/admin/contacts/{id} updates status"""
        # First create a contact
        test_email = f"TEST_status_{os.urandom(4).hex()}@example.com"
        create_response = self.session.post(f"{BASE_URL}/api/contact", json={
            "name": "TEST Status User",
            "email": test_email,
            "message": "Test for status update"
        })
        assert create_response.status_code == 200
        contact_id = create_response.json()['id']
        
        # Update status to 'reviewed'
        update_response = self.session.patch(
            f"{BASE_URL}/api/admin/contacts/{contact_id}",
            json={"status": "reviewed"}
        )
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}"
        print(f"Updated contact {contact_id} status to 'reviewed'")
        
        # Update status to 'resolved'
        update_response2 = self.session.patch(
            f"{BASE_URL}/api/admin/contacts/{contact_id}",
            json={"status": "resolved"}
        )
        assert update_response2.status_code == 200
        print(f"Updated contact {contact_id} status to 'resolved'")
        
        # Cleanup
        delete_response = self.session.delete(f"{BASE_URL}/api/admin/contacts/{contact_id}")
        assert delete_response.status_code == 200
        print(f"Cleaned up test contact")
    
    def test_delete_contact(self):
        """DELETE /api/admin/contacts/{id} soft deletes contact"""
        # Create a contact
        test_email = f"TEST_delete_{os.urandom(4).hex()}@example.com"
        create_response = self.session.post(f"{BASE_URL}/api/contact", json={
            "name": "TEST Delete User",
            "email": test_email,
            "message": "Test for deletion"
        })
        assert create_response.status_code == 200
        contact_id = create_response.json()['id']
        
        # Delete it
        delete_response = self.session.delete(f"{BASE_URL}/api/admin/contacts/{contact_id}")
        assert delete_response.status_code == 200
        
        # Verify it's not in the list anymore
        list_response = self.session.get(f"{BASE_URL}/api/admin/contacts")
        contacts = list_response.json()
        contact_ids = [c['id'] for c in contacts]
        assert contact_id not in contact_ids, "Deleted contact should not appear in list"
        print(f"Contact {contact_id} successfully soft-deleted")


class TestPWAEndpoints:
    """Tests for PWA-related endpoints"""
    
    def test_manifest_accessible(self):
        """manifest.json is accessible"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert 'name' in data
        assert 'icons' in data
        assert 'start_url' in data
        assert 'display' in data
        
        print(f"Manifest: name='{data['name']}', display='{data['display']}'")
    
    def test_service_worker_accessible(self):
        """service-worker.js is accessible"""
        response = requests.get(f"{BASE_URL}/service-worker.js")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        content = response.text
        assert 'addEventListener' in content, "Service worker should have event listeners"
        assert 'push' in content.lower(), "Service worker should handle push events"
        
        print(f"Service worker accessible, length: {len(content)} chars")
    
    def test_vapid_public_key(self):
        """GET /api/push/public-key returns VAPID key"""
        response = requests.get(f"{BASE_URL}/api/push/public-key")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert 'publicKey' in data
        assert len(data['publicKey']) > 50, "VAPID key should be substantial"
        
        print(f"VAPID public key: {data['publicKey'][:30]}...")


class TestLocationsWithReviewUrls:
    """Tests for location data including Google Review URLs"""
    
    def test_locations_endpoint(self):
        """GET /api/locations returns locations"""
        response = requests.get(f"{BASE_URL}/api/locations")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0, "Should have at least one location"
        
        print(f"Found {len(data)} locations")
    
    def test_locations_have_required_fields(self):
        """Locations have required fields"""
        response = requests.get(f"{BASE_URL}/api/locations")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            loc = data[0]
            required_fields = ['slug', 'name', 'address']
            for field in required_fields:
                assert field in loc, f"Missing required field: {field}"
            print(f"First location: {loc['name']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
