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



async def _sync_location_hours():
    """Sync each location's hours to the official/Google-verified values on every startup.
    This ensures hour edits in code reach production without requiring manual admin edits."""
    LOCATION_HOURS = {
        'edgewood-atlanta': {
            'monday': '11am-11pm', 'tuesday': '11am-11pm', 'wednesday': '11am-11pm',
            'thursday': '11am-11pm', 'friday': '11am-2am', 'saturday': '11am-2am',
            'sunday': '10am-11:30pm',
        },
        'midtown-atlanta': {
            'monday': '11am-12am', 'tuesday': '11am-12am', 'wednesday': '11am-12am',
            'thursday': '11am-12am', 'friday': '11am-12am', 'saturday': '11am-12am',
            'sunday': '11am-12am',
        },
        'douglasville': {
            'monday': '11am-1am', 'tuesday': '11am-1am', 'wednesday': '11am-1am',
            'thursday': '11am-1am', 'friday': '11am-1am', 'saturday': '11am-1am',
            'sunday': '11am-1am',
        },
        'riverdale': {
            'monday': '11am-11pm', 'tuesday': '11am-11pm', 'wednesday': '11am-11pm',
            'thursday': '11am-11pm', 'friday': '11am-1am', 'saturday': '10am-1am',
            'sunday': '10am-11pm',
        },
        'valdosta': {
            'monday': '11am-10pm', 'tuesday': '11am-10pm', 'wednesday': '11am-10pm',
            'thursday': '11am-10pm', 'friday': '11am-11pm', 'saturday': '10am-11pm',
            'sunday': '10am-10pm',
        },
        'albany': {
            'monday': '11am-11pm', 'tuesday': '11am-11pm', 'wednesday': '11am-11pm',
            'thursday': '11am-11pm', 'friday': '11am-12am', 'saturday': '11am-12am',
            'sunday': 'Closed',
        },
        'stone-mountain': {
            'monday': '11am-12am', 'tuesday': '11am-12am', 'wednesday': '11am-12am',
            'thursday': '11am-3am', 'friday': '11am-3am', 'saturday': '10am-3am',
            'sunday': '10am-12am',
        },
        'las-vegas': {
            'monday': '11am-11pm', 'tuesday': '11am-11pm', 'wednesday': '11am-11pm',
            'thursday': '11am-11pm', 'friday': '11am-12am', 'saturday': '11am-12am',
            'sunday': '11am-11pm',
        },
    }
    synced = 0
    for slug, hours in LOCATION_HOURS.items():
        result = await db.locations.update_one(
            {'slug': slug},
            {'$set': {'hours': hours}},
        )
        if result.modified_count:
            synced += 1

    # Also remove any Wednesday "wing" specials across all locations
    wing_removed = 0
    async for loc in db.locations.find({}, {'_id': 1, 'weekly_specials': 1, 'name': 1}):
        specials = loc.get('weekly_specials') or []
        filtered = [
            sp for sp in specials
            if not (sp.get('day', '').lower() == 'wednesday' and 'wing' in (sp.get('special', '') or '').lower())
        ]
        if len(filtered) != len(specials):
            await db.locations.update_one({'_id': loc['_id']}, {'$set': {'weekly_specials': filtered}})
            wing_removed += 1

    if synced or wing_removed:
        logging.info(f"Location sync: updated hours for {synced} locations, removed Wed-wing specials from {wing_removed} locations")


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


