from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File, Request, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path
import base64

# Load environment variables FIRST before any other imports that might need them
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import aiohttp
import os
import logging
import mimetypes
from urllib.parse import urlparse
from typing import List, Optional
from timezone_utils import get_location_tz_name, utc_now_in_location, LOCATION_TIMEZONES
from datetime import datetime, timezone, timedelta
from models import (
    LoyaltyMember, LoyaltyMemberCreate, PushSubscription,
    PushNotification, PushNotificationCreate,
    ContactForm, ContactFormCreate, ContactFormUpdate,
    PageContent, PageContentUpdate,
    DailySpecial, DailySpecialUpdate,
    MenuItem, MenuItemCreate, MenuItemUpdate,
    UserLogin, Token, UserResponse,
    Special, SpecialCreate, SpecialUpdate,
    SocialLink, SocialLinkCreate, SocialLinkUpdate,
    InstagramPost, InstagramPostCreate, InstagramPostUpdate,
    CheckIn, CheckInCreate, CheckInResponse,
    GalleryItem, GalleryItemCreate, GalleryItemUpdate,
    HomepageContent, HomepageContentUpdate,
    SocialPost, SocialPostCreate, SocialPostResponse,
    DirectMessage, DirectMessageCreate, DirectMessageResponse,
    DJTip, DJTipCreate, DJTipResponse,
    DJProfile, DJProfileCreate, DJProfileUpdate, DJProfileResponse,
    DJSchedule, DJScheduleCreate, DJScheduleUpdate, DJScheduleResponse,
    SongRequestCreate, SongRequestResponse,
    DrinkOrder, DrinkOrderCreate, DrinkOrderResponse,
    UserProfile, UserProfileCreate, UserProfileUpdate, UserProfileResponse,
    TokenPurchase, TokenPurchaseCreate, TokenGiftCreate, TokenPurchaseResponse,
    UserGallerySubmission, UserGallerySubmissionCreate, UserGallerySubmissionResponse,
    TokenTransfer, TokenTransferCreate, TokenTransferResponse,
    CashoutRequest, CashoutRequestCreate, CashoutRequestResponse,
    RoleUpdate,
    Location, LocationCreate, LocationUpdate, LocationResponse,
    LocationHours, LocationCoordinates, LocationSocialMedia, WeeklySpecial,
    PromoVideo, PromoVideoCreate, PromoVideoUpdate,
    Event, EventCreate, EventUpdate
)
from push_service import PushNotificationService
from auth import verify_password, get_password_hash, create_access_token, decode_access_token
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize Push Notification Service
push_service = PushNotificationService(db)

# Security
security = HTTPBearer(auto_error=False)

# SMTP Email Configuration
SMTP_HOST = os.environ.get('SMTP_HOST', '')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '465'))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')



# Admin credentials and setup moved to database.py
from database import ADMIN_USERNAME, ADMIN_PASSWORD_HASH, ensure_default_admin_user


# Create the main app without a prefix
app = FastAPI()

# Note: Static files mount removed - now using explicit /api/uploads/{filename} endpoint
# This ensures files are served from MongoDB in production

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Endpoint to serve images stored in MongoDB (for production)
@api_router.get("/media/{file_id}")
async def get_media_file(file_id: str):
    """Serve media files stored in MongoDB as Base64"""
    media = await db.media_files.find_one({"file_id": file_id}, {"_id": 0})
    if not media:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Decode Base64 data
    file_data = base64.b64decode(media["data"])
    content_type = media.get("content_type", "image/jpeg")
    
    return Response(content=file_data, media_type=content_type)


# Fallback endpoint for old /api/uploads/{filename} format
@api_router.get("/uploads/{filename}")
async def get_upload_file(filename: str):
    """Serve uploaded files - checks local disk first, then MongoDB by filename"""
    # Try local disk first (preview environment)
    try:
        file_path = UPLOAD_DIR / filename
        if file_path.exists():
            content_type = "image/jpeg"
            if filename.endswith(".png"):
                content_type = "image/png"
            elif filename.endswith(".gif"):
                content_type = "image/gif"
            elif filename.endswith(".webp"):
                content_type = "image/webp"
            with open(file_path, "rb") as f:
                return Response(content=f.read(), media_type=content_type)
    except Exception:
        pass
    
    # Try MongoDB by filename
    media = await db.media_files.find_one({"filename": filename}, {"_id": 0})
    if media:
        file_data = base64.b64decode(media["data"])
        content_type = media.get("content_type", "image/jpeg")
        return Response(content=file_data, media_type=content_type)
    
    # Try MongoDB by file_id (filename might be the UUID part)
    file_id = filename.split('.')[0] if '.' in filename else filename
    media = await db.media_files.find_one({"file_id": file_id}, {"_id": 0})
    if media:
        file_data = base64.b64decode(media["data"])
        content_type = media.get("content_type", "image/jpeg")
        return Response(content=file_data, media_type=content_type)
    
    raise HTTPException(status_code=404, detail="File not found")


