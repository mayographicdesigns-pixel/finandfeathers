"""Shared database connection and utilities for all routers."""
from pathlib import Path
from dotenv import load_dotenv
import os
import uuid
import base64
import mimetypes
from datetime import datetime, timezone
from urllib.parse import urlparse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends, HTTPException
from push_service import PushNotificationService
from auth import verify_password, get_password_hash, create_access_token, decode_access_token
import aiohttp
import logging

# Upload directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# File upload constants
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
ALLOWED_VIDEO_EXTENSIONS = {'.mp4', '.mov', '.webm', '.avi'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50MB

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


async def ensure_menu_items():
    """Ensure required menu items exist in the database. Runs on startup to sync items across environments."""
    required_items = [
        {
            "name": "Ground Turkey Burger*",
            "description": "A perfectly grilled, savory seasoned ground turkey patty on a toasted brioche bun, topped with crisp romaine lettuce, fresh sliced tomatoes, and zesty pickles, served with a generous side of seasoned fries",
            "price": 15.0,
            "category": "sandwiches",
            "type": "food",
            "image": "/images/menu/sandwiches/Ground Turkey Burger.jpg",
            "image_url": "/images/menu/sandwiches/Ground Turkey Burger.jpg",
            "is_active": True,
        },
        {
            "name": "Add Fried Egg to Any Sandwich*",
            "description": "Add a fried egg to any sandwich",
            "price": 3.0,
            "category": "sandwiches",
            "type": "food",
            "image": "",
            "image_url": "",
            "is_active": True,
        },
        {
            "name": "Add Sauteed Mushrooms to Any Sandwich*",
            "description": "Add sauteed mushrooms to any sandwich",
            "price": 3.0,
            "category": "sandwiches",
            "type": "food",
            "image": "",
            "image_url": "",
            "is_active": True,
        },
    ]

    # Get all location slugs in the DB
    all_locations = await db.locations.find({}, {"_id": 0, "slug": 1}).to_list(100)
    slugs = [None] + [loc["slug"] for loc in all_locations if loc.get("slug")]

    added = 0
    for item_template in required_items:
        for slug in slugs:
            exists = await db.menu_items.find_one({
                "name": item_template["name"],
                "location_slug": slug
            })
            if not exists:
                doc = {
                    **item_template,
                    "id": str(uuid.uuid4()),
                    "location_slug": slug,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
                await db.menu_items.insert_one(doc)
                added += 1

    if added > 0:
        logging.info(f"Menu seed: added {added} missing menu items across locations")


async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Grant admin access - no authentication required"""
    return "admin"


async def download_image_to_uploads(image_url: str):
    """Download external image and store in MongoDB media_files (production-safe)."""
    if not image_url:
        return None

    try:
        if image_url.startswith("/api/uploads/"):
            filename = image_url.split("/")[-1]
            file_path = UPLOAD_DIR / filename
            if file_path.exists():
                content = file_path.read_bytes()
                ext = Path(filename).suffix.lower()
            else:
                return None
        else:
            async with aiohttp.ClientSession() as session:
                async with session.get(image_url) as response:
                    if response.status != 200:
                        logging.warning(f"Image download failed {response.status} for {image_url}")
                        return None
                    content = await response.read()
                    if len(content) > MAX_FILE_SIZE:
                        logging.warning(f"Image too large for {image_url}")
                        return None

                    parsed_path = urlparse(image_url).path
                    ext = Path(parsed_path).suffix.lower()
                    if ext not in ALLOWED_EXTENSIONS:
                        content_type = response.headers.get("Content-Type", "").split(";")[0].strip()
                        guessed_ext = mimetypes.guess_extension(content_type) if content_type else None
                        if guessed_ext and guessed_ext.lower() in ALLOWED_EXTENSIONS:
                            ext = guessed_ext.lower()
                        else:
                            ext = ".jpg"

        file_id = str(uuid.uuid4())
        base64_data = base64.b64encode(content).decode('utf-8')
        content_type = f"image/{ext[1:]}" if ext else "image/jpeg"

        await db.media_files.insert_one({
            "file_id": file_id,
            "filename": f"{file_id}{ext}",
            "data": base64_data,
            "content_type": content_type,
            "size": len(content),
            "uploaded_at": datetime.now(timezone.utc),
            "uploaded_by": "system-convert"
        })

        try:
            file_path = UPLOAD_DIR / f"{file_id}{ext}"
            with open(file_path, "wb") as f:
                f.write(content)
        except Exception:
            pass

        return f"/api/media/{file_id}"
    except Exception as e:
        logging.error(f"Failed to store image {image_url}: {e}")
        return None


async def create_woocommerce_order(line_items: list, customer_email: str = None, meta_data: list = None):
    """Helper function to create WooCommerce order"""
    woo_url = os.environ.get("WOOCOMMERCE_URL")
    woo_key = os.environ.get("WOOCOMMERCE_KEY")
    woo_secret = os.environ.get("WOOCOMMERCE_SECRET")

    if not all([woo_url, woo_key, woo_secret]):
        raise HTTPException(status_code=500, detail="WooCommerce not configured")

    api_url = f"{woo_url}/wp-json/wc/v3/orders"

    order_data = {
        "payment_method": "woocommerce_payments",
        "payment_method_title": "Credit Card",
        "set_paid": False,
        "status": "pending",
        "line_items": line_items,
        "meta_data": meta_data or []
    }

    if customer_email:
        order_data["billing"] = {"email": customer_email}

    try:
        async with aiohttp.ClientSession() as session:
            auth = aiohttp.BasicAuth(woo_key, woo_secret)
            async with session.post(api_url, json=order_data, auth=auth) as response:
                if response.status not in [200, 201]:
                    error_text = await response.text()
                    logging.error(f"WooCommerce order error: {error_text}")
                    raise HTTPException(status_code=response.status, detail="Failed to create order")
                return await response.json()
    except aiohttp.ClientError as e:
        logging.error(f"WooCommerce connection error: {e}")
        raise HTTPException(status_code=500, detail="Failed to connect to payment system")