async def _sync_menu_prices_and_images(slugs: list):
    """On every startup, sync prices, images, and descriptions from seed_menu.json
    to all existing menu items (matched by name + category).
    Also removes items explicitly listed in REMOVED_MENU_ITEMS.
    This ensures price/image changes in seed_menu.json reach production without a full re-seed."""
    import json as _json
    seed_path = ROOT_DIR / "seed_menu.json"
    if not seed_path.exists():
        return

    with open(seed_path, "r") as f:
        seed_items = _json.load(f)

    # Items that have been intentionally removed from the menu —
    # delete them on every startup even if they exist in the DB
    REMOVED_MENU_ITEMS = [
        # (name, category-or-None to match any)
        ("Silver Gate Brut", None),
        ("House Brut", None),
        ("Jager", None),
        ("Grand Marnier", None),
        ("Amaretto", None),
        ("Belaire Bleu", None),
        ("Belaire Rose", None),
        ("Rum Punch", "cocktails"),
        ("Whiskey Sour", "cocktails"),
        ("Long Island", "cocktails"),
        ("Margarita", "cocktails"),
        ("Fin-A-Rita", "cocktails"),
        # Duplicate Rodeo Drive — keep only the cocktails-category one
        ("Rodeo Drive", "signature-cocktails"),
        # Replaced by Washington Hills Riesling
        ("Washington Hills Chardonnay", None),
        # Duplicate signature cocktails that were mistakenly placed in brunch-drinks
        ("California Dreaming", "brunch-drinks"),
        ("East LA", "brunch-drinks"),
        ("Melrose Ave", "brunch-drinks"),
        ("Pacific Coast Hwy", "brunch-drinks"),
        ("Sunrise", "brunch-drinks"),
        ("Sunset", "brunch-drinks"),
        # Drinks mistakenly categorized as brunch food — keep them only in brunch-drinks
        ("Bellini", "brunch"),
        ("French 75", "brunch"),
        ("Mimosa", "brunch"),
        ("Sunrise", "brunch"),
        ("Sunset", "brunch"),
    ]

    removed_count = 0
    removed_keys = set()
    for name, cat in REMOVED_MENU_ITEMS:
        query = {"name": name}
        if cat:
            query["category"] = cat
        result = await db.menu_items.delete_many(query)
        removed_count += result.deleted_count
        # Track (name, category) keys so we don't re-insert them from seed
        removed_keys.add((name, cat))

    updated_count = 0
    inserted_count = 0
    for item in seed_items:
        name = item.get("name")
        category = item.get("category")
        if not name or not category:
            continue
        # Skip items that have been explicitly removed
        if (name, category) in removed_keys or (name, None) in removed_keys:
            continue

        update_fields = {}
        for field in ("price", "description", "image", "image_url", "badges", "variations"):
            if field in item:
                update_fields[field] = item[field]

        if not update_fields:
            continue

        # Update existing items across all locations
        result = await db.menu_items.update_many(
            {"name": name, "category": category},
            {"$set": update_fields},
        )
        updated_count += result.modified_count

        # Insert into any location that doesn't have this item yet
        for slug in slugs:
            exists = await db.menu_items.find_one(
                {"name": name, "category": category, "location_slug": slug},
                {"_id": 1},
            )
            if not exists:
                new_doc = {**item, "id": str(uuid.uuid4()), "location_slug": slug, "is_active": item.get("is_active", True)}
                new_doc.pop("_id", None)
                await db.menu_items.insert_one(new_doc)
                inserted_count += 1

    if updated_count or inserted_count or removed_count:
        logging.info(f"Menu sync: removed {removed_count}, updated {updated_count}, inserted {inserted_count} items from seed")


