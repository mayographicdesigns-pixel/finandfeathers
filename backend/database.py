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


async def _seed_locations():
    """Seed locations from the locations router seed data."""
    initial_locations = [
        {"id": str(uuid.uuid4()), "slug": "edgewood-atlanta", "name": "Fin & Feathers - Edgewood (Atlanta)",
         "address": "345 Edgewood Ave SE, Atlanta, GA 30312", "phone": "(404) 855-5524",
         "coordinates": {"lat": 33.7547, "lng": -84.3733}, "latitude": 33.7547, "longitude": -84.3733,
         "is_active": True, "display_order": 0, "created_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "slug": "midtown-atlanta", "name": "Fin & Feathers - Midtown (Atlanta)",
         "address": "1136 Crescent Ave NE, Atlanta, GA 30309", "phone": "(404) 549-7555",
         "coordinates": {"lat": 33.7812, "lng": -84.3838}, "latitude": 33.7812, "longitude": -84.3838,
         "is_active": True, "display_order": 1, "created_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "slug": "douglasville", "name": "Fin & Feathers - Douglasville",
         "address": "7430 Douglas Blvd, Douglasville, GA 30135", "phone": "(678) 653-9577",
         "coordinates": {"lat": 33.7515, "lng": -84.7477}, "latitude": 33.7515, "longitude": -84.7477,
         "is_active": True, "display_order": 2, "created_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "slug": "riverdale", "name": "Fin & Feathers - Riverdale",
         "address": "6340 Hwy 85, Riverdale, GA 30274", "phone": "(770) 703-2282",
         "coordinates": {"lat": 33.5726, "lng": -84.4132}, "latitude": 33.5726, "longitude": -84.4132,
         "is_active": True, "display_order": 3, "created_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "slug": "valdosta", "name": "Fin & Feathers - Valdosta",
         "address": "1700 Norman Dr, Valdosta, GA 31601", "phone": "(229) 474-4049",
         "coordinates": {"lat": 30.8327, "lng": -83.2785}, "latitude": 30.8327, "longitude": -83.2785,
         "is_active": True, "display_order": 4, "created_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "slug": "albany", "name": "Fin & Feathers - Albany",
         "address": "2800 Old Dawson Rd Unit 5, Albany, GA 31707", "phone": "(229) 231-2101",
         "coordinates": {"lat": 31.5785, "lng": -84.1558}, "latitude": 31.5785, "longitude": -84.1558,
         "is_active": True, "display_order": 5, "created_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "slug": "stone-mountain", "name": "Fin & Feathers - Stone Mountain",
         "address": "5370 Stone Mountain Hwy, Stone Mountain, GA 30087", "phone": "(470) 334-8255",
         "coordinates": {"lat": 33.8081, "lng": -84.1458}, "latitude": 33.8081, "longitude": -84.1458,
         "is_active": True, "display_order": 6, "created_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "slug": "las-vegas", "name": "Fin & Feathers - Las Vegas",
         "address": "1229 S. Casino Center Blvd, Las Vegas, NV 89104", "phone": "(725) 204-9655",
         "coordinates": {"lat": 36.1622, "lng": -115.1505}, "latitude": 36.1622, "longitude": -115.1505,
         "is_active": True, "display_order": 7, "created_at": datetime.now(timezone.utc)},
    ]
    await db.locations.insert_many(initial_locations)
    logging.info(f"Location seed: inserted {len(initial_locations)} locations")



async def _get_all_location_slugs() -> list:
    """Get all location slugs including None for global items."""
    all_locs = await db.locations.find({}, {"_id": 0, "slug": 1}).to_list(100)
    return [None] + [loc["slug"] for loc in all_locs if loc.get("slug")]


async def _seed_specific_items(slugs: list) -> int:
    """Ensure specific new menu items exist across all locations. Returns count added."""
    new_items = [
        {"name": "Ground Turkey Burger*", "price": 15.0, "category": "sandwiches", "type": "food",
         "description": "A perfectly grilled, savory seasoned ground turkey patty on a toasted brioche bun, topped with crisp lettuce, fresh sliced tomatoes, and zesty pickles, served with a generous side of seasoned fries",
         "image": "/images/menu/sandwiches/Ground Turkey Burger.jpg", "image_url": "/images/menu/sandwiches/Ground Turkey Burger.jpg", "is_active": True},
        {"name": "Add Fried Egg to Any Sandwich*", "price": 3.0, "category": "sandwiches", "type": "food",
         "description": "Add a fried egg to any sandwich", "image": "", "image_url": "", "is_active": True},
    ]
    added = 0
    for tmpl in new_items:
        for slug in slugs:
            if not await db.menu_items.find_one({"name": tmpl["name"], "location_slug": slug}):
                await db.menu_items.insert_one({**tmpl, "id": str(uuid.uuid4()), "location_slug": slug, "created_at": datetime.now(timezone.utc).isoformat()})
                added += 1
    return added


