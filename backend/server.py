from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timezone
import shutil
from models import (
    LoyaltyMember, LoyaltyMemberCreate, PushSubscription,
    PushNotification, PushNotificationCreate,
    ContactForm, ContactFormCreate, ContactFormUpdate,
    MenuItem, MenuItemCreate, MenuItemUpdate,
    UserLogin, Token, UserResponse,
    Special, SpecialCreate, SpecialUpdate
)
from push_service import PushNotificationService
from auth import verify_password, get_password_hash, create_access_token, decode_access_token
import uuid


ROOT_DIR = Path(__file__).parent
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
security = HTTPBearer()

# Admin credentials (hardcoded as requested)
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD_HASH = get_password_hash("admin")

# Create the main app without a prefix
app = FastAPI()

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Auth dependency
async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return admin username"""
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    username = payload.get("sub")
    if username != ADMIN_USERNAME:
        raise HTTPException(status_code=403, detail="Not authorized")
    return username


# Health check
@api_router.get("/")
async def root():
    return {"message": "Fin & Feathers API is running"}


# Public Menu Endpoints (no auth required)
@api_router.get("/menu/items")
async def get_public_menu_items():
    """Get all menu items for public display"""
    items = await db.menu_items.find({}, {"_id": 0}).to_list(1000)
    return items


@api_router.get("/menu/categories")
async def get_menu_categories():
    """Get unique menu categories"""
    categories = await db.menu_items.distinct("category")
    return categories


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


# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """Admin login endpoint"""
    if credentials.username != ADMIN_USERNAME:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, ADMIN_PASSWORD_HASH):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": credentials.username})
    return Token(access_token=access_token, token_type="bearer")


@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user(username: str = Depends(get_current_admin)):
    """Get current authenticated admin info"""
    return UserResponse(
        id="admin-001",
        username=username,
        email="admin@finandfeathers.com",
        is_admin=True,
        is_active=True,
        created_at=datetime.now(timezone.utc)
    )


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
    contacts = await db.contact_forms.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return contacts


@api_router.patch("/admin/contacts/{contact_id}")
async def admin_update_contact(contact_id: str, update: ContactFormUpdate, username: str = Depends(get_current_admin)):
    """Update contact form status"""
    result = await db.contact_forms.update_one(
        {"id": contact_id},
        {"$set": {"status": update.status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact updated successfully"}


# Menu Items (Admin)
@api_router.get("/admin/menu-items")
async def admin_get_menu_items(username: str = Depends(get_current_admin)):
    """Get all menu items for admin"""
    items = await db.menu_items.find({}, {"_id": 0}).to_list(1000)
    return items


@api_router.post("/admin/menu-items")
async def admin_create_menu_item(item: MenuItemCreate, username: str = Depends(get_current_admin)):
    """Create a new menu item"""
    item_dict = item.dict()
    item_dict["id"] = str(uuid.uuid4())
    await db.menu_items.insert_one(item_dict)
    # Remove MongoDB's _id before returning
    item_dict.pop("_id", None)
    return {**item_dict}


@api_router.put("/admin/menu-items/{item_id}")
async def admin_update_menu_item(item_id: str, update: MenuItemUpdate, username: str = Depends(get_current_admin)):
    """Update a menu item"""
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.menu_items.update_one(
        {"id": item_id},
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"message": "Menu item updated successfully"}


@api_router.delete("/admin/menu-items/{item_id}")
async def admin_delete_menu_item(item_id: str, username: str = Depends(get_current_admin)):
    """Delete a menu item"""
    result = await db.menu_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"message": "Menu item deleted successfully"}


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
    contacts_count = await db.contact_forms.count_documents({})
    new_contacts_count = await db.contact_forms.count_documents({"status": "new"})
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


# File Upload (Admin)
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

@api_router.post("/admin/upload")
async def admin_upload_file(
    file: UploadFile = File(...),
    username: str = Depends(get_current_admin)
):
    """Upload an image file for menu items"""
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    try:
        # Check file size by reading content
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB")
        
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Return the URL path (will be served via static files mount)
        return {
            "filename": unique_filename,
            "url": f"/uploads/{unique_filename}",
            "size": len(contents)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")


@api_router.get("/admin/uploads")
async def admin_list_uploads(username: str = Depends(get_current_admin)):
    """List all uploaded files"""
    files = []
    for f in UPLOAD_DIR.iterdir():
        if f.is_file() and f.suffix.lower() in ALLOWED_EXTENSIONS:
            files.append({
                "filename": f.name,
                "url": f"/uploads/{f.name}",
                "size": f.stat().st_size
            })
    return files


@api_router.delete("/admin/uploads/{filename}")
async def admin_delete_upload(filename: str, username: str = Depends(get_current_admin)):
    """Delete an uploaded file"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        file_path.unlink()
        return {"message": "File deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()