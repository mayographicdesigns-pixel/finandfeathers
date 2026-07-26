"""Backend tests for the email magic-link sign-in feature."""
import os
import uuid
import asyncio
from datetime import datetime, timezone

import pytest
import requests
from motor.motor_asyncio import AsyncIOMotorClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

# Load env from backend/.env if not already set
if not os.environ.get("MONGO_URL"):
    with open("/app/backend/.env") as f:
        for line in f:
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.strip().split("=", 1)
                os.environ.setdefault(k, v.strip('"').strip("'"))
    MONGO_URL = os.environ["MONGO_URL"]
    DB_NAME = os.environ["DB_NAME"]


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


def _new_email():
    return f"test_magic_{uuid.uuid4().hex[:10]}@example.com"


# --------- Request magic-link tests ---------

class TestMagicLinkRequest:
    def test_new_email_creates_profile_and_token(self, api, db):
        email = _new_email()
        r = api.post(f"{BASE_URL}/api/auth/magic-link", json={"email": email})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        assert "email_sent" in data
        assert "_debug_magic_url" in data
        assert "token=" in data["_debug_magic_url"]

        # Profile created
        profile = _run(db.user_profiles.find_one({"email": email}))
        assert profile is not None
        assert profile["email"] == email

        # Token exists, used=false, future expiry
        token = data["_debug_magic_url"].split("token=")[-1]
        tok = _run(db.magic_link_tokens.find_one({"token": token}))
        assert tok is not None
        assert tok["used"] is False
        exp = tok["expires_at"]
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        assert exp > datetime.now(timezone.utc)

        # cleanup
        _run(db.user_profiles.delete_one({"email": email}))
        _run(db.magic_link_tokens.delete_many({"email": email}))

    def test_existing_email_does_not_duplicate_profile(self, api, db):
        email = _new_email()
        # First call creates profile
        api.post(f"{BASE_URL}/api/auth/magic-link", json={"email": email})
        count1 = _run(db.user_profiles.count_documents({"email": email}))
        assert count1 == 1

        # Second call should reuse
        r2 = api.post(f"{BASE_URL}/api/auth/magic-link", json={"email": email})
        assert r2.status_code == 200
        count2 = _run(db.user_profiles.count_documents({"email": email}))
        assert count2 == 1

        _run(db.user_profiles.delete_one({"email": email}))
        _run(db.magic_link_tokens.delete_many({"email": email}))

    def test_invalid_email_returns_400(self, api):
        r = api.post(f"{BASE_URL}/api/auth/magic-link", json={"email": "notanemail"})
        assert r.status_code == 400
        assert "Valid email is required" in r.json().get("detail", "")

    def test_missing_email_returns_400(self, api):
        r = api.post(f"{BASE_URL}/api/auth/magic-link", json={})
        assert r.status_code == 400


# --------- Verify magic-link tests ---------

class TestMagicLinkVerify:
    def _create_token(self, api):
        email = _new_email()
        r = api.post(f"{BASE_URL}/api/auth/magic-link", json={"email": email})
        assert r.status_code == 200
        token = r.json()["_debug_magic_url"].split("token=")[-1]
        return email, token

    def test_verify_valid_token(self, api, db):
        email, token = self._create_token(api)
        r = api.post(f"{BASE_URL}/api/auth/magic-link/verify", json={"token": token})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        assert data["user"]["email"] == email
        assert "id" in data["user"]
        # DB reflects used=true + used_at
        tok = _run(db.magic_link_tokens.find_one({"token": token}))
        assert tok["used"] is True
        assert "used_at" in tok

        _run(db.user_profiles.delete_one({"email": email}))
        _run(db.magic_link_tokens.delete_many({"email": email}))

    def test_reuse_same_token_returns_410(self, api, db):
        email, token = self._create_token(api)
        api.post(f"{BASE_URL}/api/auth/magic-link/verify", json={"token": token})
        r = api.post(f"{BASE_URL}/api/auth/magic-link/verify", json={"token": token})
        assert r.status_code == 410
        assert "already been used" in r.json().get("detail", "")

        _run(db.user_profiles.delete_one({"email": email}))
        _run(db.magic_link_tokens.delete_many({"email": email}))

    def test_bogus_token_returns_404(self, api):
        r = api.post(f"{BASE_URL}/api/auth/magic-link/verify",
                     json={"token": "not-a-real-token-" + uuid.uuid4().hex})
        assert r.status_code == 404
        assert "Invalid or expired" in r.json().get("detail", "")

    def test_expired_token_returns_410(self, api, db):
        email, token = self._create_token(api)
        past = datetime(2020, 1, 1, tzinfo=timezone.utc)
        _run(db.magic_link_tokens.update_one(
            {"token": token}, {"$set": {"expires_at": past}}
        ))
        r = api.post(f"{BASE_URL}/api/auth/magic-link/verify", json={"token": token})
        assert r.status_code == 410
        assert "expired" in r.json().get("detail", "").lower()

        _run(db.user_profiles.delete_one({"email": email}))
        _run(db.magic_link_tokens.delete_many({"email": email}))
