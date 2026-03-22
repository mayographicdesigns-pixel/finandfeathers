"""Shared database connection and utilities for all routers."""
from pathlib import Path
from dotenv import load_dotenv
import os
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends, HTTPException
from push_service import PushNotificationService
from auth import verify_password, get_password_hash, create_access_token, decode_access_token
import logging

# Upload directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Push Notification Service
push_service = PushNotificationService(db)

# Security
security = HTTPBearer(auto_error=False)

# SMTP Email Configuration
SMTP_HOST = os.environ.get('SMTP_HOST', '')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '465'))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')

# Admin credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD_HASH = get_password_hash("$outhcentral")

async def ensure_default_admin_user():
    existing = await db.admin_users.find_one({"username": ADMIN_USERNAME})
    if existing:
        return
    new_admin = {
        "id": f"admin_{uuid.uuid4().hex[:12]}",
        "username": ADMIN_USERNAME,
        "email": "admin@finandfeathers.com",
        "password_hash": ADMIN_PASSWORD_HASH,
        "is_active": True,
        "is_super_admin": True,
        "created_at": datetime.now(timezone.utc)
    }
    await db.admin_users.insert_one(new_admin)

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify admin JWT token"""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_access_token(credentials.credentials)
        return payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
