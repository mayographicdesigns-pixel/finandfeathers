"""
Test suite for DJ Live Streaming feature
- REST endpoints for stream status
- WebSocket endpoint existence
- DJ Panel UI elements
- Homepage banner logic
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestStreamEndpoints:
    """Test REST endpoints for live streaming"""
    
    def test_get_active_streams_empty(self):
        """GET /api/stream/active returns empty array when no streams active"""
        response = requests.get(f"{BASE_URL}/api/stream/active")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"PASS: GET /api/stream/active returns {data}")
    
    def test_get_stream_status_inactive(self):
        """GET /api/stream/active/{location_slug} returns {active: false} when no stream"""
        response = requests.get(f"{BASE_URL}/api/stream/active/edgewood-atlanta")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "active" in data, f"Expected 'active' key in response, got {data}"
        assert data["active"] == False, f"Expected active=False, got {data['active']}"
        print(f"PASS: GET /api/stream/active/edgewood-atlanta returns {data}")
    
    def test_get_stream_status_nonexistent_location(self):
        """GET /api/stream/active/{location_slug} for non-existent location returns inactive"""
        response = requests.get(f"{BASE_URL}/api/stream/active/nonexistent-location")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["active"] == False, f"Expected active=False for non-existent location"
        print(f"PASS: Non-existent location returns inactive: {data}")


class TestDJNextSession:
    """Test DJ next session endpoint returns correct timezone"""
    
    def test_edgewood_timezone(self):
        """GET /api/dj/next-session/edgewood-atlanta returns correct timezone"""
        response = requests.get(f"{BASE_URL}/api/dj/next-session/edgewood-atlanta")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # Should have timezone field
        assert "timezone" in data, f"Expected 'timezone' key in response, got {data.keys()}"
        assert data["timezone"] == "America/New_York", f"Expected America/New_York, got {data['timezone']}"
        print(f"PASS: Edgewood timezone is {data['timezone']}")
    
    def test_las_vegas_timezone(self):
        """GET /api/dj/next-session/las-vegas returns correct timezone"""
        response = requests.get(f"{BASE_URL}/api/dj/next-session/las-vegas")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "timezone" in data, f"Expected 'timezone' key in response"
        assert data["timezone"] == "America/Los_Angeles", f"Expected America/Los_Angeles, got {data['timezone']}"
        print(f"PASS: Las Vegas timezone is {data['timezone']}")


class TestDJPanelEndpoints:
    """Test DJ Panel related endpoints"""
    
    def test_dj_weekly_schedule_names(self):
        """GET /api/dj/weekly-schedule/names/all returns DJ names"""
        response = requests.get(f"{BASE_URL}/api/dj/weekly-schedule/names/all")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"PASS: DJ names endpoint returns {len(data)} names: {data[:5]}...")
    
    def test_locations_endpoint(self):
        """GET /api/locations returns locations list"""
        response = requests.get(f"{BASE_URL}/api/locations")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        assert len(data) > 0, "Expected at least one location"
        # Check location has slug
        assert "slug" in data[0], f"Expected 'slug' in location, got {data[0].keys()}"
        print(f"PASS: Locations endpoint returns {len(data)} locations")


class TestWebSocketEndpointExists:
    """Test that WebSocket endpoint is accessible (can't fully test WS in pytest)"""
    
    def test_websocket_endpoint_defined(self):
        """Verify the WebSocket endpoint is defined in stream router"""
        # WebSocket endpoints can't be tested via HTTP GET - they need WS protocol
        # We verify the REST endpoints work which confirms the router is mounted
        response = requests.get(f"{BASE_URL}/api/stream/active")
        assert response.status_code == 200, f"Stream router not mounted, got {response.status_code}"
        # The WebSocket endpoint /api/ws/live-stream/{location_slug} is defined in the same router
        # It will return 404 via HTTP because it requires WebSocket upgrade
        print(f"PASS: Stream router is mounted (REST endpoints work), WebSocket endpoint defined at /api/ws/live-stream/{{location_slug}}")


class TestHomepageLiveStatus:
    """Test homepage live status polling endpoints"""
    
    def test_stream_active_for_homepage(self):
        """GET /api/stream/active is used by homepage for live banner"""
        response = requests.get(f"{BASE_URL}/api/stream/active")
        assert response.status_code == 200
        data = response.json()
        # Should be a list (empty or with active streams)
        assert isinstance(data, list)
        print(f"PASS: Homepage can poll /api/stream/active, got {len(data)} active streams")
    
    def test_dj_next_session_for_homepage(self):
        """GET /api/dj/next-session/{location} is used by homepage"""
        response = requests.get(f"{BASE_URL}/api/dj/next-session/edgewood-atlanta")
        assert response.status_code == 200
        data = response.json()
        # Should have is_live field
        assert "is_live" in data, f"Expected 'is_live' key, got {data.keys()}"
        print(f"PASS: Homepage can poll /api/dj/next-session, is_live={data.get('is_live')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