async def _sync_wine_list(slugs: list):
    """Ensure wine list matches Silver Gate lineup. Removes old wines, adds missing new ones."""
    old_wines = [
        'Bonanza Cabernet', 'Cardinale Sweet', 'J Lohr Merlot', 'Meiomi Pinot Noir',
        'SG Cabernet', 'SG Merlot', 'Trapiche Malbec',
        'Justin Sauvignon Blanc', 'Landmark Chardonnay', 'Lost Angel Moscato',
        'Rosso Pinot Grigio', 'SG Chardonnay', 'SG Moscato', 'SG Pinot Grigio',
        'Wine Selection', 'Silver Gate Rosé',
        # Replaced by Riesling
        'Washington Hills Chardonnay',
        # Brut discontinued
        'Silver Gate Brut',
        # House Brut removed too
        'House Brut',
        # Belaire discontinued
        'Belaire Bleu', 'Belaire Rose',
    ]
    deleted = await db.menu_items.delete_many({'name': {'$in': old_wines}})
    if deleted.deleted_count:
        logging.info(f"Wine sync: removed {deleted.deleted_count} old wine items")

    new_wines = [
        {'name': 'Silver Gate Cabernet Sauvignon', 'subcategory': 'Red Wine', 'description': 'Bold and expressive California red with intense aromas of dark fruit and oak', 'price': 9, 'variations': [{'name': 'Glass', 'price': 9}, {'name': 'Bottle', 'price': 34}]},
        {'name': 'Silver Gate Pinot Noir', 'subcategory': 'Red Wine', 'description': 'Elegant and refined California red with inviting aromas of cherry and earth', 'price': 9, 'variations': [{'name': 'Glass', 'price': 9}, {'name': 'Bottle', 'price': 34}]},
        {'name': 'Silver Gate Merlot', 'subcategory': 'Red Wine', 'description': 'Smooth and approachable California red with aromas of blackberry, plum, and spice', 'price': 9, 'variations': [{'name': 'Glass', 'price': 9}, {'name': 'Bottle', 'price': 34}]},
        {'name': 'Stella Rosa Black', 'subcategory': 'Red Wine', 'description': 'Semi-sweet Italian red wine with notes of wild berries and a smooth finish', 'price': 10, 'variations': [{'name': 'Glass', 'price': 10}, {'name': 'Bottle', 'price': 38}], 'display_order': 9999},
        {'name': 'Silver Gate Chardonnay', 'subcategory': 'White Wine', 'description': 'Classic California white capturing warmth and freshness of the vineyards', 'price': 9, 'variations': [{'name': 'Glass', 'price': 9}, {'name': 'Bottle', 'price': 34}]},
        {'name': 'Silver Gate Sauvignon Blanc', 'subcategory': 'White Wine', 'description': 'Fresh and vibrant California Sauvignon Blanc with crisp citrus notes', 'price': 9, 'variations': [{'name': 'Glass', 'price': 9}, {'name': 'Bottle', 'price': 34}]},
        {'name': 'Silver Gate Pinot Grigio', 'subcategory': 'White Wine', 'description': 'Lively California white that celebrates vibrant fruit and mineral notes', 'price': 9, 'variations': [{'name': 'Glass', 'price': 9}, {'name': 'Bottle', 'price': 34}]},
        {'name': 'Silver Gate Moscato', 'subcategory': 'White Wine', 'description': 'Refreshing and approachable sweet white wine crafted in California', 'price': 9, 'variations': [{'name': 'Glass', 'price': 9}, {'name': 'Bottle', 'price': 34}]},
        {'name': 'Washington Hills Riesling', 'subcategory': 'White Wine', 'description': 'Off-dry Washington State Riesling with notes of green apple, peach, and citrus', 'price': 10, 'variations': [{'name': 'Glass', 'price': 10}, {'name': 'Bottle', 'price': 38}]},
        {'name': 'La Marca Prosecco', 'subcategory': 'Sparkling', 'description': 'Italian sparkling wine with bright citrus and green apple notes', 'price': 11, 'variations': [{'name': 'Glass', 'price': 11}, {'name': 'Bottle', 'price': 40}]},
        {'name': 'Moet Rose', 'subcategory': 'Sparkling', 'description': 'Moet & Chandon Rose Imperial — Bottle Only', 'price': 325, 'variations': [{'name': 'Bottle', 'price': 325}]},
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

        # Sync location hours + remove Wed-wing specials on every startup
        await _sync_location_hours()

        slugs = await _get_all_location_slugs()

        # Check if DB has a properly seeded menu by counting unique categories
        distinct_categories = await db.menu_items.distinct("category")
        logging.info(f"Menu check: {len(distinct_categories)} categories found")
        if len(distinct_categories) >= 10:
            # DB has a full menu — ensure specific items + sync wine list + sync prices/images
            added = await _seed_specific_items(slugs)
            if added:
                logging.info(f"Menu seed: added {added} new menu items")
            await _sync_wine_list(slugs)
            await _sync_menu_prices_and_images(slugs)
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


async def ensure_events():
    """Seed featured events — adds missing ones even if DB already has events."""
    required_events = [
        {
            "name": "Cinco De Mayo Turn Up",
            "description": "Doe Nation Hospitality Inc Presents... Cinco De Mayo Taco Tuesday! $5 Tacos (2) and $5 Margaritas at all locations.",
            "date": "2026-05-05", "time": "All Day", "location": "All Locations", "location_slug": None,
            "image": "/images/events/cinco-de-mayo.mp4", "media_type": "video",
            "featured": True, "packages": ["general"], "package_prices": {"general": 0},
            "is_active": True, "display_order": -2,
        },
        {
            "name": "Mom Brunch - Mother's Day",
            "description": "Celebrate Mother's Day with us! $20 Bottomless Mimosas (one per person). All locations.",
            "date": "2026-05-10", "time": "10AM - 4PM", "location": "All Locations", "location_slug": None,
            "image": "/images/events/mom-brunch.jpg", "media_type": "image",
            "featured": True, "packages": ["general"], "package_prices": {"general": 0},
            "is_active": True, "display_order": -1,
        },
    ]
    added = 0
    for event in required_events:
        if not await db.events.find_one({"name": event["name"]}):
            event["id"] = str(uuid.uuid4())
            event["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.events.insert_one(event)
            added += 1
    if added:
        logging.info(f"Events seed: added {added} featured events")


async def fix_daily_specials_hours():
    """One-time, idempotent migration: correct historical $5 daily special hours.

    Only touches a record if its `hours` field still matches the broken
    legacy value — admin edits made via /admin/daily-specials are preserved.

    Migrations applied:
      • Friday (day_index=5): "6pm – 8pm" -> "12pm – 8pm" so the $5 specials
        UI doesn't hide all afternoon. Description updated to call out the
        $6 Premium Shots 6pm-8pm add-on.
      • Saturday (day_index=6): "6pm – 8pm" -> "5pm – 8pm" (user requested
        update that landed in preview but never reached production DB).
    """
    try:
        fri = await db.daily_specials.find_one({"day_index": 5}, {"_id": 0, "hours": 1})
        if fri and fri.get("hours") == "6pm – 8pm":
            await db.daily_specials.update_one(
                {"day_index": 5},
                {"$set": {
                    "name": "Premium Power Hour",
                    "hours": "12pm – 8pm",
                    "description": "$5 Daily Specials menu 12pm – 8pm · $6 Premium Shots 6pm – 8pm",
                    "emoji": "⚡",
                    "updated_at": datetime.now(timezone.utc),
                }},
            )
            logging.info("Daily specials migration: Friday hours fixed (6pm-8pm -> 12pm-8pm)")

        sat = await db.daily_specials.find_one({"day_index": 6}, {"_id": 0, "hours": 1})
        if sat and sat.get("hours") == "6pm – 8pm":
            await db.daily_specials.update_one(
                {"day_index": 6},
                {"$set": {
                    "hours": "5pm – 8pm",
                    "updated_at": datetime.now(timezone.utc),
                }},
            )
            logging.info("Daily specials migration: Saturday hours fixed (6pm-8pm -> 5pm-8pm)")
    except Exception as e:
        logging.error(f"Daily specials migration error: {e}")




async def apply_june2026_data_migrations():
    """One-time, flag-guarded migration replicating preview DB edits to production.

    Guarded by app_settings flag `migration_june2026_v1` so it runs exactly once
    per database and never overwrites later admin edits.
    """
    try:
        flag = await db.app_settings.find_one({"key": "migration_june2026_v1"})
        if flag:
            return
        now = datetime.now(timezone.utc)

        # 1. Signature cocktails: pin Crenshaw Blvd first, Rodeo Drive second
        await db.menu_items.update_many(
            {"category": "cocktails", "name": "Crenshaw Blvd"},
            {"$set": {"display_order": 1, "updated_at": now}},
        )
        await db.menu_items.update_many(
            {"category": "cocktails", "name": "Rodeo Drive"},
            {"$set": {"display_order": 2, "updated_at": now}},
        )

        # 2. Tequila Sunrise brunch drink: $10, premium option $15
        await db.menu_items.update_many(
            {"category": "brunch-drinks", "name": "Tequila Sunrise"},
            {"$set": {
                "price": 10,
                "description": "Blanco Tequila, Orange Juice, and a dash of Grenadine. $15 with premium Tequila.",
                "updated_at": now,
            }},
        )

        # 3. Marietta location
        if not await db.locations.find_one({"slug": "marietta"}):
            max_order = 0
            async for loc in db.locations.find({}, {"display_order": 1}):
                max_order = max(max_order, loc.get("display_order", 0) or 0)
            await db.locations.insert_one({
                "id": str(uuid.uuid4()),
                "slug": "marietta",
                "name": "Fin & Feathers - Marietta",
                "address": "16 Atlanta St SE, Marietta, GA 30060",
                "phone": "(678) 505-8927",
                "reservation_phone": None,
                "coordinates": {"lat": 33.9515, "lng": -84.5490},
                "image": "https://customer-assets-v7afamib.emergentagent.net/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/oh2fgf14_image.png",
                "hours": {
                    "monday": "Closed", "tuesday": "Closed", "wednesday": "Closed",
                    "thursday": "5pm-12am", "friday": "5pm-3am",
                    "saturday": "5pm-3am", "sunday": "5pm-12am",
                },
                "online_ordering": None,
                "reservations": None,
                "delivery": None,
                "social_media": {"instagram": None, "facebook": None, "twitter": None, "tiktok": None},
                "weekly_specials": [],
                "is_active": True,
                "display_order": max_order + 1,
                "created_at": now,
                "updated_at": now,
                "check_in_enabled": True,
                "tip_staff_enabled": False,
                "dj_tips_enabled": False,
                "social_wall_enabled": True,
                "directions_link": "https://maps.google.com/?q=16+Atlanta+St+SE+Marietta+GA+30060",
                "review_link": None,
            })

        await db.app_settings.insert_one({"key": "migration_june2026_v1", "applied_at": now})
        logging.info("June 2026 data migration applied (cocktail order, tequila sunrise, marietta)")
    except Exception as e:
        logging.error(f"June 2026 data migration error: {e}")


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