# Auth dependency
async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Grant admin access - no authentication required"""
    return "admin"


# Health check
@api_router.get("/")
async def root():
    return {"message": "Fin & Feathers API is running"}


# App Settings Endpoints
@api_router.get("/settings")
async def get_app_settings():
    """Get public app settings"""
    settings = await db.app_settings.find_one({"_id": "global"}, {"_id": 0})
    if not settings:
        # Return default settings
        settings = {
            "token_program_enabled": True,
            "loyalty_program_enabled": True,
            "buy_drink_enabled": True
        }
    return settings


@api_router.get("/admin/settings")
async def get_admin_settings(admin: str = Depends(get_current_admin)):
    """Get all app settings for admin"""
    settings = await db.app_settings.find_one({"_id": "global"})
    if not settings:
        settings = {
            "_id": "global",
            "token_program_enabled": True,
            "loyalty_program_enabled": True,
            "buy_drink_enabled": True
        }
        await db.app_settings.insert_one(settings)
    return {k: v for k, v in settings.items() if k != "_id"}


@api_router.put("/admin/settings")
async def update_admin_settings(settings: dict, admin: str = Depends(get_current_admin)):
    """Update app settings"""
    allowed_keys = ["token_program_enabled", "loyalty_program_enabled", "buy_drink_enabled"]
    update_data = {k: v for k, v in settings.items() if k in allowed_keys}
    
    await db.app_settings.update_one(
        {"_id": "global"},
        {"$set": update_data},
        upsert=True
    )
    return {"message": "Settings updated successfully"}


# Public Menu Endpoints (no auth required)
@api_router.get("/menu/items")
async def get_public_menu_items(location_slug: str = None):
    """Get menu items for public display, optionally filtered by location"""
    query = {}
    if location_slug:
        query["location_slug"] = location_slug
    items = await db.menu_items.find(query, {"_id": 0}).to_list(2000)
    return items


@api_router.get("/menu/categories")
async def get_menu_categories(location_slug: str = None):
    """Get unique menu categories, optionally filtered by location"""
    if location_slug:
        pipeline = [
            {"$match": {"location_slug": location_slug}},
            {"$group": {"_id": "$category"}},
            {"$sort": {"_id": 1}}
        ]
        results = await db.menu_items.aggregate(pipeline).to_list(100)
        return [r["_id"] for r in results]
    categories = await db.menu_items.distinct("category")
    return categories


# Homepage Content Endpoints
@api_router.get("/homepage/content")
async def get_homepage_content():
    """Get homepage content for public display"""
    content = await db.homepage_content.find_one({"id": "homepage"}, {"_id": 0})
    if not content:
        # Return default content
        return {
            "id": "homepage",
            "tagline": "Elevated dining meets Southern soul",
            "logo_url": "https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png",
            "contact_phone": "(404) 855-5524",
            "contact_email": "info@finandfeathersrestaurants.com",
            "contact_address": "Multiple Locations across Georgia & Las Vegas",
            "social_feed_images": [
                {"url": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6608.jpg", "caption": "F&F Signature Wings"},
                {"url": "https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Shrimp-Grits-scaled.jpg", "caption": "Shrimp & Grits"},
                {"url": "https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Malibu-Ribeye-scaled.jpg", "caption": "Malibu Ribeye"},
                {"url": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/a3e08521f140462cbedf10dedd32f879.jpeg", "caption": "Chicken & Waffle"}
            ]
        }
    return content


@api_router.put("/admin/homepage/content")
async def update_homepage_content(update: HomepageContentUpdate, username: str = Depends(get_current_admin)):
    """Update homepage content (admin only)"""
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.homepage_content.update_one(
        {"id": "homepage"},
        {"$set": update_dict},
        upsert=True
    )
    
    return {"message": "Homepage content updated"}


@api_router.get("/admin/homepage/content")
async def admin_get_homepage_content(username: str = Depends(get_current_admin)):
    """Get homepage content (admin)"""
    content = await db.homepage_content.find_one({"id": "homepage"}, {"_id": 0})
    if not content:
        # Return default content for editing
        return {
            "id": "homepage",
            "tagline": "Elevated dining meets Southern soul",
            "logo_url": "https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png",
            "contact_phone": "(404) 855-5524",
            "contact_email": "info@finandfeathersrestaurants.com",
            "contact_address": "Multiple Locations across Georgia & Las Vegas",
            "social_feed_images": [
                {"url": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6608.jpg", "caption": "F&F Signature Wings"},
                {"url": "https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Shrimp-Grits-scaled.jpg", "caption": "Shrimp & Grits"},
                {"url": "https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Malibu-Ribeye-scaled.jpg", "caption": "Malibu Ribeye"},
                {"url": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/a3e08521f140462cbedf10dedd32f879.jpeg", "caption": "Chicken & Waffle"}
            ]
        }
    return content


# VAPID Public Key endpoint
@api_router.get("/push/public-key")
async def get_vapid_public_key():
    return {"publicKey": push_service.get_public_key()}


# Loyalty Program Endpoints
@api_router.post("/loyalty/signup", response_model=LoyaltyMember)
async def signup_loyalty(member: LoyaltyMemberCreate):
    """Sign up for loyalty program"""
    # Check if email already exists
    existing = await db.loyalty_members.find_one({"email": member.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    member_dict = member.dict()
    loyalty_member = LoyaltyMember(**member_dict)
    await db.loyalty_members.insert_one(loyalty_member.dict())
    return loyalty_member


@api_router.post("/loyalty/subscribe-push/{member_id}")
async def subscribe_push(member_id: str, subscription: PushSubscription):
    """Subscribe to push notifications"""
    member = await db.loyalty_members.find_one({"id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    await db.loyalty_members.update_one(
        {"id": member_id},
        {"$set": {"push_subscription": subscription.dict()}}
    )
    return {"message": "Push subscription saved successfully"}


@api_router.get("/loyalty/members", response_model=List[LoyaltyMember])
async def get_loyalty_members():
    """Get all loyalty members (admin only - add auth in production)"""
    members = await db.loyalty_members.find().to_list(1000)
    return [LoyaltyMember(**member) for member in members]


# Push Notification Endpoints
@api_router.post("/notifications/send")
async def send_push_notification(notification: PushNotificationCreate):
    """Send push notification to subscribers (admin only - add auth in production)"""
    notification_data = {
        "title": notification.title,
        "body": notification.body,
        "icon": notification.icon,
        "image": notification.image,
        "url": notification.url
    }
    
    if notification.send_to_all:
        result = await push_service.send_to_all_subscribers(notification_data)
    else:
        result = {"sent": 0, "failed": 0, "total_subscribers": 0}
    
    # Save notification record
    push_notif = PushNotification(
        **notification.dict(exclude={'send_to_all'}),
        sent_to=[]
    )
    await db.push_notifications.insert_one(push_notif.dict())
    
    return {
        "message": "Push notifications sent",
        "result": result
    }


@api_router.get("/notifications/history", response_model=List[PushNotification])
async def get_notification_history():
    """Get push notification history (admin only - add auth in production)"""
    notifications = await db.push_notifications.find().sort("sent_at", -1).limit(50).to_list(50)
    return [PushNotification(**notif) for notif in notifications]


# Contact Form Endpoint
@api_router.post("/contact", response_model=ContactForm)
async def submit_contact_form(form: ContactFormCreate):
    """Submit contact form"""
    contact = ContactForm(**form.dict())
    await db.contact_forms.insert_one(contact.dict())
    return contact


# ==================== AUTH ENDPOINTS moved to routes/auth.py ====================


# ==================== ADMIN ENDPOINTS ====================

# Loyalty Members (Admin)
@api_router.get("/admin/loyalty-members", response_model=List[LoyaltyMember])
async def admin_get_loyalty_members(username: str = Depends(get_current_admin)):
    """Get all loyalty members (protected)"""
    members = await db.loyalty_members.find({}, {"_id": 0}).to_list(1000)
    return [LoyaltyMember(**member) for member in members]


@api_router.delete("/admin/loyalty-members/{member_id}")
async def admin_delete_loyalty_member(member_id: str, username: str = Depends(get_current_admin)):
    """Delete a loyalty member"""
    result = await db.loyalty_members.delete_one({"id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"message": "Member deleted successfully"}


# Contact Forms (Admin)
@api_router.get("/admin/contacts")
async def admin_get_contacts(username: str = Depends(get_current_admin)):
    """Get all contact form submissions"""
    contacts = await db.contact_forms.find({"is_deleted": {"$ne": True}}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return contacts


@api_router.patch("/admin/contacts/{contact_id}")
async def admin_update_contact(contact_id: str, update: ContactFormUpdate, username: str = Depends(get_current_admin)):
    """Update contact form status"""
    result = await db.contact_forms.update_one(
        {"id": contact_id, "is_deleted": {"$ne": True}},
        {"$set": {"status": update.status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact updated successfully"}


@api_router.delete("/admin/contacts/{contact_id}")
async def admin_delete_contact(contact_id: str, username: str = Depends(get_current_admin)):
    """Soft delete a contact form"""
    result = await db.contact_forms.update_one(
        {"id": contact_id, "is_deleted": {"$ne": True}},
        {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact deleted successfully"}


# Unified People Export (Admin) — merges loyalty, contacts, and check-ins into CSV
@api_router.get("/admin/people/export")
async def admin_export_people(username: str = Depends(get_current_admin)):
    """Export all contacts, loyalty members, and check-ins as CSV"""
    import csv
    import io

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Email", "Phone", "Source", "Status", "Location", "Message", "Date"])

    # Loyalty members
    members = await db.loyalty_members.find({}, {"_id": 0}).to_list(5000)
    for m in members:
        writer.writerow([
            m.get("name", ""),
            m.get("email", ""),
            m.get("phone", ""),
            "Loyalty Signup",
            "active",
            "",
            "",
            m.get("created_at", m.get("joined_at", ""))
        ])

    # Contact form submissions
    contacts = await db.contact_forms.find({"is_deleted": {"$ne": True}}, {"_id": 0}).to_list(5000)
    for c in contacts:
        writer.writerow([
            c.get("name", ""),
            c.get("email", ""),
            c.get("phone", ""),
            "Contact Form",
            c.get("status", "new"),
            "",
            c.get("message", ""),
            c.get("created_at", "")
        ])

    # Check-ins
    checkins = await db.checkins.find({}, {"_id": 0}).sort("checked_in_at", -1).to_list(5000)
    for ci in checkins:
        writer.writerow([
            ci.get("display_name", ""),
            "",
            "",
            "Check-in",
            "active",
            ci.get("location_slug", ""),
            ci.get("message", ci.get("mood", "")),
            ci.get("checked_in_at", "")
        ])

    csv_content = output.getvalue()
    output.close()

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=fin_feathers_contacts.csv"}
    )


# Unified People List (Admin) — merges loyalty, contacts, and check-ins
@api_router.get("/admin/people")
async def admin_get_people(username: str = Depends(get_current_admin)):
    """Get all people from loyalty, contacts, and check-ins combined"""
    people = []

    # Loyalty members
    members = await db.loyalty_members.find({}, {"_id": 0}).to_list(5000)
    for m in members:
        people.append({
            "id": m.get("id", ""),
            "name": m.get("name", ""),
            "email": m.get("email", ""),
            "phone": m.get("phone", ""),
            "source": "loyalty",
            "status": "active",
            "location": "",
            "message": "",
            "date": str(m.get("created_at", m.get("joined_at", "")))
        })

    # Contact form submissions
    contacts = await db.contact_forms.find({"is_deleted": {"$ne": True}}, {"_id": 0}).to_list(5000)
    for c in contacts:
        people.append({
            "id": c.get("id", ""),
            "name": c.get("name", ""),
            "email": c.get("email", ""),
            "phone": c.get("phone", ""),
            "source": "contact",
            "status": c.get("status", "new"),
            "location": "",
            "message": c.get("message", ""),
            "date": str(c.get("created_at", ""))
        })

    # Check-ins
    checkins = await db.checkins.find({}, {"_id": 0}).sort("checked_in_at", -1).to_list(5000)
    for ci in checkins:
        people.append({
            "id": ci.get("id", ""),
            "name": ci.get("display_name", ""),
            "email": "",
            "phone": "",
            "source": "checkin",
            "status": "active",
            "location": ci.get("location_slug", ""),
            "message": ci.get("message", ci.get("mood", "")),
            "date": str(ci.get("checked_in_at", ""))
        })

    # Sort all by date descending
    people.sort(key=lambda x: x.get("date", ""), reverse=True)
    return people


# Page Content (Public)
@api_router.get("/page-content/{page_key}")
async def get_page_content(page_key: str):
    content = await db.page_content.find({"page_key": page_key}, {"_id": 0}).to_list(100)
    return content


# Page Content (Admin)
@api_router.put("/admin/page-content/{page_key}/{section_key}")
async def update_page_content(page_key: str, section_key: str, update: PageContentUpdate, username: str = Depends(get_current_admin)):
    update_doc = {
        "page_key": page_key,
        "section_key": section_key,
        "html": update.html,
        "updated_at": datetime.now(timezone.utc)
    }
    await db.page_content.update_one(
        {"page_key": page_key, "section_key": section_key},
        {"$set": update_doc, "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    return {"success": True}


# Daily Specials (Public)
@api_router.get("/daily-specials")
async def get_daily_specials():
    specials = await db.daily_specials.find({}, {"_id": 0}).to_list(20)
    return specials


# Daily Specials (Admin)
@api_router.get("/admin/daily-specials")
async def admin_get_daily_specials(username: str = Depends(get_current_admin)):
    specials = await db.daily_specials.find({}, {"_id": 0}).to_list(20)
    return specials


@api_router.put("/admin/daily-specials")
async def admin_update_daily_specials(request: Request, username: str = Depends(get_current_admin)):
    body = await request.json()
    if not isinstance(body, list):
        raise HTTPException(status_code=400, detail="Expected a list of daily specials")

    updated = 0
    for item in body:
        try:
            update = DailySpecialUpdate(**item)
        except Exception:
            continue
        update_doc = {
            "day_index": update.day_index,
            "name": update.name,
            "description": update.description,
            "hours": update.hours,
            "emoji": update.emoji,
            "specials": item.get("specials", []),  # Support multiple specials per day
            "updated_at": datetime.now(timezone.utc)
        }
        await db.daily_specials.update_one(
            {"day_index": update.day_index},
            {"$set": update_doc, "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc)}},
            upsert=True
        )
        updated += 1

    return {"updated": updated}


# Weekly Videos (Public)
@api_router.get("/weekly-videos")
async def get_weekly_videos():
    videos = await db.weekly_videos.find({}, {"_id": 0}).sort("day_index", 1).to_list(7)
    return videos


# Weekly Videos (Admin)
@api_router.get("/admin/weekly-videos")
async def admin_get_weekly_videos(username: str = Depends(get_current_admin)):
    videos = await db.weekly_videos.find({}, {"_id": 0}).sort("day_index", 1).to_list(7)
    return videos


@api_router.put("/admin/weekly-videos")
async def admin_update_weekly_videos(request: Request, username: str = Depends(get_current_admin)):
    body = await request.json()
    if not isinstance(body, list):
        raise HTTPException(status_code=400, detail="Expected a list of weekly video entries")

    updated = 0
    for item in body:
        day_index = item.get("day_index")
        if day_index is None or not isinstance(day_index, int) or day_index < 0 or day_index > 6:
            continue
        video_urls = item.get("video_urls", [])
        if not isinstance(video_urls, list):
            continue

        await db.weekly_videos.update_one(
            {"day_index": day_index},
            {"$set": {
                "day_index": day_index,
                "video_urls": video_urls,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }, "$setOnInsert": {
                "id": str(uuid.uuid4()),
                "created_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        updated += 1

    return {"updated": updated}


# Menu Category Display Settings
@api_router.get("/menu-category-styles")
async def get_menu_category_styles():
    """Get display style settings for each menu category"""
    settings = await db.menu_settings.find_one({"type": "category_styles"}, {"_id": 0})
    if settings:
        return settings.get("styles", {})
    return {}


@api_router.get("/admin/menu-category-styles")
async def admin_get_menu_category_styles(username: str = Depends(get_current_admin)):
    """Admin: Get display style settings for each menu category"""
    settings = await db.menu_settings.find_one({"type": "category_styles"}, {"_id": 0})
    if settings:
        return settings.get("styles", {})
    return {}


@api_router.put("/admin/menu-category-styles")
async def admin_update_menu_category_styles(request: Request, username: str = Depends(get_current_admin)):
    """Admin: Update display style for menu categories"""
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Expected a dictionary of category styles")
    
    await db.menu_settings.update_one(
        {"type": "category_styles"},
        {
            "$set": {
                "type": "category_styles",
                "styles": body,
                "updated_at": datetime.now(timezone.utc)
            },
            "$setOnInsert": {"created_at": datetime.now(timezone.utc)}
        },
        upsert=True
    )
    return {"success": True, "styles": body}


# Menu Items (Admin)
@api_router.get("/admin/menu-items")
async def admin_get_menu_items(location_slug: str = None, username: str = Depends(get_current_admin)):
    """Get menu items for admin, optionally filtered by location"""
    query = {}
    if location_slug:
        query["location_slug"] = location_slug
    items = await db.menu_items.find(query, {"_id": 0}).to_list(2000)
    return items


@api_router.post("/admin/menu-items")
async def admin_create_menu_item(item: MenuItemCreate, username: str = Depends(get_current_admin)):
    """Create a new menu item"""
    item_dict = item.dict()
    item_dict["id"] = str(uuid.uuid4())
    await db.menu_items.insert_one(item_dict)
    item_dict.pop("_id", None)
    return {**item_dict}


@api_router.put("/admin/menu-items/{item_id}")
async def admin_update_menu_item(item_id: str, update: MenuItemUpdate, username: str = Depends(get_current_admin)):
    """Update a menu item. Optionally sync changes to all locations with the same item name."""
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    
    # Extract sync flag (not a DB field)
    sync_all = update_dict.pop("sync_all_locations", None)
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Get the original item to check the name (for cross-location sync)
    original = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    if not original:
        raise HTTPException(status_code=404, detail="Menu item not found")

    # Update the specific item
    result = await db.menu_items.update_one(
        {"id": item_id},
        {"$set": update_dict}
    )

    synced_count = 0
    # If sync_all is true, propagate ALL changed fields to items with same name at other locations
    if sync_all and original.get("name"):
        sync_fields = {k: v for k, v in update_dict.items() if k not in ("location_slug", "id")}
        if sync_fields:
            sync_result = await db.menu_items.update_many(
                {"name": original["name"], "id": {"$ne": item_id}},
                {"$set": sync_fields}
            )
            synced_count = sync_result.modified_count
    else:
        # Legacy behavior: auto-sync only image changes
        image_changed = "image" in update_dict or "image_url" in update_dict
        if image_changed:
            new_image = update_dict.get("image") or update_dict.get("image_url")
            if new_image and original.get("name"):
                sync_result = await db.menu_items.update_many(
                    {"name": original["name"], "id": {"$ne": item_id}},
                    {"$set": {"image": new_image, "image_url": new_image}}
                )
                synced_count = sync_result.modified_count

    return {
        "message": "Menu item updated successfully",
        "synced_locations": synced_count
    }


@api_router.delete("/admin/menu-items/{item_id}")
async def admin_delete_menu_item(item_id: str, username: str = Depends(get_current_admin)):
    """Delete a menu item"""
    result = await db.menu_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"message": "Menu item deleted successfully"}


@api_router.post("/admin/menu-items/bulk-update-images")
async def admin_bulk_update_menu_images(request: Request, username: str = Depends(get_current_admin)):
    """Bulk update menu item images by category or individual items"""
    updates = await request.json()
    updated_count = 0
    for update in updates:
        if "category" in update and "image_url" in update:
            # Update all items in a category
            result = await db.menu_items.update_many(
                {"category": update["category"]},
                {"$set": {"image_url": update["image_url"]}}
            )
            updated_count += result.modified_count
        elif "id" in update and "image_url" in update:
            # Update specific item
            result = await db.menu_items.update_one(
                {"id": update["id"]},
                {"$set": {"image_url": update["image_url"]}}
            )
            updated_count += result.modified_count
        elif "name" in update and "image_url" in update:
            # Update by name (partial match)
            result = await db.menu_items.update_one(
                {"name": {"$regex": update["name"], "$options": "i"}},
                {"$set": {"image_url": update["image_url"]}}
            )
            updated_count += result.modified_count
    return {"message": f"Updated {updated_count} menu items"}


@api_router.post("/admin/menu-items/copy-to-locations")
async def admin_copy_menu_to_locations(username: str = Depends(get_current_admin)):
    """Copy all menu items without a location_slug to every location (except hibachi-food-truck)"""
    # Get all locations except hibachi
    locations = await db.locations.find(
        {"slug": {"$ne": "hibachi-food-truck"}},
        {"_id": 0, "slug": 1}
    ).to_list(50)
    location_slugs = [loc["slug"] for loc in locations]

    # Get source items (those without a location_slug — the "master" menu)
    source_items = await db.menu_items.find(
        {"$or": [{"location_slug": None}, {"location_slug": {"$exists": False}}]},
        {"_id": 0}
    ).to_list(2000)

    if not source_items:
        return {"message": "No source menu items found", "created": 0}

    created = 0
    for slug in location_slugs:
        # Check if this location already has menu items
        existing = await db.menu_items.count_documents({"location_slug": slug})
        if existing > 0:
            continue  # Skip — already has a menu

        new_items = []
        for item in source_items:
            new_item = {**item}
            new_item["id"] = str(uuid.uuid4())
            new_item["location_slug"] = slug
            new_items.append(new_item)

        if new_items:
            await db.menu_items.insert_many(new_items)
            created += len(new_items)

    return {"message": f"Copied menu to {len(location_slugs)} locations", "created": created}


@api_router.post("/admin/menu-items/sync-images-to-locations")
async def admin_sync_images_to_locations(username: str = Depends(get_current_admin)):
    """Sync images from the master menu (no location_slug) to all location copies by item name."""
    # Get master items
    master_items = await db.menu_items.find(
        {"$or": [{"location_slug": None}, {"location_slug": {"$exists": False}}]},
        {"_id": 0}
    ).to_list(2000)

    if not master_items:
        return {"message": "No master menu items found", "synced": 0}

    synced = 0
    for item in master_items:
        image = item.get("image") or item.get("image_url")
        if not image:
            continue
        result = await db.menu_items.update_many(
            {"name": item["name"], "location_slug": {"$ne": None, "$exists": True}},
            {"$set": {"image": image, "image_url": image}}
        )
        synced += result.modified_count

    return {"message": f"Synced images for {len(master_items)} master items", "synced": synced}


@api_router.post("/admin/menu-items/convert-external-images")
async def admin_convert_external_images(username: str = Depends(get_current_admin)):
    """Download ALL external/old images and store them in local /api/media/ storage.
    Processes unique image URLs only, then updates all items sharing that URL."""
    # Get all items with external URLs
    all_items = await db.menu_items.find({}, {"_id": 0, "id": 1, "name": 1, "image": 1, "image_url": 1}).to_list(5000)

    # Build a map of unique external URLs -> list of item IDs
    url_to_ids = {}
    for item in all_items:
        img = item.get("image") or item.get("image_url") or ""
        # Skip if already local /api/media/ or empty
        if not img or img.startswith("/api/media/"):
            continue
        # External http URLs and old /api/uploads/ paths need conversion
        if img.startswith("http") or img.startswith("/api/uploads/"):
            if img not in url_to_ids:
                url_to_ids[img] = []
            url_to_ids[img].append(item["id"])

    converted = 0
    failed = 0
    for url, item_ids in url_to_ids.items():
        try:
            stored_url = await download_image_to_uploads(url)
            if stored_url:
                # Update all items using this URL
                await db.menu_items.update_many(
                    {"id": {"$in": item_ids}},
                    {"$set": {"image": stored_url, "image_url": stored_url}}
                )
                converted += len(item_ids)
        except Exception as e:
            failed += 1

    return {"message": f"Converted {converted} images, {failed} failed", "converted": converted, "failed": failed}


@api_router.post("/admin/menu-items/store-images")
async def admin_store_menu_images(request: Request, username: str = Depends(get_current_admin)):
    """Download external menu item images and store them locally"""
    body = await request.json() if request else {}
    categories = body.get("categories") if isinstance(body, dict) else None

    query = {}
    if categories:
        query["category"] = {"$in": categories}

    items = await db.menu_items.find(query, {"_id": 0}).to_list(1000)
    updated = 0
    skipped = 0

    for item in items:
        image_url = item.get("image") or item.get("image_url")
        if not image_url or not isinstance(image_url, str):
            skipped += 1
            continue

        if image_url.startswith("/api/uploads/"):
            skipped += 1
            continue

        if not image_url.startswith("http"):
            skipped += 1
            continue

        stored_url = await download_image_to_uploads(image_url)
        if stored_url:
            await db.menu_items.update_one(
                {"id": item["id"]},
                {"$set": {"image": stored_url, "image_url": stored_url}}
            )
            updated += 1

    return {"updated": updated, "skipped": skipped}


# Push Notifications (Admin - Protected versions)
@api_router.post("/admin/notifications/send")
async def admin_send_notification(notification: PushNotificationCreate, username: str = Depends(get_current_admin)):
    """Send push notification (protected)"""
    notification_data = {
        "title": notification.title,
        "body": notification.body,
        "icon": notification.icon,
        "image": notification.image,
        "url": notification.url
    }
    
    if notification.send_to_all:
        result = await push_service.send_to_all_subscribers(notification_data)
    else:
        result = {"sent": 0, "failed": 0, "total_subscribers": 0}
    
    # Save notification record
    push_notif = PushNotification(
        **notification.dict(exclude={'send_to_all'}),
        sent_to=[]
    )
    await db.push_notifications.insert_one(push_notif.dict())
    
    return {
        "message": "Push notifications sent",
        "result": result
    }


@api_router.get("/admin/notifications/history")
async def admin_get_notification_history(username: str = Depends(get_current_admin)):
    """Get push notification history (protected)"""
    notifications = await db.push_notifications.find({}, {"_id": 0}).sort("sent_at", -1).limit(50).to_list(50)
    return notifications


# Dashboard Stats (Admin)
@api_router.get("/admin/stats")
async def admin_get_stats(username: str = Depends(get_current_admin)):
    """Get dashboard statistics"""
    loyalty_count = await db.loyalty_members.count_documents({})
    contacts_count = await db.contact_forms.count_documents({"is_deleted": {"$ne": True}})
    new_contacts_count = await db.contact_forms.count_documents({"status": "new", "is_deleted": {"$ne": True}})
    menu_items_count = await db.menu_items.count_documents({})
    notifications_count = await db.push_notifications.count_documents({})
    specials_count = await db.specials.count_documents({"is_active": True})
    
    return {
        "loyalty_members": loyalty_count,
        "total_contacts": contacts_count,
        "new_contacts": new_contacts_count,
        "menu_items": menu_items_count,
        "notifications_sent": notifications_count,
        "active_specials": specials_count
    }


# ==================== SPECIALS ENDPOINTS ====================

# Public endpoint to get active specials
@api_router.get("/specials")
async def get_public_specials():
    """Get all active specials for public display"""
    now = datetime.now(timezone.utc)
    specials = await db.specials.find(
        {
            "is_active": True,
            "$or": [
                {"valid_until": None},
                {"valid_until": {"$gte": now}}
            ]
        },
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return specials


# Admin: Get all specials
@api_router.get("/admin/specials")
async def admin_get_specials(username: str = Depends(get_current_admin)):
    """Get all specials (including inactive)"""
    specials = await db.specials.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return specials


# Admin: Create and post a special (with auto push notification)
@api_router.post("/admin/specials")
async def admin_create_special(special: SpecialCreate, username: str = Depends(get_current_admin)):
    """Create a new special and optionally send push notification"""
    special_dict = special.dict()
    special_dict["id"] = str(uuid.uuid4())
    special_dict["is_active"] = True
    special_dict["created_at"] = datetime.now(timezone.utc)
    special_dict["notification_sent"] = False
    special_dict["notification_sent_at"] = None
    
    # Remove the send_notification flag before storing
    send_notification = special_dict.pop("send_notification", True)
    
    # Save the special
    await db.specials.insert_one(special_dict)
    
    notification_result = None
    
    # Send push notification if requested
    if send_notification:
        notification_data = {
            "title": f"🎉 {special.title}",
            "body": special.description[:100] + ("..." if len(special.description) > 100 else ""),
            "icon": "/logo192.png",
            "image": special.image,
            "url": "/"
        }
        
        notification_result = await push_service.send_to_all_subscribers(notification_data)
        
        # Update special with notification info
        await db.specials.update_one(
            {"id": special_dict["id"]},
            {
                "$set": {
                    "notification_sent": True,
                    "notification_sent_at": datetime.now(timezone.utc)
                }
            }
        )
        special_dict["notification_sent"] = True
        special_dict["notification_sent_at"] = datetime.now(timezone.utc)
        
        # Also save to push notifications history
        push_notif = PushNotification(
            title=notification_data["title"],
            body=notification_data["body"],
            icon=notification_data["icon"],
            image=notification_data.get("image"),
            url=notification_data["url"],
            sent_to=[]
        )
        await db.push_notifications.insert_one(push_notif.dict())
    
    # Remove MongoDB _id if present
    special_dict.pop("_id", None)
    
    return {
        "special": special_dict,
        "notification_result": notification_result
    }


# Admin: Update a special
@api_router.put("/admin/specials/{special_id}")
async def admin_update_special(special_id: str, update: SpecialUpdate, username: str = Depends(get_current_admin)):
    """Update a special"""
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.specials.update_one(
        {"id": special_id},
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Special not found")
    return {"message": "Special updated successfully"}


# Admin: Delete a special
@api_router.delete("/admin/specials/{special_id}")
async def admin_delete_special(special_id: str, username: str = Depends(get_current_admin)):
    """Delete a special"""
    result = await db.specials.delete_one({"id": special_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Special not found")
    return {"message": "Special deleted successfully"}


# Admin: Resend notification for a special
@api_router.post("/admin/specials/{special_id}/notify")
async def admin_resend_special_notification(special_id: str, username: str = Depends(get_current_admin)):
    """Resend push notification for a special"""
    special = await db.specials.find_one({"id": special_id}, {"_id": 0})
    if not special:
        raise HTTPException(status_code=404, detail="Special not found")
    
    notification_data = {
        "title": f"🎉 {special['title']}",
        "body": special['description'][:100] + ("..." if len(special['description']) > 100 else ""),
        "icon": "/logo192.png",
        "image": special.get("image"),
        "url": "/"
    }
    
    result = await push_service.send_to_all_subscribers(notification_data)
    
    # Update notification timestamp
    await db.specials.update_one(
        {"id": special_id},
        {
            "$set": {
                "notification_sent": True,
                "notification_sent_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {
        "message": "Notification sent",
        "result": result
    }


# ==================== SOCIAL LINKS ENDPOINTS ====================

# Public: Get active social links
@api_router.get("/social-links")
async def get_public_social_links():
    """Get all active social links"""
    links = await db.social_links.find(
        {"is_active": True}, 
        {"_id": 0}
    ).sort("display_order", 1).to_list(100)
    return links


# Admin: Get all social links
@api_router.get("/admin/social-links")
async def admin_get_social_links(username: str = Depends(get_current_admin)):
    """Get all social links"""
    links = await db.social_links.find({}, {"_id": 0}).sort("display_order", 1).to_list(100)
    return links


# Admin: Create social link
@api_router.post("/admin/social-links")
async def admin_create_social_link(link: SocialLinkCreate, username: str = Depends(get_current_admin)):
    """Create a new social link"""
    link_dict = link.dict()
    link_dict["id"] = str(uuid.uuid4())
    link_dict["is_active"] = True
    link_dict["created_at"] = datetime.now(timezone.utc)
    await db.social_links.insert_one(link_dict)
    link_dict.pop("_id", None)
    return link_dict


# Admin: Update social link
@api_router.put("/admin/social-links/{link_id}")
async def admin_update_social_link(link_id: str, update: SocialLinkUpdate, username: str = Depends(get_current_admin)):
    """Update a social link"""
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.social_links.update_one({"id": link_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Social link not found")
    return {"message": "Social link updated"}


# Admin: Delete social link
@api_router.delete("/admin/social-links/{link_id}")
async def admin_delete_social_link(link_id: str, username: str = Depends(get_current_admin)):
    """Delete a social link"""
    result = await db.social_links.delete_one({"id": link_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Social link not found")
    return {"message": "Social link deleted"}


# ==================== INSTAGRAM FEED ENDPOINTS ====================

# Public: Get active Instagram posts
@api_router.get("/instagram-feed")
async def get_public_instagram_feed():
    """Get Instagram posts for public display"""
    posts = await db.instagram_posts.find(
        {"is_active": True},
        {"_id": 0}
    ).sort("display_order", 1).to_list(20)
    return posts


# Admin: Get all Instagram posts
@api_router.get("/admin/instagram-posts")
async def admin_get_instagram_posts(username: str = Depends(get_current_admin)):
    """Get all Instagram posts"""
    posts = await db.instagram_posts.find({}, {"_id": 0}).sort("display_order", 1).to_list(100)
    return posts


# Admin: Create Instagram post
@api_router.post("/admin/instagram-posts")
async def admin_create_instagram_post(post: InstagramPostCreate, username: str = Depends(get_current_admin)):
    """Add an Instagram post to the feed"""
    post_dict = post.dict()
    post_dict["id"] = str(uuid.uuid4())
    post_dict["is_active"] = True
    post_dict["created_at"] = datetime.now(timezone.utc)
    await db.instagram_posts.insert_one(post_dict)
    post_dict.pop("_id", None)
    return post_dict


# Admin: Update Instagram post
@api_router.put("/admin/instagram-posts/{post_id}")
async def admin_update_instagram_post(post_id: str, update: InstagramPostUpdate, username: str = Depends(get_current_admin)):
    """Update an Instagram post"""
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.instagram_posts.update_one({"id": post_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Instagram post not found")
    return {"message": "Instagram post updated"}


# Admin: Delete Instagram post
@api_router.delete("/admin/instagram-posts/{post_id}")
async def admin_delete_instagram_post(post_id: str, username: str = Depends(get_current_admin)):
    """Delete an Instagram post"""
    result = await db.instagram_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Instagram post not found")
    return {"message": "Instagram post deleted"}


# File Upload (Admin)
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
ALLOWED_VIDEO_EXTENSIONS = {'.mp4', '.mov', '.webm', '.avi'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50MB

async def download_image_to_uploads(image_url: str):
    """Download external image and store in MongoDB media_files (production-safe)."""
    if not image_url:
        return None

    try:
        # Handle local /api/uploads/ paths by reading from disk
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

        # Store in MongoDB for production persistence
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

        # Also save to disk for preview
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

@api_router.post("/admin/upload")
async def admin_upload_file(
    file: UploadFile = File(...),
    username: str = Depends(get_current_admin)
):
    """Upload an image file - stores in MongoDB for production persistence"""
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Generate unique file ID
    file_id = str(uuid.uuid4())
    unique_filename = f"{file_id}{file_ext}"
    
    try:
        # Read file contents
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
        
        # Store in MongoDB as Base64 for production persistence
        base64_data = base64.b64encode(contents).decode('utf-8')
        content_type = file.content_type or f"image/{file_ext[1:]}"
        
        await db.media_files.insert_one({
            "file_id": file_id,
            "filename": unique_filename,
            "data": base64_data,
            "content_type": content_type,
            "size": len(contents),
            "uploaded_at": datetime.now(timezone.utc),
            "uploaded_by": username
        })
        
        # Also save to local disk for preview environment
        try:
            file_path = UPLOAD_DIR / unique_filename
            with open(file_path, "wb") as f:
                f.write(contents)
        except Exception:
            pass  # Local save may fail in production, that's ok
        
        # Return the media URL (works in both preview and production)
        return {
            "filename": unique_filename,
            "url": f"/api/media/{file_id}",
            "legacy_url": f"/api/uploads/{unique_filename}",  # For backward compatibility
            "size": len(contents)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")


@api_router.post("/admin/upload/video")
async def admin_upload_video(
    file: UploadFile = File(...),
    username: str = Depends(get_current_admin)
):
    """Upload a video file for promo carousel - stores in MongoDB for production"""
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Video type not allowed. Allowed types: {', '.join(ALLOWED_VIDEO_EXTENSIONS)}"
        )
    
    file_id = str(uuid.uuid4())
    unique_filename = f"{file_id}{file_ext}"
    
    try:
        contents = await file.read()
        if len(contents) > MAX_VIDEO_SIZE:
            raise HTTPException(status_code=400, detail="Video too large. Maximum size is 50MB")
        
        # Store in MongoDB as Base64
        base64_data = base64.b64encode(contents).decode('utf-8')
        content_type = file.content_type or f"video/{file_ext[1:]}"
        
        await db.media_files.insert_one({
            "file_id": file_id,
            "filename": unique_filename,
            "data": base64_data,
            "content_type": content_type,
            "size": len(contents),
            "type": "video",
            "uploaded_at": datetime.now(timezone.utc),
            "uploaded_by": username
        })
        
        # Also save locally for preview
        try:
            file_path = UPLOAD_DIR / unique_filename
            with open(file_path, "wb") as f:
                f.write(contents)
        except Exception:
            pass
        
        return {
            "filename": unique_filename,
            "url": f"/api/media/{file_id}",
            "legacy_url": f"/api/uploads/{unique_filename}",
            "size": len(contents)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save video: {str(e)}")


@api_router.get("/admin/uploads")
async def admin_list_uploads(username: str = Depends(get_current_admin)):
    """List all uploaded files from both local and MongoDB"""
    files = []
    
    # Get files from MongoDB (production-ready)
    db_files = await db.media_files.find({}, {"_id": 0, "data": 0}).to_list(500)
    for f in db_files:
        files.append({
            "filename": f.get("filename", ""),
            "url": f"/api/media/{f.get('file_id', '')}",
            "size": f.get("size", 0),
            "source": "mongodb"
        })
    
    # Also check local uploads directory (for preview environment)
    try:
        for f in UPLOAD_DIR.iterdir():
            if f.is_file() and f.suffix.lower() in ALLOWED_EXTENSIONS:
                # Check if already in list from MongoDB
                if not any(file.get("filename") == f.name for file in files):
                    files.append({
                        "filename": f.name,
                        "url": f"/api/uploads/{f.name}",
                        "size": f.stat().st_size,
                        "source": "local"
                    })
    except Exception:
        pass  # Directory may not exist in production
    
    return files


@api_router.delete("/admin/uploads/{filename}")
async def admin_delete_upload(filename: str, username: str = Depends(get_current_admin)):
    """Delete an uploaded file from both local and MongoDB"""
    deleted = False
    
    # Try to delete from MongoDB
    file_id = filename.rsplit('.', 1)[0] if '.' in filename else filename
    result = await db.media_files.delete_one({"$or": [{"file_id": file_id}, {"filename": filename}]})
    if result.deleted_count > 0:
        deleted = True
    
    # Also try to delete from local
    try:
        file_path = UPLOAD_DIR / filename
        if file_path.exists():
            file_path.unlink()
            deleted = True
    except Exception:
        pass
    
    if not deleted:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {"message": "File deleted successfully"}


# =====================================================
# LOCATION CHECK-IN ENDPOINTS
# =====================================================

@api_router.post("/checkin", response_model=CheckInResponse)
async def check_in(checkin_data: CheckInCreate):
    """Check in at a location"""
    # Auto-expire after 4 hours
    expires_at = datetime.now(timezone.utc) + timedelta(hours=4)

    # Remove existing check-in for same user at same location
    if checkin_data.user_profile_id:
        await db.checkins.delete_many({
            "user_profile_id": checkin_data.user_profile_id,
            "location_slug": checkin_data.location_slug
        })

    checkin = CheckIn(
        id=str(uuid.uuid4()),
        location_slug=checkin_data.location_slug,
        display_name=checkin_data.display_name,
        avatar_emoji=checkin_data.avatar_emoji,
        mood=checkin_data.mood,
        message=checkin_data.message,
        selfie_url=checkin_data.selfie_url,
        checked_in_at=datetime.now(timezone.utc),
        expires_at=expires_at
    )

    checkin_dict = checkin.model_dump()
    checkin_dict["user_profile_id"] = checkin_data.user_profile_id
    await db.checkins.insert_one(checkin_dict)

    return CheckInResponse(
        id=checkin.id,
        location_slug=checkin.location_slug,
        display_name=checkin.display_name,
        avatar_emoji=checkin.avatar_emoji,
        mood=checkin.mood,
        message=checkin.message,
        selfie_url=checkin.selfie_url,
        checked_in_at=checkin.checked_in_at,
        user_profile_id=checkin_data.user_profile_id
    )

@api_router.get("/checkin/{location_slug}", response_model=List[CheckInResponse])
async def get_checked_in_users(location_slug: str):
    """Get all users currently checked in at a location, including the live DJ"""
    # Clean up expired check-ins
    await db.checkins.delete_many({
        "expires_at": {"$lt": datetime.now(timezone.utc)}
    })
    
    # Get active check-ins for this location
    checkins = await db.checkins.find(
        {"location_slug": location_slug},
        {"_id": 0}
    ).sort("checked_in_at", -1).to_list(100)

    # Also include the checked-in DJ (from dj_profiles) if present
    live_dj = await db.dj_profiles.find_one(
        {"current_location": location_slug, "is_active": True},
        {"_id": 0}
    )
    if live_dj:
        dj_checkin_id = f"dj-{live_dj.get('id', '')}"
        # Only add if DJ isn't already in the checkins list
        existing_ids = {c.get("id") for c in checkins}
        existing_profile_ids = {c.get("user_profile_id") for c in checkins}
        if dj_checkin_id not in existing_ids and live_dj.get("id") not in existing_profile_ids:
            checkins.insert(0, {
                "id": dj_checkin_id,
                "location_slug": location_slug,
                "display_name": f"DJ {live_dj.get('stage_name') or live_dj.get('name', 'Unknown')}",
                "avatar_emoji": live_dj.get("avatar_emoji", "🎧"),
                "mood": "🎵 Live DJ",
                "message": "",
                "user_profile_id": live_dj.get("id", ""),
                "checked_in_at": live_dj.get("checked_in_at", datetime.now(timezone.utc).isoformat()),
                "expires_at": (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat()
            })
    
    return [CheckInResponse(**c) for c in checkins]

@api_router.delete("/checkin/{checkin_id}")
async def check_out(checkin_id: str):
    """Check out from a location"""
    result = await db.checkins.delete_one({"id": checkin_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Check-in not found")
    return {"message": "Checked out successfully"}

@api_router.get("/checkin/count/{location_slug}")
async def get_checkin_count(location_slug: str):
    """Get the count of people checked in at a location"""
    # Clean up expired check-ins
    await db.checkins.delete_many({
        "expires_at": {"$lt": datetime.now(timezone.utc)}
    })
    
    count = await db.checkins.count_documents({"location_slug": location_slug})
    return {"location_slug": location_slug, "count": count}


# =====================================================
# GALLERY ENDPOINTS
# =====================================================

# Public: Get active gallery items
@api_router.get("/gallery")
async def get_public_gallery(location_slug: str = None):
    """Get all active gallery items for public display, optionally filtered by location"""
    query = {"is_active": True}
    if location_slug:
        query["location_slug"] = location_slug
    items = await db.gallery_items.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return items


# Admin: Get all gallery items
@api_router.get("/admin/gallery")
async def admin_get_gallery(username: str = Depends(get_current_admin)):
    """Get all gallery items (including inactive)"""
    items = await db.gallery_items.find({}, {"_id": 0}).sort("display_order", 1).to_list(100)
    return items


# Admin: Create gallery item
@api_router.post("/admin/gallery")
async def admin_create_gallery_item(item: GalleryItemCreate, username: str = Depends(get_current_admin)):
    """Add a new gallery item"""
    item_dict = item.dict()
    item_dict["id"] = str(uuid.uuid4())
    item_dict["is_active"] = True
    item_dict["created_at"] = datetime.now(timezone.utc)
    await db.gallery_items.insert_one(item_dict)
    item_dict.pop("_id", None)
    return item_dict


# Admin: Update gallery item
@api_router.put("/admin/gallery/{item_id}")
async def admin_update_gallery_item(item_id: str, update: GalleryItemUpdate, username: str = Depends(get_current_admin)):
    """Update a gallery item"""
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.gallery_items.update_one({"id": item_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    return {"message": "Gallery item updated"}


# Admin: Delete gallery item
@api_router.delete("/admin/gallery/{item_id}")
async def admin_delete_gallery_item(item_id: str, username: str = Depends(get_current_admin)):
    """Delete a gallery item"""
    result = await db.gallery_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    return {"message": "Gallery item deleted"}


# =====================================================
# SOCIAL WALL ENDPOINTS
# =====================================================

@api_router.post("/social/posts", response_model=SocialPostResponse)
async def create_social_post(post: SocialPostCreate):
    """Create a post on the social wall for a location"""
    # Verify the check-in exists and is active
    checkin = await db.checkins.find_one({"id": post.checkin_id})
    if not checkin:
        raise HTTPException(status_code=400, detail="You must be checked in to post")
    
    post_dict = post.dict()
    post_dict["id"] = str(uuid.uuid4())
    post_dict["likes"] = []
    post_dict["created_at"] = datetime.now(timezone.utc)
    # Include author's selfie from check-in if available
    post_dict["author_selfie"] = checkin.get("selfie_url") or post.author_selfie
    
    await db.social_posts.insert_one(post_dict)
    
    return SocialPostResponse(
        id=post_dict["id"],
        location_slug=post_dict["location_slug"],
        checkin_id=post_dict["checkin_id"],
        author_name=post_dict["author_name"],
        author_emoji=post_dict["author_emoji"],
        author_selfie=post_dict.get("author_selfie"),
        message=post_dict["message"],
        image_url=post_dict.get("image_url"),
        likes_count=0,
        liked_by_me=False,
        created_at=post_dict["created_at"]
    )


@api_router.get("/social/posts/{location_slug}")
async def get_social_posts(location_slug: str, my_checkin_id: Optional[str] = None):
    """Get all posts for a location's social wall"""
    posts = await db.social_posts.find(
        {"location_slug": location_slug},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    result = []
    for post in posts:
        liked_by_me = my_checkin_id in post.get("likes", []) if my_checkin_id else False
        result.append(SocialPostResponse(
            id=post["id"],
            location_slug=post["location_slug"],
            checkin_id=post["checkin_id"],
            author_name=post["author_name"],
            author_emoji=post["author_emoji"],
            author_selfie=post.get("author_selfie"),
            message=post["message"],
            image_url=post.get("image_url"),
            likes_count=len(post.get("likes", [])),
            liked_by_me=liked_by_me,
            created_at=post["created_at"]
        ))
    
    return result


@api_router.post("/social/posts/{post_id}/like")
async def like_post(post_id: str, checkin_id: str):
    """Like or unlike a post"""
    post = await db.social_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    likes = post.get("likes", [])
    if checkin_id in likes:
        # Unlike
        likes.remove(checkin_id)
        action = "unliked"
    else:
        # Like
        likes.append(checkin_id)
        action = "liked"
    
    await db.social_posts.update_one(
        {"id": post_id},
        {"$set": {"likes": likes}}
    )
    
    return {"action": action, "likes_count": len(likes)}


@api_router.delete("/social/posts/{post_id}")
async def delete_social_post(post_id: str, checkin_id: str):
    """Delete your own post"""
    post = await db.social_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post["checkin_id"] != checkin_id:
        raise HTTPException(status_code=403, detail="You can only delete your own posts")
    
    await db.social_posts.delete_one({"id": post_id})
    return {"message": "Post deleted"}


# =====================================================
# DIRECT MESSAGES ENDPOINTS
# =====================================================

@api_router.post("/social/dm", response_model=DirectMessageResponse)
async def send_direct_message(dm: DirectMessageCreate):
    """Send a direct message to another checked-in user"""
    # Verify both check-ins exist
    from_checkin = await db.checkins.find_one({"id": dm.from_checkin_id})
    to_checkin = await db.checkins.find_one({"id": dm.to_checkin_id})
    
    if not from_checkin:
        raise HTTPException(status_code=400, detail="You must be checked in to send messages")
    if not to_checkin:
        raise HTTPException(status_code=400, detail="Recipient is no longer checked in")
    
    dm_dict = dm.dict()
    dm_dict["id"] = str(uuid.uuid4())
    dm_dict["read"] = False
    dm_dict["created_at"] = datetime.now(timezone.utc)
    
    await db.direct_messages.insert_one(dm_dict)
    
    return DirectMessageResponse(**dm_dict)


@api_router.get("/social/dm/{checkin_id}")
async def get_my_messages(checkin_id: str):
    """Get all DMs for a checked-in user (sent and received)"""
    messages = await db.direct_messages.find(
        {
            "$or": [
                {"from_checkin_id": checkin_id},
                {"to_checkin_id": checkin_id}
            ]
        },
        {"_id": 0}
    ).sort("created_at", -1).limit(100).to_list(100)
    
    return [DirectMessageResponse(**m) for m in messages]


@api_router.get("/social/dm/{checkin_id}/conversations")
async def get_conversations(checkin_id: str):
    """Get list of unique conversations for a user"""
    messages = await db.direct_messages.find(
        {
            "$or": [
                {"from_checkin_id": checkin_id},
                {"to_checkin_id": checkin_id}
            ]
        },
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    # Group by conversation partner
    conversations = {}
    for msg in messages:
        if msg["from_checkin_id"] == checkin_id:
            partner_id = msg["to_checkin_id"]
            partner_name = msg["to_name"]
            partner_emoji = msg["to_emoji"]
        else:
            partner_id = msg["from_checkin_id"]
            partner_name = msg["from_name"]
            partner_emoji = msg["from_emoji"]
        
        if partner_id not in conversations:
            unread_count = await db.direct_messages.count_documents({
                "from_checkin_id": partner_id,
                "to_checkin_id": checkin_id,
                "read": False
            })
            conversations[partner_id] = {
                "partner_id": partner_id,
                "partner_name": partner_name,
                "partner_emoji": partner_emoji,
                "last_message": msg["message"],
                "last_message_at": msg["created_at"],
                "unread_count": unread_count
            }
    
    return list(conversations.values())


@api_router.get("/social/dm/{checkin_id}/thread/{partner_id}")
async def get_dm_thread(checkin_id: str, partner_id: str):
    """Get message thread between two users"""
    messages = await db.direct_messages.find(
        {
            "$or": [
                {"from_checkin_id": checkin_id, "to_checkin_id": partner_id},
                {"from_checkin_id": partner_id, "to_checkin_id": checkin_id}
            ]
        },
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    # Mark messages as read
    await db.direct_messages.update_many(
        {"from_checkin_id": partner_id, "to_checkin_id": checkin_id, "read": False},
        {"$set": {"read": True}}
    )
    
    return [DirectMessageResponse(**m) for m in messages]


@api_router.get("/social/dm/{checkin_id}/unread")
async def get_unread_count(checkin_id: str):
    """Get count of unread messages"""
    count = await db.direct_messages.count_documents({
        "to_checkin_id": checkin_id,
        "read": False
    })
    return {"unread_count": count}


# =====================================================
# DJ TIPPING ENDPOINTS
# =====================================================


# DJ, KARAOKE, SONG REQUESTS, TIPPING - Moved to routes/dj.py


# =====================================================
# USER PROFILE ENDPOINTS
# =====================================================

@api_router.post("/user/profile", response_model=UserProfileResponse)
async def create_user_profile(profile: UserProfileCreate):
    """Create a new user profile"""
    # Check if email already exists
    if profile.email:
        existing = await db.user_profiles.find_one({"email": profile.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    profile_dict = profile.dict()
    profile_dict["id"] = str(uuid.uuid4())
    profile_dict["token_balance"] = 0
    profile_dict["total_visits"] = 0
    profile_dict["total_posts"] = 0
    profile_dict["total_photos"] = 0
    profile_dict["special_dates"] = []
    profile_dict["allow_gallery_posts"] = True
    profile_dict["birthdate"] = None
    profile_dict["anniversary"] = None
    profile_dict["profile_photo_url"] = None
    profile_dict["role"] = "customer"  # Default role
    profile_dict["staff_title"] = None
    profile_dict["cashout_balance"] = 0.0
    profile_dict["total_earnings"] = 0.0
    profile_dict["instagram_handle"] = None
    profile_dict["facebook_handle"] = None
    profile_dict["twitter_handle"] = None
    profile_dict["tiktok_handle"] = None
    profile_dict["created_at"] = datetime.now(timezone.utc)
    profile_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.user_profiles.insert_one(profile_dict)
    profile_dict.pop("_id", None)
    
    return UserProfileResponse(**profile_dict)


@api_router.get("/user/profile/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(user_id: str):
    """Get a user profile by ID"""
    profile = await db.user_profiles.find_one({"id": user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    # Add default values for missing fields (for backwards compatibility)
    profile.setdefault("role", "customer")
    profile.setdefault("staff_title", None)
    profile.setdefault("cashout_balance", 0.0)
    profile.setdefault("total_earnings", 0.0)
    profile.setdefault("profile_photo_url", None)
    profile.setdefault("special_dates", [])
    profile.setdefault("token_balance", 0)
    profile.setdefault("total_visits", 0)
    profile.setdefault("total_posts", 0)
    profile.setdefault("total_photos", 0)
    profile.setdefault("allow_gallery_posts", True)
    profile.setdefault("google_picture", None)
    profile.setdefault("username", None)
    profile.setdefault("auth_provider", None)
    profile.setdefault("birthdate", None)
    profile.setdefault("anniversary", None)
    profile.setdefault("instagram_handle", None)
    profile.setdefault("facebook_handle", None)
    profile.setdefault("twitter_handle", None)
    profile.setdefault("tiktok_handle", None)
    profile.setdefault("updated_at", profile.get("created_at"))
    return UserProfileResponse(**profile)


@api_router.get("/user/profile/by-email/{email}")
async def get_user_profile_by_email(email: str):
    """Get a user profile by email"""
    profile = await db.user_profiles.find_one({"email": email.lower()}, {"_id": 0})
    if not profile:
        # Fallback: case-insensitive search
        profile = await db.user_profiles.find_one(
            {"email": {"$regex": f"^{email}$", "$options": "i"}}, {"_id": 0}
        )
    if not profile:
        return None
    # Add default values for missing fields
    profile.setdefault("role", "customer")
    profile.setdefault("staff_title", None)
    profile.setdefault("cashout_balance", 0.0)
    profile.setdefault("total_earnings", 0.0)
    profile.setdefault("profile_photo_url", None)
    profile.setdefault("special_dates", [])
    profile.setdefault("token_balance", 0)
    profile.setdefault("total_visits", 0)
    profile.setdefault("total_posts", 0)
    profile.setdefault("total_photos", 0)
    profile.setdefault("allow_gallery_posts", True)
    profile.setdefault("google_picture", None)
    profile.setdefault("username", None)
    profile.setdefault("auth_provider", None)
    profile.setdefault("birthdate", None)
    profile.setdefault("anniversary", None)
    profile.setdefault("instagram_handle", None)
    profile.setdefault("facebook_handle", None)
    profile.setdefault("twitter_handle", None)
    profile.setdefault("tiktok_handle", None)
    profile.setdefault("updated_at", profile.get("created_at"))
    return UserProfileResponse(**profile)


@api_router.put("/user/profile/{user_id}", response_model=UserProfileResponse)
async def update_user_profile(user_id: str, update: UserProfileUpdate):
    """Update a user profile"""
    profile = await db.user_profiles.find_one({"id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc)
        await db.user_profiles.update_one({"id": user_id}, {"$set": update_dict})
    
    updated = await db.user_profiles.find_one({"id": user_id}, {"_id": 0})
    return UserProfileResponse(**updated)


@api_router.post("/user/profile/{user_id}/photo")
async def upload_profile_photo(user_id: str, file: UploadFile = File(...)):
    """Upload a profile photo/selfie - stores in MongoDB for production"""
    profile = await db.user_profiles.find_one({"id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: JPG, PNG, GIF, WebP")
    
    # Validate file size (max 10MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB")
    
    # Generate unique file ID
    file_id = f"profile_{user_id}_{uuid.uuid4().hex[:8]}"
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{file_id}.{ext}"
    
    # Store in MongoDB for production persistence
    base64_data = base64.b64encode(contents).decode('utf-8')
    
    await db.media_files.update_one(
        {"file_id": file_id},
        {"$set": {
            "file_id": file_id,
            "filename": filename,
            "data": base64_data,
            "content_type": file.content_type,
            "size": len(contents),
            "type": "profile_photo",
            "user_id": user_id,
            "uploaded_at": datetime.now(timezone.utc)
        }},
        upsert=True
    )
    
    # Also save locally for preview
    try:
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)
        file_path = upload_dir / filename
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception:
        pass
    
    # Use the MongoDB media URL
    photo_url = f"/api/media/{file_id}"
    await db.user_profiles.update_one(
        {"id": user_id},
        {"$set": {"profile_photo_url": photo_url, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"url": photo_url, "filename": filename}


# =====================================================
# F&F TOKEN ENDPOINTS (with WooCommerce Payment)
# =====================================================

# Fixed token packages - amounts defined server-side for security
TOKEN_PACKAGES = {
    "10": {"amount": 1.00, "tokens": 10, "name": "10 F&F Tokens"},
    "50": {"amount": 5.00, "tokens": 50, "name": "50 F&F Tokens"},
    "100": {"amount": 10.00, "tokens": 100, "name": "100 F&F Tokens"},
    "250": {"amount": 25.00, "tokens": 250, "name": "250 F&F Tokens"},
    "500": {"amount": 50.00, "tokens": 500, "name": "500 F&F Tokens"},
}


@api_router.get("/tokens/packages")
async def get_token_packages():
    """Get available token packages for purchase"""
    return TOKEN_PACKAGES


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


@api_router.post("/tokens/checkout")
async def create_token_checkout(request: Request, package_id: str, user_id: str, origin_url: str):
    """Create WooCommerce order for token purchase"""
    # Validate package
    if package_id not in TOKEN_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    # Validate user exists
    profile = await db.user_profiles.find_one({"id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    package = TOKEN_PACKAGES[package_id]
    amount = package["amount"]
    tokens = package["tokens"]
    name = package["name"]
    
    # Create transaction record first
    transaction_id = str(uuid.uuid4())
    transaction = {
        "id": transaction_id,
        "type": "token_purchase",
        "user_id": user_id,
        "amount": amount,
        "currency": "usd",
        "tokens": tokens,
        "package_id": package_id,
        "payment_status": "pending",
        "woo_order_id": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    await db.payment_transactions.insert_one(transaction)
    
    # Create WooCommerce order
    line_items = [{
        "name": name,
        "quantity": 1,
        "total": str(amount)
    }]
    
    meta_data = [
        {"key": "ff_transaction_id", "value": transaction_id},
        {"key": "ff_user_id", "value": user_id},
        {"key": "ff_tokens", "value": str(tokens)},
        {"key": "ff_type", "value": "token_purchase"},
        {"key": "ff_return_url", "value": f"{origin_url}/account?payment=success&transaction_id={transaction_id}"}
    ]
    
    try:
        order = await create_woocommerce_order(
            line_items=line_items,
            customer_email=profile.get("email"),
            meta_data=meta_data
        )
        
        woo_order_id = order.get("id")
        checkout_url = order.get("payment_url") or f"{os.environ.get('WOOCOMMERCE_URL')}/checkout/order-pay/{woo_order_id}/?pay_for_order=true&key={order.get('order_key')}"
        
        # Update transaction with WooCommerce order ID
        await db.payment_transactions.update_one(
            {"id": transaction_id},
            {"$set": {"woo_order_id": woo_order_id, "updated_at": datetime.now(timezone.utc)}}
        )
        
        return {
            "checkout_url": checkout_url,
            "transaction_id": transaction_id,
            "order_id": woo_order_id
        }
    except Exception:
        # Clean up failed transaction
        await db.payment_transactions.delete_one({"id": transaction_id})
        raise


@api_router.get("/tokens/checkout/status/{transaction_id}")
async def get_checkout_status(transaction_id: str):
    """Get the status of a token checkout"""
    transaction = await db.payment_transactions.find_one({"id": transaction_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # If already completed, return immediately
    if transaction.get("payment_status") == "paid":
        return {
            "status": "complete",
            "payment_status": "paid",
            "tokens_credited": transaction.get("tokens", 0),
            "already_processed": True
        }
    
    # Check WooCommerce order status
    woo_order_id = transaction.get("woo_order_id")
    if not woo_order_id:
        return {"status": "pending", "payment_status": "pending"}
    
    woo_url = os.environ.get("WOOCOMMERCE_URL")
    woo_key = os.environ.get("WOOCOMMERCE_KEY")
    woo_secret = os.environ.get("WOOCOMMERCE_SECRET")
    
    try:
        async with aiohttp.ClientSession() as session:
            auth = aiohttp.BasicAuth(woo_key, woo_secret)
            api_url = f"{woo_url}/wp-json/wc/v3/orders/{woo_order_id}"
            async with session.get(api_url, auth=auth) as response:
                if response.status != 200:
                    return {"status": "pending", "payment_status": "pending"}
                
                order = await response.json()
                order_status = order.get("status")
                
                # WooCommerce completed/processing means payment received
                if order_status in ["completed", "processing"]:
                    # Credit tokens if not already done
                    if transaction.get("payment_status") != "paid":
                        await credit_tokens_from_transaction(transaction)
                    
                    return {
                        "status": "complete",
                        "payment_status": "paid",
                        "tokens_credited": transaction.get("tokens", 0)
                    }
                elif order_status in ["cancelled", "failed", "refunded"]:
                    await db.payment_transactions.update_one(
                        {"id": transaction_id},
                        {"$set": {"payment_status": order_status, "updated_at": datetime.now(timezone.utc)}}
                    )
                    return {"status": order_status, "payment_status": order_status}
                else:
                    return {"status": "pending", "payment_status": "pending"}
    except Exception as e:
        logging.error(f"Error checking order status: {e}")
        return {"status": "pending", "payment_status": "pending"}


async def credit_tokens_from_transaction(transaction: dict):
    """Helper to credit tokens from a completed transaction"""
    user_id = transaction.get("user_id")
    tokens_to_add = transaction.get("tokens", 0)
    transaction_id = transaction.get("id")
    
    profile = await db.user_profiles.find_one({"id": user_id})
    if profile:
        new_balance = profile.get("token_balance", 0) + tokens_to_add
        await db.user_profiles.update_one(
            {"id": user_id},
            {"$set": {"token_balance": new_balance, "updated_at": datetime.now(timezone.utc)}}
        )
        
        # Create purchase record
        purchase_record = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "amount_usd": transaction.get("amount"),
            "tokens_purchased": tokens_to_add,
            "payment_method": "woocommerce",
            "woo_order_id": transaction.get("woo_order_id"),
            "transaction_id": transaction_id,
            "gifted_by": None,
            "created_at": datetime.now(timezone.utc)
        }
        await db.token_purchases.insert_one(purchase_record)
    
    # Update transaction status
    await db.payment_transactions.update_one(
        {"id": transaction_id},
        {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc)}}
    )


@api_router.post("/webhook/woocommerce")
async def woocommerce_webhook(request: Request):
    """Handle WooCommerce webhook for order status updates"""
    try:
        body = await request.json()
        
        # Get order details
        order_id = body.get("id")
        order_status = body.get("status")
        
        if not order_id:
            return {"status": "ok", "message": "No order ID"}
        
        # Find transaction by WooCommerce order ID
        transaction = await db.payment_transactions.find_one({"woo_order_id": order_id})
        
        if not transaction:
            # Could be a merchandise order
            cart_order = await db.cart_orders.find_one({"woo_order_id": order_id})
            if cart_order and order_status in ["completed", "processing"]:
                await db.cart_orders.update_one(
                    {"woo_order_id": order_id},
                    {"$set": {"status": "paid", "updated_at": datetime.now(timezone.utc)}}
                )
            return {"status": "ok"}
        
        # Handle token purchase
        if order_status in ["completed", "processing"] and transaction.get("payment_status") != "paid":
            await credit_tokens_from_transaction(transaction)
            logging.info(f"Credited {transaction.get('tokens')} tokens for order {order_id}")
        elif order_status in ["cancelled", "failed", "refunded"]:
            await db.payment_transactions.update_one(
                {"id": transaction.get("id")},
                {"$set": {"payment_status": order_status, "updated_at": datetime.now(timezone.utc)}}
            )
        
        return {"status": "ok"}
    except Exception as e:
        logging.error(f"WooCommerce webhook error: {e}")
        return {"status": "error", "message": str(e)}


# Keep old endpoint for admin gifting
@api_router.post("/user/tokens/purchase/{user_id}")
async def purchase_tokens(user_id: str, purchase: TokenPurchaseCreate):
    """Purchase F&F tokens - Used for admin gifting only"""
    profile = await db.user_profiles.find_one({"id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    if purchase.amount_usd < 1:
        raise HTTPException(status_code=400, detail="Minimum purchase is $1")
    
    tokens_to_add = int(purchase.amount_usd * 10)
    
    purchase_record = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "amount_usd": purchase.amount_usd,
        "tokens_purchased": tokens_to_add,
        "payment_method": "gift",
        "gifted_by": None,
        "created_at": datetime.now(timezone.utc)
    }
    await db.token_purchases.insert_one(purchase_record)
    
    new_balance = profile.get("token_balance", 0) + tokens_to_add
    await db.user_profiles.update_one(
        {"id": user_id},
        {"$set": {"token_balance": new_balance, "updated_at": datetime.now(timezone.utc)}}
    )
    
    purchase_record.pop("_id", None)
    return {"purchase": purchase_record, "new_balance": new_balance}


@api_router.get("/user/tokens/balance/{user_id}")
async def get_token_balance(user_id: str):
    """Get user's F&F token balance"""
    profile = await db.user_profiles.find_one({"id": user_id}, {"_id": 0, "token_balance": 1, "id": 1})
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return {"user_id": user_id, "token_balance": profile.get("token_balance", 0)}


@api_router.get("/user/tokens/history/{user_id}")
async def get_token_history(user_id: str):
    """Get user's token purchase/gift history"""
    history = await db.token_purchases.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return history


@api_router.post("/user/tokens/spend/{user_id}")
async def spend_tokens(user_id: str, amount: int):
    """Spend tokens (for tips and drinks)"""
    profile = await db.user_profiles.find_one({"id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    current_balance = profile.get("token_balance", 0)
    if current_balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient token balance")
    
    new_balance = current_balance - amount
    await db.user_profiles.update_one(
        {"id": user_id},
        {"$set": {"token_balance": new_balance, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"user_id": user_id, "tokens_spent": amount, "new_balance": new_balance}


# Admin: Gift tokens to a user
@api_router.post("/admin/tokens/gift")
async def admin_gift_tokens(gift: TokenGiftCreate, username: str = Depends(get_current_admin)):
    """Admin: Gift F&F tokens to a user"""
    profile = await db.user_profiles.find_one({"id": gift.user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    if gift.tokens < 1:
        raise HTTPException(status_code=400, detail="Must gift at least 1 token")
    
    # Create gift record
    gift_record = {
        "id": str(uuid.uuid4()),
        "user_id": gift.user_id,
        "amount_usd": gift.tokens / 10,  # Equivalent USD value
        "tokens_purchased": gift.tokens,
        "payment_method": "gift",
        "gifted_by": username,
        "message": gift.message,
        "created_at": datetime.now(timezone.utc)
    }
    await db.token_purchases.insert_one(gift_record)
    
    # Update user balance
    new_balance = profile.get("token_balance", 0) + gift.tokens
    await db.user_profiles.update_one(
        {"id": gift.user_id},
        {"$set": {"token_balance": new_balance, "updated_at": datetime.now(timezone.utc)}}
    )
    
    gift_record.pop("_id", None)
    return {
        "gift": gift_record,
        "new_balance": new_balance,
        "user_name": profile.get("name")
    }


# Admin: Get all user profiles
@api_router.get("/admin/users")
async def admin_get_users(username: str = Depends(get_current_admin)):
    """Get all user profiles (admin only)"""
    users = await db.user_profiles.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return users


# Admin/Management: Update user role
@api_router.post("/admin/users/role")
async def update_user_role(role_update: RoleUpdate, username: str = Depends(get_current_admin)):
    """Update a user's role (admin only)"""
    valid_roles = ["customer", "staff", "management"]
    if role_update.new_role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")
    
    user = await db.user_profiles.find_one({"id": role_update.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {
        "role": role_update.new_role,
        "updated_at": datetime.now(timezone.utc)
    }
    
    if role_update.staff_title and role_update.new_role == "staff":
        update_data["staff_title"] = role_update.staff_title
    
    await db.user_profiles.update_one(
        {"id": role_update.user_id},
        {"$set": update_data}
    )
    
    return {"message": f"User role updated to {role_update.new_role}", "user_id": role_update.user_id}


# =====================================================
# TOKEN TRANSFER ENDPOINTS
# =====================================================

@api_router.post("/user/tokens/transfer/{from_user_id}")
async def transfer_tokens(from_user_id: str, transfer: TokenTransferCreate):
    """Transfer tokens from one user to another (tips, drinks, gifts)"""
    # Get sender
    sender = await db.user_profiles.find_one({"id": from_user_id})
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")
    
    # Get receiver
    receiver = await db.user_profiles.find_one({"id": transfer.to_user_id})
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    # Check sender balance
    sender_balance = sender.get("token_balance", 0)
    if sender_balance < transfer.amount:
        raise HTTPException(status_code=400, detail="Insufficient token balance")
    
    if transfer.amount < 1:
        raise HTTPException(status_code=400, detail="Must transfer at least 1 token")
    
    # Create transfer record
    transfer_record = {
        "id": str(uuid.uuid4()),
        "from_user_id": from_user_id,
        "to_user_id": transfer.to_user_id,
        "amount": transfer.amount,
        "transfer_type": transfer.transfer_type,
        "message": transfer.message,
        "created_at": datetime.now(timezone.utc)
    }
    await db.token_transfers.insert_one(transfer_record)
    
    # Update sender balance
    new_sender_balance = sender_balance - transfer.amount
    await db.user_profiles.update_one(
        {"id": from_user_id},
        {"$set": {"token_balance": new_sender_balance, "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Update receiver - if staff, add to cashout_balance, else add to token_balance
    receiver_role = receiver.get("role", "customer")
    if receiver_role == "staff" and transfer.transfer_type == "tip":
        # Staff receives tips in cashout_balance (USD value)
        tip_usd_value = transfer.amount / 10  # 10 tokens = $1
        new_cashout = receiver.get("cashout_balance", 0) + tip_usd_value
        await db.user_profiles.update_one(
            {"id": transfer.to_user_id},
            {"$set": {
                "cashout_balance": new_cashout,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
    else:
        # Non-staff or non-tip transfers go to token_balance
        new_receiver_balance = receiver.get("token_balance", 0) + transfer.amount
        await db.user_profiles.update_one(
            {"id": transfer.to_user_id},
            {"$set": {"token_balance": new_receiver_balance, "updated_at": datetime.now(timezone.utc)}}
        )
    
    transfer_record.pop("_id", None)
    return {
        "transfer": transfer_record,
        "sender_new_balance": new_sender_balance,
        "receiver_name": receiver.get("name")
    }


@api_router.get("/user/tokens/transfers/{user_id}")
async def get_user_transfers(user_id: str):
    """Get user's token transfer history (sent and received)"""
    transfers = await db.token_transfers.find(
        {"$or": [{"from_user_id": user_id}, {"to_user_id": user_id}]},
        {"_id": 0}
    ).sort("created_at", -1).limit(100).to_list(100)
    return transfers


# =====================================================
# STAFF CASHOUT ENDPOINTS
# =====================================================

@api_router.post("/staff/cashout/{user_id}")
async def request_cashout(user_id: str, cashout: CashoutRequestCreate):
    """Staff: Request to cash out accumulated tips (min $20, 80% rate)"""
    user = await db.user_profiles.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("role") != "staff":
        raise HTTPException(status_code=403, detail="Only staff can request cashouts")
    
    cashout_balance = user.get("cashout_balance", 0)
    
    # Minimum $20 to cash out
    if cashout_balance < 20:
        raise HTTPException(status_code=400, detail=f"Minimum cashout is $20. Current balance: ${cashout_balance:.2f}")
    
    # Calculate tokens and USD (80% rate)
    tokens_to_cashout = cashout.amount_tokens
    usd_value = tokens_to_cashout / 10  # Token to USD
    
    if usd_value > cashout_balance:
        raise HTTPException(status_code=400, detail=f"Requested amount exceeds balance. Max: ${cashout_balance:.2f}")
    
    payout_amount = usd_value * 0.8  # 80% payout rate
    
    # Create cashout request
    cashout_record = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "amount_tokens": tokens_to_cashout,
        "amount_usd": payout_amount,
        "status": "pending",
        "payment_method": cashout.payment_method,
        "payment_details": cashout.payment_details,
        "created_at": datetime.now(timezone.utc),
        "processed_at": None
    }
    await db.cashout_requests.insert_one(cashout_record)
    
    # Deduct from cashout balance
    new_balance = cashout_balance - usd_value
    total_earnings = user.get("total_earnings", 0) + payout_amount
    
    await db.user_profiles.update_one(
        {"id": user_id},
        {"$set": {
            "cashout_balance": new_balance,
            "total_earnings": total_earnings,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    cashout_record.pop("_id", None)
    return {
        "cashout": cashout_record,
        "new_balance": new_balance,
        "payout_amount": payout_amount
    }


@api_router.get("/staff/cashout/history/{user_id}")
async def get_cashout_history(user_id: str):
    """Get staff's cashout request history"""
    history = await db.cashout_requests.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return history


@api_router.post("/staff/transfer-to-personal/{user_id}")
async def transfer_tips_to_personal(user_id: str, amount: float):
    """Staff: Transfer cashout balance to personal token balance"""
    user = await db.user_profiles.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("role") != "staff":
        raise HTTPException(status_code=403, detail="Only staff can transfer tips")
    
    cashout_balance = user.get("cashout_balance", 0)
    
    if amount > cashout_balance:
        raise HTTPException(status_code=400, detail=f"Amount exceeds balance. Available: ${cashout_balance:.2f}")
    
    if amount < 1:
        raise HTTPException(status_code=400, detail="Minimum transfer is $1")
    
    # Convert USD to tokens
    tokens_to_add = int(amount * 10)  # $1 = 10 tokens
    
    # Update balances
    new_cashout = cashout_balance - amount
    new_token_balance = user.get("token_balance", 0) + tokens_to_add
    
    await db.user_profiles.update_one(
        {"id": user_id},
        {"$set": {
            "cashout_balance": new_cashout,
            "token_balance": new_token_balance,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    # Record the transfer
    transfer_record = {
        "id": str(uuid.uuid4()),
        "from_user_id": user_id,
        "to_user_id": user_id,
        "amount": tokens_to_add,
        "transfer_type": "tip_to_personal",
        "message": f"Converted ${amount:.2f} tips to {tokens_to_add} tokens",
        "created_at": datetime.now(timezone.utc)
    }
    await db.token_transfers.insert_one(transfer_record)
    
    return {
        "new_cashout_balance": new_cashout,
        "new_token_balance": new_token_balance,
        "tokens_added": tokens_to_add
    }


# Admin: View all cashout requests
@api_router.get("/admin/cashouts")
async def admin_get_cashouts(username: str = Depends(get_current_admin)):
    """Get all pending cashout requests (admin only)"""
    requests = await db.cashout_requests.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return requests


# Admin: Process cashout request
@api_router.put("/admin/cashouts/{cashout_id}")
async def admin_process_cashout(cashout_id: str, status: str, username: str = Depends(get_current_admin)):
    """Admin: Approve or reject a cashout request"""
    if status not in ["approved", "paid", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.cashout_requests.update_one(
        {"id": cashout_id},
        {"$set": {"status": status, "processed_at": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cashout request not found")
    
    return {"message": f"Cashout request {status}", "cashout_id": cashout_id}


# Get staff members (for tipping)
@api_router.get("/staff/list")
async def get_staff_list():
    """Get list of all staff members (for customers to tip)"""
    staff = await db.user_profiles.find(
        {"role": "staff"},
        {"_id": 0, "id": 1, "name": 1, "staff_title": 1, "avatar_emoji": 1, "profile_photo_url": 1}
    ).to_list(100)
    return staff


# =====================================================
# USER HISTORY ENDPOINTS
# =====================================================

@api_router.get("/user/history/visits/{user_id}")
async def get_user_visits(user_id: str):
    """Get user's check-in/visit history"""
    # Get visits from the checkins collection, filtered by user
    # We track visits by linking user_id to checkin records
    visits = await db.user_visits.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("checked_in_at", -1).limit(50).to_list(50)
    return visits


@api_router.get("/user/history/posts/{user_id}")
async def get_user_posts(user_id: str):
    """Get user's social wall post history"""
    # Find posts by checkin IDs associated with this user
    posts = await db.social_posts.find(
        {"author_user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return posts


@api_router.get("/user/history/drinks/{user_id}")
async def get_user_drink_history(user_id: str):
    """Get user's drink sending/receiving history"""
    drinks = await db.drink_orders.find(
        {
            "$or": [
                {"from_user_id": user_id},
                {"to_user_id": user_id}
            ]
        },
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return drinks


@api_router.get("/user/history/tips/{user_id}")
async def get_user_tip_history(user_id: str):
    """Get user's DJ tip history"""
    tips = await db.dj_tips.find(
        {"tipper_user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return tips


# =====================================================
# USER GALLERY SUBMISSION ENDPOINTS
# =====================================================

@api_router.post("/user/gallery/submit/{user_id}", response_model=UserGallerySubmissionResponse)
async def submit_gallery_photo(user_id: str, submission: UserGallerySubmissionCreate):
    """Submit a photo to the gallery (auto-approved)"""
    profile = await db.user_profiles.find_one({"id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    submission_dict = submission.dict()
    submission_dict["id"] = str(uuid.uuid4())
    submission_dict["user_id"] = user_id
    submission_dict["user_name"] = profile.get("name", "Anonymous")
    submission_dict["created_at"] = datetime.now(timezone.utc)
    
    await db.user_gallery_submissions.insert_one(submission_dict)
    
    # Also add to the main gallery (auto-approved)
    gallery_item = {
        "id": str(uuid.uuid4()),
        "title": submission.caption or f"Photo by {profile.get('name', 'Guest')}",
        "image_url": submission.image_url,
        "category": "community",
        "is_active": True,
        "display_order": 999,  # Show at end
        "submitted_by_user": user_id,
        "created_at": datetime.now(timezone.utc)
    }
    await db.gallery_items.insert_one(gallery_item)
    
    # Update user's photo count
    await db.user_profiles.update_one(
        {"id": user_id},
        {"$inc": {"total_photos": 1}, "$set": {"updated_at": datetime.now(timezone.utc)}}
    )
    
    submission_dict.pop("_id", None)
    return UserGallerySubmissionResponse(**submission_dict)


@api_router.get("/user/gallery/submissions/{user_id}")
async def get_user_submissions(user_id: str):
    """Get user's gallery submissions"""
    submissions = await db.user_gallery_submissions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return submissions


# =====================================================
# LOCATION ENDPOINTS (Public & Admin)
# =====================================================

@api_router.get("/locations")
async def get_public_locations():
    """Get all active locations for public display"""
    locations = await db.locations.find(
        {"is_active": True},
        {"_id": 0}
    ).sort("display_order", 1).to_list(100)
    locations = [normalize_location_response(loc) for loc in locations]
    return locations


@api_router.get("/locations/{slug}")
async def get_location_by_slug(slug: str):
    """Get a single location by slug"""
    location = await db.locations.find_one(
        {"slug": slug},
        {"_id": 0}
    )
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    location = normalize_location_response(location)
    return location


# Admin Location Endpoints
def ensure_suite_placeholder(address: str):
    return address


def normalize_location_response(location: dict):
    if not location:
        return location
    address = location.get("address")
    if address:
        location["address"] = ensure_suite_placeholder(address)
    # Auto-add timezone based on location slug
    slug = location.get("slug", "")
    if slug and "timezone" not in location:
        location["timezone"] = get_location_tz_name(slug)
    return location


# Admin Location Endpoints
@api_router.get("/admin/locations")
async def get_all_locations(admin: str = Depends(get_current_admin)):
    """Get all locations (including inactive) for admin"""
    locations = await db.locations.find({}, {"_id": 0}).sort("display_order", 1).to_list(100)
    locations = [normalize_location_response(loc) for loc in locations]
    return locations


@api_router.post("/admin/locations")
async def create_location(location: LocationCreate, admin: str = Depends(get_current_admin)):
    """Create a new location"""
    # Check for duplicate slug
    existing = await db.locations.find_one({"slug": location.slug})
    if existing:
        raise HTTPException(status_code=400, detail="A location with this slug already exists")
    
    location_data = Location(
        slug=location.slug,
        name=location.name,
        address=location.address,
        phone=location.phone,
        reservation_phone=location.reservation_phone,
        coordinates=location.coordinates,
        image=location.image,
        hours=location.hours,
        online_ordering=location.online_ordering,
        reservations=location.reservations,
        delivery=location.delivery,
        social_media=location.social_media,
        weekly_specials=location.weekly_specials,
        display_order=location.display_order
    )
    
    await db.locations.insert_one(location_data.model_dump())
    return {"id": location_data.id, "message": "Location created successfully"}


@api_router.put("/admin/locations/{location_id}")
async def update_location(location_id: str, location: LocationUpdate, admin: str = Depends(get_current_admin)):
    """Update a location"""
    existing = await db.locations.find_one({"id": location_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # If slug is being changed, check for duplicates
    if location.slug and location.slug != existing.get("slug"):
        slug_exists = await db.locations.find_one({"slug": location.slug, "id": {"$ne": location_id}})
        if slug_exists:
            raise HTTPException(status_code=400, detail="A location with this slug already exists")
    
    update_data = {k: v for k, v in location.model_dump().items() if v is not None}
    
    # Handle nested objects properly
    if "coordinates" in update_data and update_data["coordinates"]:
        update_data["coordinates"] = update_data["coordinates"].model_dump() if hasattr(update_data["coordinates"], 'model_dump') else update_data["coordinates"]
    if "hours" in update_data and update_data["hours"]:
        update_data["hours"] = update_data["hours"].model_dump() if hasattr(update_data["hours"], 'model_dump') else update_data["hours"]
    if "social_media" in update_data and update_data["social_media"]:
        update_data["social_media"] = update_data["social_media"].model_dump() if hasattr(update_data["social_media"], 'model_dump') else update_data["social_media"]
    if "weekly_specials" in update_data:
        update_data["weekly_specials"] = [
            ws.model_dump() if hasattr(ws, 'model_dump') else ws 
            for ws in update_data["weekly_specials"]
        ]
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.locations.update_one({"id": location_id}, {"$set": update_data})
    return {"message": "Location updated successfully"}


@api_router.delete("/admin/locations/{location_id}")
async def delete_location(location_id: str, admin: str = Depends(get_current_admin)):
    """Delete a location"""
    result = await db.locations.delete_one({"id": location_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")
    return {"message": "Location deleted successfully"}


@api_router.post("/admin/locations/reorder")
async def reorder_locations(order: List[dict], admin: str = Depends(get_current_admin)):
    """Reorder locations via drag-and-drop - expects [{id, display_order}]"""
    for item in order:
        await db.locations.update_one(
            {"id": item["id"]},
            {"$set": {"display_order": item["display_order"], "updated_at": datetime.now(timezone.utc)}}
        )
    return {"message": "Locations reordered successfully"}


@api_router.post("/admin/locations/seed")
async def seed_locations(admin: str = Depends(get_current_admin)):
    """Seed the database with initial location data (run once)"""
    existing_count = await db.locations.count_documents({})
    if existing_count > 0:
        return {"message": f"Database already has {existing_count} locations. Skipping seed."}
    
    # Initial location data from mockData.js
    initial_locations = [
        {
            "id": str(uuid.uuid4()),
            "slug": "edgewood-atlanta",
            "name": "Fin & Feathers - Edgewood (Atlanta)",
            "address": "345 Edgewood Ave SE, Atlanta, GA 30312",
            "phone": "(404) 855-5524",
            "reservation_phone": "(404) 692-1252",
            "coordinates": {"lat": 33.7547, "lng": -84.3733},
            "image": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6657.jpg",
            "hours": {
                "monday": "11am-1am", "tuesday": "11am-1am", "wednesday": "11am-1am",
                "thursday": "11am-1am", "friday": "11am-3am", "saturday": "10am-3am", "sunday": "10am-12am"
            },
            "online_ordering": "https://order.toasttab.com/online/fin-feathers-edgewood-2nd-location-345-edgewood-ave-se",
            "reservations": "sms:14046921252?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested",
            "delivery": "https://order.toasttab.com/online/fin-feathers-edgewood-2nd-location-345-edgewood-ave-se",
            "social_media": {"instagram": "https://instagram.com/finandfeathers_edgewood", "facebook": "https://facebook.com/finandfeathers", "twitter": "https://twitter.com/finandfeathers"},
            "weekly_specials": [
                {"day": "Monday", "special": "$5 Wings & $5 Margaritas"},
                {"day": "Tuesday", "special": "Taco Tuesday - $2 Tacos"},
                {"day": "Wednesday", "special": "Wine Down Wednesday - Half Price Wine"},
                {"day": "Thursday", "special": "Thirsty Thursday - $10 Long Islands"},
                {"day": "Friday", "special": "Fresh Fish Friday - Market Price"},
                {"day": "Saturday", "special": "Brunch & Bottomless Mimosas"},
                {"day": "Sunday", "special": "Sunday Funday - Kids Eat Free"}
            ],
            "is_active": True, "display_order": 0, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "midtown-atlanta",
            "name": "Fin & Feathers - Midtown (Atlanta)",
            "address": "1136 Crescent Ave NE, Atlanta, GA 30309",
            "phone": "(404) 549-7555",
            "reservation_phone": "(678) 421-4083",
            "coordinates": {"lat": 33.7812, "lng": -84.3838},
            "image": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6656.jpg",
            "hours": {
                "monday": "11am-10pm", "tuesday": "11am-10pm", "wednesday": "11am-10pm",
                "thursday": "11am-11pm", "friday": "11am-12am", "saturday": "10am-12am", "sunday": "10am-10pm"
            },
            "online_ordering": "https://www.toasttab.com/local/order/fin-feathers-midtown-1136-crescent-ave-ne/r-94f8c8b0-51bd-4f67-a787-68f7f39f0eb9",
            "reservations": "sms:16784214083?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested",
            "delivery": "https://www.toasttab.com/local/order/fin-feathers-midtown-1136-crescent-ave-ne/r-94f8c8b0-51bd-4f67-a787-68f7f39f0eb9",
            "social_media": {"instagram": "https://instagram.com/finandfeathers_midtown", "facebook": "https://facebook.com/finandfeathers", "twitter": "https://twitter.com/finandfeathers"},
            "weekly_specials": [
                {"day": "Monday", "special": "Margarita Madness - $7 Margaritas"},
                {"day": "Tuesday", "special": "$1 Oysters All Day"},
                {"day": "Wednesday", "special": "Wings & Things - $6 Wings"},
                {"day": "Thursday", "special": "Steak Night - $25 Ribeye"},
                {"day": "Friday", "special": "Lobster Special - Market Price"},
                {"day": "Saturday", "special": "Weekend Brunch 10am-3pm"},
                {"day": "Sunday", "special": "Live Music & Happy Hour"}
            ],
            "is_active": True, "display_order": 1, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "douglasville",
            "name": "Fin & Feathers - Douglasville",
            "address": "7430 Douglas Blvd, Douglasville, GA 30135",
            "phone": "(678) 653-9577",
            "reservation_phone": "(404) 458-1958",
            "coordinates": {"lat": 33.7515, "lng": -84.7477},
            "image": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/fin_and_feathers_shrimp_and_grits_2-e1666107985403.jpg",
            "hours": {
                "monday": "12pm-10pm", "tuesday": "12pm-10pm", "wednesday": "12pm-10pm",
                "thursday": "12pm-11pm", "friday": "12pm-12am", "saturday": "11am-12am", "sunday": "11am-9pm"
            },
            "online_ordering": "https://order.toasttab.com/online/fins-feathers-douglasville-7430-douglas-blvd-zmrgr",
            "reservations": "sms:14044581958?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested",
            "delivery": "https://order.toasttab.com/online/fins-feathers-douglasville-7430-douglas-blvd-zmrgr",
            "social_media": {"instagram": "https://instagram.com/finandfeathers_douglasville", "facebook": "https://facebook.com/finandfeathers", "twitter": "https://twitter.com/finandfeathers"},
            "weekly_specials": [
                {"day": "Monday", "special": "Family Night - Kids Eat Free"},
                {"day": "Tuesday", "special": "Taco & Tequila Tuesday"},
                {"day": "Wednesday", "special": "Wine & Dine - 50% Off Bottles"},
                {"day": "Thursday", "special": "Craft Beer Night"},
                {"day": "Friday", "special": "Seafood Boil Special"},
                {"day": "Saturday", "special": "Brunch Party 11am-3pm"},
                {"day": "Sunday", "special": "Sunday Roast Special"}
            ],
            "is_active": True, "display_order": 2, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "riverdale",
            "name": "Fin & Feathers - Riverdale",
            "address": "6340 Hwy 85, Riverdale, GA 30274",
            "phone": "(770) 703-2282",
            "reservation_phone": "(678) 304-8191",
            "coordinates": {"lat": 33.5726, "lng": -84.4132},
            "image": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/augies_cafe_smb_parent__atlanta__new_business__86_hero-e1666179925108.jpg",
            "hours": {
                "monday": "11am-10pm", "tuesday": "11am-10pm", "wednesday": "11am-10pm",
                "thursday": "11am-11pm", "friday": "11am-12am", "saturday": "10am-12am", "sunday": "10am-10pm"
            },
            "online_ordering": "https://www.toasttab.com/local/order/fin-feathers-riverdale-6340-ga-85",
            "reservations": "sms:16783048191?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested",
            "delivery": "https://www.toasttab.com/local/order/fin-feathers-riverdale-6340-ga-85",
            "social_media": {"instagram": "https://instagram.com/finandfeathers_riverdale", "facebook": "https://facebook.com/finandfeathers", "twitter": "https://twitter.com/finandfeathers"},
            "weekly_specials": [
                {"day": "Monday", "special": "$5 Daily Specials All Day"},
                {"day": "Tuesday", "special": "Two for Tuesday - BOGO Entrees"},
                {"day": "Wednesday", "special": "Wine Wednesday - $5 Glasses"},
                {"day": "Thursday", "special": "Throwback Thursday - Classic Menu"},
                {"day": "Friday", "special": "Fried Fish Friday"},
                {"day": "Saturday", "special": "All Day Brunch & Cocktails"},
                {"day": "Sunday", "special": "Southern Sunday Dinner"}
            ],
            "is_active": True, "display_order": 3, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "valdosta",
            "name": "Fin & Feathers - Valdosta",
            "address": "1700 Norman Dr, Valdosta, GA 31601",
            "phone": "(229) 474-4049",
            "reservation_phone": "(229) 231-4653",
            "coordinates": {"lat": 30.8327, "lng": -83.2785},
            "image": "https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Catfish-Grits-scaled.jpg",
            "hours": {
                "monday": "12pm-9pm", "tuesday": "12pm-9pm", "wednesday": "12pm-9pm",
                "thursday": "12pm-10pm", "friday": "12pm-11pm", "saturday": "11am-11pm", "sunday": "11am-9pm"
            },
            "online_ordering": "https://www.toasttab.com/local/order/fin-feathers-valdosta-1700-norman-drive/r-2f4566e8-677d-42d2-93d3-9aa6d2687fcd",
            "reservations": "sms:2292314653?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested",
            "delivery": "https://www.toasttab.com/local/order/fin-feathers-valdosta-1700-norman-drive/r-2f4566e8-677d-42d2-93d3-9aa6d2687fcd",
            "social_media": {"instagram": "https://instagram.com/finandfeathers_valdosta", "facebook": "https://facebook.com/finandfeathers", "twitter": "https://twitter.com/finandfeathers"},
            "weekly_specials": [
                {"day": "Monday", "special": "Manic Monday - $8 Burgers"},
                {"day": "Tuesday", "special": "Taco Tuesday Fiesta"},
                {"day": "Wednesday", "special": "Wine Down Wednesday"},
                {"day": "Thursday", "special": "Thirsty Thursday - $3 Drafts"},
                {"day": "Friday", "special": "Fresh Catch Friday"},
                {"day": "Saturday", "special": "Brunch & Bubbles"},
                {"day": "Sunday", "special": "Family Sunday Feast"}
            ],
            "is_active": True, "display_order": 4, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "albany",
            "name": "Fin & Feathers - Albany",
            "address": "2800 Old Dawson Rd Unit 5, Albany, GA 31707",
            "phone": "(229) 231-2101",
            "reservation_phone": "(229) 231-2101",
            "coordinates": {"lat": 31.5785, "lng": -84.1558},
            "image": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/1ddbe3ac887b406aa6277a86d551faae-1024x1024.jpeg",
            "hours": {
                "monday": "11am-9pm", "tuesday": "11am-9pm", "wednesday": "11am-9pm",
                "thursday": "11am-10pm", "friday": "11am-11pm", "saturday": "10am-11pm", "sunday": "10am-9pm"
            },
            "online_ordering": "https://www.toasttab.com/local/order/fin-and-feathers-albany-llc",
            "reservations": "sms:12292312101?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested",
            "delivery": "https://www.toasttab.com/local/order/fin-and-feathers-albany-llc",
            "social_media": {"instagram": "https://instagram.com/finandfeathers_albany", "facebook": "https://facebook.com/finandfeathers", "twitter": "https://twitter.com/finandfeathers"},
            "weekly_specials": [
                {"day": "Monday", "special": "Monday Blues Buster - Live Music"},
                {"day": "Tuesday", "special": "$2 Taco & $2 Tecate"},
                {"day": "Wednesday", "special": "Wing Wednesday - 50¢ Wings"},
                {"day": "Thursday", "special": "Thirsty Thursday Cocktails"},
                {"day": "Friday", "special": "Fish Fry Friday"},
                {"day": "Saturday", "special": "Weekend Brunch Extravaganza"},
                {"day": "Sunday", "special": "Sunday Funday - All Day Happy Hour"}
            ],
            "is_active": True, "display_order": 5, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "stone-mountain",
            "name": "Fin & Feathers - Stone Mountain",
            "address": "5370 Stone Mountain Hwy, Stone Mountain, GA 30087",
            "phone": "(470) 334-8255",
            "reservation_phone": "(470) 334-8255",
            "coordinates": {"lat": 33.8081, "lng": -84.1458},
            "image": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC06011_edited.jpg",
            "hours": {
                "monday": "11am-10pm", "tuesday": "11am-10pm", "wednesday": "11am-10pm",
                "thursday": "11am-11pm", "friday": "11am-12am", "saturday": "10am-12am", "sunday": "10am-10pm"
            },
            "online_ordering": "https://www.toasttab.com/local/order/fin-feathers-stone-mountain-5469-memorial-drive",
            "reservations": "sms:14703348255?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested",
            "delivery": "https://www.toasttab.com/local/order/fin-feathers-stone-mountain-5469-memorial-drive",
            "social_media": {"instagram": "https://instagram.com/finandfeathers_stonemountain", "facebook": "https://facebook.com/finandfeathers", "twitter": "https://twitter.com/finandfeathers"},
            "weekly_specials": [
                {"day": "Monday", "special": "$5 Wings & $5 Margaritas"},
                {"day": "Tuesday", "special": "Taco Tuesday - $2 Tacos"},
                {"day": "Wednesday", "special": "Wine Down Wednesday - Half Price Wine"},
                {"day": "Thursday", "special": "Thirsty Thursday - $10 Long Islands"},
                {"day": "Friday", "special": "Fresh Fish Friday - Market Price"},
                {"day": "Saturday", "special": "Brunch & Bottomless Mimosas"},
                {"day": "Sunday", "special": "Sunday Funday - Kids Eat Free"}
            ],
            "is_active": True, "display_order": 6, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "las-vegas",
            "name": "Fin & Feathers - Las Vegas",
            "address": "1229 S. Casino Center Blvd, Las Vegas, NV 89104",
            "phone": "(725) 204-9655",
            "reservation_phone": "(702) 546-6394",
            "coordinates": {"lat": 36.1622, "lng": -115.1505},
            "image": "https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Malibu-Ribeye-scaled.jpg",
            "hours": {
                "monday": "11am-12am", "tuesday": "11am-12am", "wednesday": "11am-12am",
                "thursday": "11am-12am", "friday": "11am-2am", "saturday": "10am-2am", "sunday": "10am-12am"
            },
            "online_ordering": "https://www.toasttab.com/local/order/fin-feathers-las-vegas-1229-s-casino-center-blvd",
            "reservations": "sms:17025466394?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested",
            "delivery": "https://www.toasttab.com/local/order/fin-feathers-las-vegas-1229-s-casino-center-blvd",
            "social_media": {"instagram": "https://instagram.com/finandfeathersrestaurants", "facebook": "https://facebook.com/finandfeathersrestaurants", "twitter": "https://twitter.com/finandfeathers"},
            "weekly_specials": [
                {"day": "Monday", "special": "Monday Night Madness - $20 All You Can Eat Wings"},
                {"day": "Tuesday", "special": "Taco Tuesday Vegas Style"},
                {"day": "Wednesday", "special": "Wine & Dine - Premium Bottles $30"},
                {"day": "Thursday", "special": "Vegas Thursday - Champagne Brunch"},
                {"day": "Friday", "special": "High Roller Friday - Lobster & Steak"},
                {"day": "Saturday", "special": "Saturday Night Party - DJ & Specials"},
                {"day": "Sunday", "special": "Recovery Sunday - Hangover Brunch"}
            ],
            "is_active": True, "display_order": 7, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
        }
    ]
    
    await db.locations.insert_many(initial_locations)
    return {"message": f"Successfully seeded {len(initial_locations)} locations"}


# =====================================================
# PROMO VIDEO ENDPOINTS
# =====================================================

@api_router.get("/promo-videos")
async def get_promo_videos():
    """Get all active promo videos for the carousel"""
    videos = await db.promo_videos.find(
        {"is_active": True},
        {"_id": 0}
    ).sort("display_order", 1).to_list(100)
    return videos


@api_router.get("/promo-videos/by-day/{day_of_week}")
async def get_promo_videos_by_day(day_of_week: int):
    """Get videos for a specific day (0=Sunday to 6=Saturday)"""
    # Get day-specific videos first, then common videos
    day_videos = await db.promo_videos.find(
        {"is_active": True, "day_of_week": day_of_week, "is_common": False},
        {"_id": 0}
    ).sort("display_order", 1).to_list(50)
    
    common_videos = await db.promo_videos.find(
        {"is_active": True, "is_common": True},
        {"_id": 0}
    ).sort("display_order", 1).to_list(50)
    
    return day_videos + common_videos


@api_router.get("/admin/promo-videos")
async def admin_get_promo_videos(admin: str = Depends(get_current_admin)):
    """Get all promo videos for admin"""
    videos = await db.promo_videos.find({}, {"_id": 0}).sort("display_order", 1).to_list(100)
    return videos


@api_router.post("/admin/promo-videos")
async def admin_create_promo_video(video: PromoVideoCreate, admin: str = Depends(get_current_admin)):
    """Create a new promo video"""
    video_data = PromoVideo(
        title=video.title,
        url=video.url,
        day_of_week=video.day_of_week,
        is_common=video.is_common,
        display_order=video.display_order
    )
    await db.promo_videos.insert_one(video_data.model_dump())
    return {"id": video_data.id, "message": "Promo video created successfully"}


@api_router.put("/admin/promo-videos/{video_id}")
async def admin_update_promo_video(video_id: str, video: PromoVideoUpdate, admin: str = Depends(get_current_admin)):
    """Update a promo video"""
    existing = await db.promo_videos.find_one({"id": video_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Promo video not found")
    
    update_data = {k: v for k, v in video.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.promo_videos.update_one({"id": video_id}, {"$set": update_data})
    return {"message": "Promo video updated successfully"}


@api_router.delete("/admin/promo-videos/{video_id}")
async def admin_delete_promo_video(video_id: str, admin: str = Depends(get_current_admin)):
    """Delete a promo video"""
    result = await db.promo_videos.delete_one({"id": video_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Promo video not found")
    return {"message": "Promo video deleted successfully"}


@api_router.post("/admin/promo-videos/seed")
async def seed_promo_videos(admin: str = Depends(get_current_admin)):
    """Seed the database with initial promo videos"""
    existing_count = await db.promo_videos.count_documents({})
    if existing_count > 0:
        return {"message": f"Database already has {existing_count} promo videos. Skipping seed."}
    
    initial_videos = [
        # Common videos (show on all days)
        {"id": str(uuid.uuid4()), "title": "M-F $5 Specials", "url": "https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/gguqbaki_m-f%205%20specials.mp4", "day_of_week": -1, "is_common": True, "display_order": 100, "is_active": True, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "title": "Hookah Lounge", "url": "https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/5lk2zci7_Hookah.mp4", "day_of_week": -1, "is_common": True, "display_order": 101, "is_active": True, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
        # Day-specific videos
        {"id": str(uuid.uuid4()), "title": "Monday Special", "url": "https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/72qd1ab8_Monday.mp4", "day_of_week": 1, "is_common": False, "display_order": 0, "is_active": True, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "title": "Tuesday Special", "url": "https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/wvi3jxji_Tuesday.mp4", "day_of_week": 2, "is_common": False, "display_order": 0, "is_active": True, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "title": "Wednesday Special", "url": "https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/d6juf8fz_Wednesday.mp4", "day_of_week": 3, "is_common": False, "display_order": 0, "is_active": True, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "title": "Wednesday Special 2", "url": "https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/jzr5vp5d_Wednesday%20%282%29.mp4", "day_of_week": 3, "is_common": False, "display_order": 1, "is_active": True, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "title": "Thursday Special", "url": "https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/w9nk5dsp_Thursday.mp4", "day_of_week": 4, "is_common": False, "display_order": 0, "is_active": True, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "title": "Friday Special", "url": "https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/s5myd3mu_Friday.mp4", "day_of_week": 5, "is_common": False, "display_order": 0, "is_active": True, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
        {"id": str(uuid.uuid4()), "title": "Saturday Special", "url": "https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/lrdt4s1h_Saturday.mp4", "day_of_week": 6, "is_common": False, "display_order": 0, "is_active": True, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
    ]
    
    await db.promo_videos.insert_many(initial_videos)
    return {"message": f"Successfully seeded {len(initial_videos)} promo videos"}


# =====================================================
# WOOCOMMERCE MERCHANDISE ENDPOINTS
# =====================================================

@api_router.get("/merchandise")
async def get_merchandise():
    """Fetch products from WooCommerce store"""
    woo_url = os.environ.get("WOOCOMMERCE_URL")
    woo_key = os.environ.get("WOOCOMMERCE_KEY")
    woo_secret = os.environ.get("WOOCOMMERCE_SECRET")
    
    if not all([woo_url, woo_key, woo_secret]):
        raise HTTPException(status_code=500, detail="WooCommerce not configured")
    
    api_url = f"{woo_url}/wp-json/wc/v3/products"
    params = {
        "consumer_key": woo_key,
        "consumer_secret": woo_secret,
        "per_page": 50,
        "status": "publish"
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(api_url, params=params) as response:
                if response.status != 200:
                    raise HTTPException(status_code=response.status, detail="Failed to fetch products")
                products = await response.json()
                
                # Transform to simplified format
                simplified = []
                for p in products:
                    # Get the main image
                    image = p.get("images", [{}])[0].get("src", "") if p.get("images") else ""
                    
                    simplified.append({
                        "id": p.get("id"),
                        "name": p.get("name"),
                        "price": p.get("price"),
                        "regular_price": p.get("regular_price"),
                        "sale_price": p.get("sale_price"),
                        "description": p.get("short_description") or p.get("description", "")[:200],
                        "image": image,
                        "permalink": p.get("permalink"),
                        "in_stock": p.get("in_stock", True),
                        "categories": [c.get("name") for c in p.get("categories", [])]
                    })
                
                return simplified
    except aiohttp.ClientError as e:
        logging.error(f"WooCommerce API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to connect to store")


@api_router.get("/merchandise/{product_id}")
async def get_merchandise_product(product_id: int):
    """Fetch a single product from WooCommerce"""
    woo_url = os.environ.get("WOOCOMMERCE_URL")
    woo_key = os.environ.get("WOOCOMMERCE_KEY")
    woo_secret = os.environ.get("WOOCOMMERCE_SECRET")
    
    if not all([woo_url, woo_key, woo_secret]):
        raise HTTPException(status_code=500, detail="WooCommerce not configured")
    
    api_url = f"{woo_url}/wp-json/wc/v3/products/{product_id}"
    params = {
        "consumer_key": woo_key,
        "consumer_secret": woo_secret
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(api_url, params=params) as response:
                if response.status == 404:
                    raise HTTPException(status_code=404, detail="Product not found")
                if response.status != 200:
                    raise HTTPException(status_code=response.status, detail="Failed to fetch product")
                p = await response.json()
                
                return {
                    "id": p.get("id"),
                    "name": p.get("name"),
                    "price": p.get("price"),
                    "regular_price": p.get("regular_price"),
                    "sale_price": p.get("sale_price"),
                    "description": p.get("description"),
                    "short_description": p.get("short_description"),
                    "images": [img.get("src") for img in p.get("images", [])],
                    "permalink": p.get("permalink"),
                    "in_stock": p.get("in_stock", True),
                    "categories": [c.get("name") for c in p.get("categories", [])],
                    "attributes": p.get("attributes", []),
                    "variations": p.get("variations", [])
                }
    except aiohttp.ClientError as e:
        logging.error(f"WooCommerce API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to connect to store")


# =====================================================
# CART & MERCHANDISE CHECKOUT
# =====================================================

class CartItem(BaseModel):
    product_id: int
    name: str
    price: float
    quantity: int = 1
    image: Optional[str] = None

class CartCheckoutRequest(BaseModel):
    items: List[CartItem]
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None
    shipping_address: Optional[dict] = None


@api_router.post("/cart/checkout")
async def cart_checkout(checkout: CartCheckoutRequest, origin_url: str = None):
    """Create WooCommerce order for cart items"""
    if not checkout.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Create order record
    order_id = str(uuid.uuid4())
    total = sum(item.price * item.quantity for item in checkout.items)
    
    cart_order = {
        "id": order_id,
        "items": [item.model_dump() for item in checkout.items],
        "total": total,
        "customer_email": checkout.customer_email,
        "customer_name": checkout.customer_name,
        "status": "pending",
        "woo_order_id": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    await db.cart_orders.insert_one(cart_order)
    
    # Build WooCommerce line items
    line_items = []
    for item in checkout.items:
        line_items.append({
            "product_id": item.product_id,
            "quantity": item.quantity
        })
    
    # Meta data for tracking
    return_url = f"{origin_url}/merch?order=success&order_id={order_id}" if origin_url else None
    meta_data = [
        {"key": "ff_order_id", "value": order_id},
        {"key": "ff_type", "value": "merchandise"},
    ]
    if return_url:
        meta_data.append({"key": "ff_return_url", "value": return_url})
    
    try:
        order = await create_woocommerce_order(
            line_items=line_items,
            customer_email=checkout.customer_email,
            meta_data=meta_data
        )
        
        woo_order_id = order.get("id")
        checkout_url = order.get("payment_url") or f"{os.environ.get('WOOCOMMERCE_URL')}/checkout/order-pay/{woo_order_id}/?pay_for_order=true&key={order.get('order_key')}"
        
        # Update order with WooCommerce ID
        await db.cart_orders.update_one(
            {"id": order_id},
            {"$set": {"woo_order_id": woo_order_id, "updated_at": datetime.now(timezone.utc)}}
        )
        
        return {
            "checkout_url": checkout_url,
            "order_id": order_id,
            "woo_order_id": woo_order_id,
            "total": total
        }
    except Exception:
        await db.cart_orders.delete_one({"id": order_id})
        raise


@api_router.get("/cart/order/{order_id}")
async def get_cart_order_status(order_id: str):
    """Get cart order status"""
    cart_order = await db.cart_orders.find_one({"id": order_id}, {"_id": 0})
    if not cart_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check WooCommerce status if we have an order ID
    woo_order_id = cart_order.get("woo_order_id")
    if woo_order_id and cart_order.get("status") == "pending":
        woo_url = os.environ.get("WOOCOMMERCE_URL")
        woo_key = os.environ.get("WOOCOMMERCE_KEY")
        woo_secret = os.environ.get("WOOCOMMERCE_SECRET")
        
        try:
            async with aiohttp.ClientSession() as session:
                auth = aiohttp.BasicAuth(woo_key, woo_secret)
                api_url = f"{woo_url}/wp-json/wc/v3/orders/{woo_order_id}"
                async with session.get(api_url, auth=auth) as response:
                    if response.status == 200:
                        woo_order = await response.json()
                        woo_status = woo_order.get("status")
                        if woo_status in ["completed", "processing"]:
                            await db.cart_orders.update_one(
                                {"id": order_id},
                                {"$set": {"status": "paid", "updated_at": datetime.now(timezone.utc)}}
                            )
                            cart_order["status"] = "paid"
                        elif woo_status in ["cancelled", "failed"]:
                            await db.cart_orders.update_one(
                                {"id": order_id},
                                {"$set": {"status": woo_status, "updated_at": datetime.now(timezone.utc)}}
                            )
                            cart_order["status"] = woo_status
        except Exception as e:
            logging.error(f"Error checking order status: {e}")
    
    return cart_order


# ============================================================================
# EVENTS CRUD ENDPOINTS — moved to routes/events.py
# ============================================================================


# ============================================================================
# GALLERY SUBMISSIONS ADMIN ENDPOINTS
# ============================================================================

@api_router.get("/admin/gallery-submissions")
async def admin_get_gallery_submissions(username: str = Depends(get_current_admin)):
    """Get all user gallery submissions for admin moderation"""
    submissions = await db.user_gallery_submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return submissions


@api_router.delete("/admin/gallery-submissions/{submission_id}")
async def admin_delete_gallery_submission(submission_id: str, username: str = Depends(get_current_admin)):
    """Delete a user gallery submission and its corresponding gallery item"""
    # Delete from user submissions
    result = await db.user_gallery_submissions.delete_one({"id": submission_id})
    
    # Also remove from main gallery if it was auto-added
    await db.gallery_items.delete_one({"id": submission_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return {"success": True, "message": "Submission deleted"}


# ============================================================================
# ADMIN SOCIAL POSTS (COMMENTS) MANAGEMENT
# ============================================================================

@api_router.get("/admin/social-posts")
async def admin_get_all_social_posts(username: str = Depends(get_current_admin)):
    """Get all social posts across all locations for admin moderation"""
    posts = await db.social_posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return posts


@api_router.delete("/admin/social-posts/{post_id}")
async def admin_delete_social_post(post_id: str, username: str = Depends(get_current_admin)):
    """Delete a social post (admin only)"""
    result = await db.social_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"success": True, "message": "Post deleted"}


@api_router.delete("/admin/social-posts/cleanup/old")
async def admin_cleanup_old_posts(username: str = Depends(get_current_admin)):
    """Manually trigger cleanup of old posts without images"""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    
    # Delete posts older than 24 hours that don't have images
    result = await db.social_posts.delete_many({
        "created_at": {"$lt": cutoff},
        "$or": [
            {"image_url": None},
            {"image_url": ""},
            {"image_url": {"$exists": False}}
        ]
    })
    
    return {
        "success": True, 
        "deleted_count": result.deleted_count,
        "message": f"Deleted {result.deleted_count} old posts without images"
    }


# ============================================================================
# ADMIN USER MANAGEMENT
# ============================================================================

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, username: str = Depends(get_current_admin)):
    """Delete a user and all their associated data"""
    # Check if user exists
    profile = await db.user_profiles.find_one({"id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Don't allow deleting admin users
    if profile.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete admin users")
    
    # Delete user's data from various collections
    await db.user_profiles.delete_one({"id": user_id})
    await db.checkins.delete_many({"$or": [{"user_id": user_id}, {"id": user_id}]})
    await db.social_posts.delete_many({"author_id": user_id})
    await db.direct_messages.delete_many({"$or": [{"from_id": user_id}, {"to_id": user_id}]})
    await db.dj_tips.delete_many({"from_id": user_id})
    await db.drink_orders.delete_many({"$or": [{"from_id": user_id}, {"to_id": user_id}]})
    await db.token_purchases.delete_many({"user_id": user_id})
    await db.user_gallery_submissions.delete_many({"user_id": user_id})
    
    return {"success": True, "message": f"User {profile.get('name', 'Unknown')} and all their data deleted"}


# ============================================================================
# SCHEDULED CLEANUP ENDPOINT (can be called by cron/scheduler)
# ============================================================================

@api_router.post("/system/cleanup-old-posts")
async def system_cleanup_old_posts(api_key: str = None):
    """
    System endpoint to clean up old posts without images.
    Should be called by a scheduler at 4am EST daily.
    Requires system API key for security.
    """
    # Simple security check - in production, use a proper API key
    system_key = os.environ.get("SYSTEM_API_KEY", "ff-system-cleanup-2026")
    if api_key != system_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    
    # Delete posts older than 24 hours that don't have images
    result = await db.social_posts.delete_many({
        "created_at": {"$lt": cutoff},
        "$or": [
            {"image_url": None},
            {"image_url": ""},
            {"image_url": {"$exists": False}}
        ]
    })
    
    logging.info(f"Scheduled cleanup: Deleted {result.deleted_count} old posts without images")
    
    return {
        "success": True,
        "deleted_count": result.deleted_count,
        "cleanup_time": datetime.now(timezone.utc).isoformat()
    }


# ============================================================================
# STRIPE PAYMENT ENDPOINTS — moved to routes/payments.py
# ============================================================================


# CAREERS / JOB APPLICATION ENDPOINTS - Moved to routes/careers.py


# Middleware to add cache-control headers for API responses

@app.middleware("http")
async def add_cache_control_headers(request: Request, call_next):
    response = await call_next(request)
    # Add no-cache headers for API requests to prevent stale data
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# SCHEDULED TASKS - Cleanup old posts at 4am EST (9am UTC) daily
# ============================================================================

scheduler = AsyncIOScheduler()

async def scheduled_cleanup_old_posts():
    """Scheduled task to clean up old posts without images (runs at 4am EST daily)"""
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        
        # Delete posts older than 24 hours that don't have images
        result = await db.social_posts.delete_many({
            "created_at": {"$lt": cutoff},
            "$or": [
                {"image_url": None},
                {"image_url": ""},
                {"image_url": {"$exists": False}}
            ]
        })
        
        # Also cleanup expired check-ins
        checkin_result = await db.checkins.delete_many({
            "checked_in_at": {"$lt": cutoff}
        })
        
        logging.info(f"Scheduled cleanup: Deleted {result.deleted_count} old posts, {checkin_result.deleted_count} expired check-ins")
    except Exception as e:
        logging.error(f"Scheduled cleanup error: {e}")


# Include feature routers
from routes.wall import router as wall_router
from routes.careers import router as careers_router
from routes.dj import router as dj_router
from routes.auth import router as auth_router
from routes.events import router as events_router
from routes.payments import router as payments_router
from routes.stream import router as stream_router

app.include_router(wall_router)
app.include_router(careers_router)
app.include_router(dj_router)
app.include_router(auth_router)
app.include_router(events_router)
app.include_router(payments_router)
app.include_router(stream_router)

# Include the main router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_scheduler():
    """Start the background scheduler on app startup"""
    # Schedule cleanup at 4am EST (9am UTC) every day
    scheduler.add_job(
        scheduled_cleanup_old_posts,
        CronTrigger(hour=9, minute=0, timezone='UTC'),  # 4am EST = 9am UTC
        id='cleanup_old_posts',
        replace_existing=True
    )
    scheduler.start()
    await ensure_default_admin_user()
    logging.info("Scheduler started: Post cleanup scheduled for 4am EST (9am UTC) daily")


@app.on_event("shutdown")
async def shutdown_db_client():
    scheduler.shutdown()
    client.close()