"""
Test DJ Schedule Bulk Import API
Tests the new POST /api/dj/weekly-schedule/bulk endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDJBulkImport:
    """Tests for DJ Schedule Bulk Import feature"""
    
    def test_bulk_import_success(self):
        """Test successful bulk import of DJ schedules"""
        payload = {
            "location_slug": "stone-mountain",
            "week_label": "TEST_Week_Bulk_Import",
            "entries": [
                {"dj_name": "TEST_DJ_Alpha", "day_of_week": "Monday", "time_slot": "8pm - 12am", "notes": ""},
                {"dj_name": "TEST_DJ_Beta", "day_of_week": "Friday", "time_slot": "9pm - 2am", "notes": "Test night"}
            ],
            "replace_existing": False
        }
        
        response = requests.post(f"{BASE_URL}/api/dj/weekly-schedule/bulk", json=payload)
        print(f"Bulk import response: {response.status_code} - {response.text}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "inserted" in data, "Response should contain 'inserted' count"
        assert data["inserted"] == 2, f"Expected 2 inserted, got {data['inserted']}"
        assert data["location_slug"] == "stone-mountain"
        print(f"SUCCESS: Bulk import inserted {data['inserted']} entries")
    
    def test_bulk_import_with_replace(self):
        """Test bulk import with replace_existing=True"""
        # First, insert some test data
        payload1 = {
            "location_slug": "valdosta",
            "week_label": "TEST_Replace_Week",
            "entries": [
                {"dj_name": "TEST_DJ_Old1", "day_of_week": "Tuesday", "time_slot": "7pm - 11pm", "notes": ""}
            ],
            "replace_existing": False
        }
        response1 = requests.post(f"{BASE_URL}/api/dj/weekly-schedule/bulk", json=payload1)
        assert response1.status_code == 200
        
        # Now replace with new data
        payload2 = {
            "location_slug": "valdosta",
            "week_label": "TEST_Replace_Week_New",
            "entries": [
                {"dj_name": "TEST_DJ_New1", "day_of_week": "Wednesday", "time_slot": "8pm - 12am", "notes": ""},
                {"dj_name": "TEST_DJ_New2", "day_of_week": "Saturday", "time_slot": "9pm - 2am", "notes": ""}
            ],
            "replace_existing": True
        }
        response2 = requests.post(f"{BASE_URL}/api/dj/weekly-schedule/bulk", json=payload2)
        print(f"Replace import response: {response2.status_code} - {response2.text}")
        
        assert response2.status_code == 200
        data = response2.json()
        assert data["inserted"] == 2
        assert "deleted" in data, "Response should contain 'deleted' count when replace_existing=True"
        print(f"SUCCESS: Replaced schedules - deleted {data.get('deleted', 0)}, inserted {data['inserted']}")
    
    def test_bulk_import_invalid_location(self):
        """Test bulk import with non-existent location"""
        payload = {
            "location_slug": "non-existent-location-xyz",
            "week_label": "Test Week",
            "entries": [
                {"dj_name": "TEST_DJ", "day_of_week": "Monday", "time_slot": "8pm", "notes": ""}
            ],
            "replace_existing": False
        }
        
        response = requests.post(f"{BASE_URL}/api/dj/weekly-schedule/bulk", json=payload)
        print(f"Invalid location response: {response.status_code} - {response.text}")
        
        assert response.status_code == 404, f"Expected 404 for invalid location, got {response.status_code}"
        print("SUCCESS: Invalid location correctly returns 404")
    
    def test_bulk_import_empty_entries(self):
        """Test bulk import with empty entries list"""
        payload = {
            "location_slug": "stone-mountain",
            "week_label": "Empty Test",
            "entries": [],
            "replace_existing": False
        }
        
        response = requests.post(f"{BASE_URL}/api/dj/weekly-schedule/bulk", json=payload)
        print(f"Empty entries response: {response.status_code} - {response.text}")
        
        # Should succeed with 0 inserted
        assert response.status_code == 200
        data = response.json()
        assert data["inserted"] == 0
        print("SUCCESS: Empty entries correctly returns 0 inserted")
    
    def test_weekly_schedule_endpoint_still_works(self):
        """Verify GET /api/dj/weekly-schedule/{location} still works"""
        response = requests.get(f"{BASE_URL}/api/dj/weekly-schedule/edgewood-atlanta")
        print(f"Weekly schedule GET response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"SUCCESS: Weekly schedule endpoint returns {len(data)} entries")


class TestDJScheduleCleanup:
    """Cleanup test data after tests"""
    
    def test_cleanup_test_data(self):
        """Clean up TEST_ prefixed data from bulk import tests"""
        # Get all schedules for test locations and verify we can query them
        for location in ["stone-mountain", "valdosta"]:
            response = requests.get(f"{BASE_URL}/api/dj/weekly-schedule/{location}")
            if response.status_code == 200:
                schedules = response.json()
                test_schedules = [s for s in schedules if s.get("dj_name", "").startswith("TEST_")]
                print(f"Found {len(test_schedules)} test schedules in {location}")
        
        # Note: Actual cleanup would require delete endpoint or direct DB access
        # For now, just verify we can query the data
        print("SUCCESS: Test data query completed (manual cleanup may be needed)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
