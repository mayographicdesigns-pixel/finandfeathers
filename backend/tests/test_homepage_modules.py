"""Tests for 5 homepage-module admin flags (iteration_65)."""
import os
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")

FLAGS = [
    "dj_live_banner_enabled",
    "karaoke_signup_banner_enabled",
    "song_request_banner_enabled",
    "marietta_coming_soon_enabled",
    "featured_events_enabled",
]


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


def test_public_settings_contains_all_five_flags():
    # Reset to ON to establish baseline
    _put_admin({k: True for k in FLAGS})
    data = _get_public()
    for k in FLAGS:
        assert k in data, f"missing {k} in public settings"
        assert data[k] is True, f"{k} should be True"


def test_admin_settings_contains_all_five_flags():
    data = _get_admin()
    for k in FLAGS:
        assert k in data
        assert isinstance(data[k], bool)


def test_toggle_each_flag_off_then_on_roundtrip():
    for k in FLAGS:
        _put_admin({k: False})
        pub = _get_public()
        adm = _get_admin()
        assert pub[k] is False, f"public {k} not False after PUT"
        assert adm[k] is False, f"admin  {k} not False after PUT"
        # Other flags remain ON
        for other in FLAGS:
            if other != k:
                assert pub[other] is True, f"{other} changed unexpectedly"
        _put_admin({k: True})
        assert _get_public()[k] is True
        assert _get_admin()[k] is True


def test_unknown_keys_are_ignored():
    _put_admin({"marietta_coming_soon_enabled": False, "totally_unknown_key": "hack",
                "another_bad": True})
    pub = _get_public()
    assert pub["marietta_coming_soon_enabled"] is False
    assert "totally_unknown_key" not in pub
    assert "another_bad" not in pub
    # cleanup
    _put_admin({"marietta_coming_soon_enabled": True})
    assert _get_public()["marietta_coming_soon_enabled"] is True


def test_leave_all_flags_on_at_end():
    _put_admin({k: True for k in FLAGS})
    pub = _get_public()
    for k in FLAGS:
        assert pub[k] is True