async def _seed_full_menu(slugs: list):
    """Seed complete menu from seed_menu.json across all location slugs. Clears partial data first."""
    import json as _json
    seed_path = ROOT_DIR / "seed_menu.json"
    if not seed_path.exists():
        logging.warning("seed_menu.json not found, skipping menu seed")
        return

    with open(seed_path, "r") as f:
        seed_items = _json.load(f)

    if not seed_items:
        return

    # Clear any partial/bad menu data before full seed
    old_count = await db.menu_items.count_documents({})
    if old_count > 0:
        await db.menu_items.delete_many({})
        logging.info(f"Menu seed: cleared {old_count} stale menu items before full seed")

    docs = []
    for item in seed_items:
        for slug in slugs:
            doc = {**item, "id": str(uuid.uuid4()), "location_slug": slug}
            doc.pop("_id", None)
            docs.append(doc)

    if docs:
        # Insert in batches to avoid memory issues
        batch_size = 500
        for i in range(0, len(docs), batch_size):
            await db.menu_items.insert_many(docs[i:i + batch_size])
        logging.info(f"Menu seed: inserted {len(docs)} items ({len(seed_items)} items x {len(slugs)} locations)")


async def _sync_wine_list(slugs: list):
    """Ensure wine list matches Silver Gate lineup. Removes old wines, adds missing new ones."""
    old_wines = [
        'Bonanza Cabernet', 'Cardinale Sweet', 'J Lohr Merlot', 'Meiomi Pinot Noir',
        'SG Cabernet', 'SG Merlot', 'Trapiche Malbec',
        'Justin Sauvignon Blanc', 'Landmark Chardonnay', 'Lost Angel Moscato',
        'Rosso Pinot Grigio', 'SG Chardonnay', 'SG Moscato', 'SG Pinot Grigio',
        'Washington Hills Riesling', 'Wine Selection', 'Silver Gate Rosé'
    ]
    deleted = await db.menu_items.delete_many({'name': {'$in': old_wines}})
    if deleted.deleted_count:
        logging.info(f"Wine sync: removed {deleted.deleted_count} old wine items")

    new_wines = [
        {'name': 'Silver Gate Cabernet Sauvignon', 'subcategory': 'Red Wine', 'description': 'Bold and expressive California red with intense aromas of dark fruit and oak', 'price': 9, 'variations': [{'name': 'Glass', 'price': 9}, {'name': 'Bottle', 'price': 34}]},
        {'name': 'Silver Gate Pinot Noir', 'subcategory': 'Red Wine', 'description': 'Elegant and refined California red with inviting aromas of cherry and earth', 'price': 9, 'variations': [{'name': 'Glass', 'price': 9}, {'name': 'Bottle', 'price': 34}]},
        {'name': 'Silver Gate Merlot', 'subcategory': 'Red Wine', 'description': 'Smooth and approachable California red with aromas of blackberry, plum, and spice', 'price': 9, 'variations': [{'name': 'Glass', 'price': 9}, {'name': 'Bottle', 'price': 34}]},
        {'name': 'Stella Rosa Black', 'subcategory': 'Red Wine', 'description': 'Semi-sweet Italian red wine with notes of wild berries and a smooth finish', 'price': 12, 'variations': [{'name': 'Glass', 'price': 12}, {'name': 'Bottle', 'price': 45}]},
        {'name': 'Silver Gate Chardonnay', 'subcategory': 'White Wine', 'description': 'Classic California white capturing warmth and freshness of the vineyards', 'price': 9, 'variations': [{'name': 'Glass', 'price': 9}, {'name': 'Bottle', 'price': 34}]},
        {'name': 'Silver Gate Sauvignon Blanc', 'subcategory': 'White Wine', 'description': 'Fresh and vibrant California Sauvignon Blanc with crisp citrus notes', 'price': 9, 'variations': [{'name': 'Glass', 'price': 9}, {'name': 'Bottle', 'price': 34}]},
        {'name': 'Silver Gate Pinot Grigio', 'subcategory': 'White Wine', 'description': 'Lively California white that celebrates vibrant fruit and mineral notes', 'price': 9, 'variations': [{'name': 'Glass', 'price': 9}, {'name': 'Bottle', 'price': 34}]},
        {'name': 'Silver Gate Moscato', 'subcategory': 'White Wine', 'description': 'Refreshing and approachable sweet white wine crafted in California', 'price': 9, 'variations': [{'name': 'Glass', 'price': 9}, {'name': 'Bottle', 'price': 34}]},
        {'name': 'Silver Gate Brut', 'subcategory': 'Sparkling', 'description': 'Refined sparkling wine crafted in Spain with elegant effervescence', 'price': 9, 'variations': [{'name': 'Glass', 'price': 9}, {'name': 'Bottle', 'price': 34}]},
        {'name': 'Washington Hills Chardonnay', 'subcategory': 'White Wine', 'description': 'Crisp and refreshing Washington State Chardonnay with notes of apple and pear', 'price': 13, 'variations': [{'name': 'Glass', 'price': 13}, {'name': 'Bottle', 'price': 46}]},
        {'name': 'La Marca Prosecco', 'subcategory': 'Sparkling', 'description': 'Italian sparkling wine with bright citrus and green apple notes', 'price': 10, 'variations': [{'name': 'Glass', 'price': 10}, {'name': 'Bottle', 'price': 36}]},
    ]

    added = 0
    for wine in new_wines:
        for slug in slugs:
            if not await db.menu_items.find_one({'name': wine['name'], 'location_slug': slug}):
                await db.menu_items.insert_one({
                    **wine, 'id': str(uuid.uuid4()), 'category': 'beer-wine',
                    'type': 'drink', 'image': '', 'image_url': '',
                    'location_slug': slug, 'is_active': True,
                    'created_at': datetime.now(timezone.utc).isoformat()
                })
                added += 1
    if added:
        logging.info(f"Wine sync: added {added} new wine items")


