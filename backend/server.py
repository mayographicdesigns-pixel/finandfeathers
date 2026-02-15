from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timezone
from models import (
    LoyaltyMember, LoyaltyMemberCreate, PushSubscription,
    PushNotification, PushNotificationCreate,
    ContactForm, ContactFormCreate, ContactFormUpdate,
    MenuItem, MenuItemCreate, MenuItemUpdate,
    UserLogin, Token, UserResponse
)
from push_service import PushNotificationService
from auth import verify_password, get_password_hash, create_access_token, decode_access_token
import uuid


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize Push Notification Service
push_service = PushNotificationService(db)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Health check
@api_router.get("/")
async def root():
    return {"message": "Fin & Feathers API is running"}


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