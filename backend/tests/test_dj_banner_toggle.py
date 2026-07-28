"""Tests for dj_live_banner_enabled setting toggle."""
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://staff-client-roles.preview.emergentagent.com").rstrip("/")


def _get_public():
    r = requests.get(f"{BASE_URL}/api/settings", timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


def _get_admin():
    r = requests.get(f"{BASE_URL}/api/admin/settings", timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


def _put_admin(payload):
    r = requests.put(f"{BASE_URL}/api/admin/settings", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


def test_public_settings_contains_flag_default_true():
    # Ensure ON first
    _put_admin({"dj_live_banner_enabled": True})
    data = _get_public()
    assert "dj_live_banner_enabled" in data
    assert data["dj_live_banner_enabled"] is True


def test_admin_settings_returns_flag():
    data = _get_admin()
    assert "dj_live_banner_enabled" in data
    assert isinstance(data["dj_live_banner_enabled"], bool)


def test_toggle_off_persists_public_and_admin():
    _put_admin({"dj_live_banner_enabled": False})
    assert _get_public()["dj_live_banner_enabled"] is False
    assert _get_admin()["dj_live_banner_enabled"] is False


def test_toggle_back_on_persists():
    _put_admin({"dj_live_banner_enabled": True})
    assert _get_public()["dj_live_banner_enabled"] is True
    assert _get_admin()["dj_live_banner_enabled"] is True