async def ensure_menu_items():
    """Ensure menu items exist in the database. Seeds from seed_menu.json if DB is empty."""
    try:
        # First ensure locations exist (menu seed depends on them)
        if await db.locations.count_documents({}) == 0:
            await _seed_locations()

        slugs = await _get_all_location_slugs()

        # Check if DB has a properly seeded menu by counting unique categories
        distinct_categories = await db.menu_items.distinct("category")
        logging.info(f"Menu check: {len(distinct_categories)} categories found")
        if len(distinct_categories) >= 10:
            # DB has a full menu — ensure specific items + sync wine list
            added = await _seed_specific_items(slugs)
            if added:
                logging.info(f"Menu seed: added {added} new menu items")
            await _sync_wine_list(slugs)
        else:
            # DB is empty or partially seeded — do full seed
            logging.info(f"Menu seed: only {len(distinct_categories)} categories, running full seed")
            await _seed_full_menu(slugs)
    except Exception as e:
        logging.error(f"Menu seed failed (non-fatal): {e}")



async def ensure_merchandise():
    """Seed sample merchandise if collection is empty."""
    if await db.merchandise.count_documents({}) > 0:
        return
    products = [
        {"id": str(uuid.uuid4()), "name": "Fin & Feathers Logo Tee - Black", "price": "29.99",
         "description": "Classic black tee with the Fin & Feathers logo. 100% cotton. S-3XL.",
         "image": "https://images.pexels.com/photos/18186105/pexels-photo-18186105.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
         "categories": ["Apparel", "T-Shirts"], "in_stock": True, "is_active": True, "display_order": 0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Fin & Feathers Logo Tee - White", "price": "29.99",
         "description": "Classic white tee with the Fin & Feathers logo. 100% cotton. S-3XL.",
         "image": "https://images.pexels.com/photos/18186105/pexels-photo-18186105.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
         "categories": ["Apparel", "T-Shirts"], "in_stock": True, "is_active": True, "display_order": 1, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "F&F Snapback Hat", "price": "24.99",
         "description": "Adjustable snapback cap with embroidered Fin & Feathers logo.",
         "image": "", "categories": ["Accessories", "Hats"], "in_stock": True, "is_active": True, "display_order": 2, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "F&F Hot Sauce", "price": "12.99",
         "description": "Our signature hot sauce — the same one served on every table. 8oz bottle.",
         "image": "", "categories": ["Food & Drink"], "in_stock": True, "is_active": True, "display_order": 3, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.merchandise.insert_many(products)
    logging.info(f"Merchandise seed: inserted {len(products)} products")



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
