from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
import uuid

# User/Admin Model
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    hashed_password: str
    is_admin: bool = False
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    is_admin: bool = False

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: EmailStr
    is_admin: bool
    is_active: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

# Loyalty Member Model
class LoyaltyMember(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: Optional[str] = None
    marketing_consent: bool = True
    push_subscription: Optional[dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class LoyaltyMemberCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    marketing_consent: bool = True

class PushSubscription(BaseModel):
    endpoint: str
    keys: dict

# Push Notification Model
class PushNotification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    body: str
    icon: Optional[str] = "/logo192.png"
    badge: Optional[str] = "/logo192.png"
    image: Optional[str] = None
    url: Optional[str] = "/"
    sent_to: List[str] = []
    sent_at: datetime = Field(default_factory=datetime.utcnow)

class PushNotificationCreate(BaseModel):
    title: str
    body: str
    icon: Optional[str] = "/logo192.png"
    image: Optional[str] = None
    url: Optional[str] = "/"
    send_to_all: bool = True

# Contact Form Model
class ContactForm(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str
    status: str = "new"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ContactFormCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str

class ContactFormUpdate(BaseModel):
    status: Optional[str] = None

# Menu Item Model
class MenuItem(BaseModel):
    id: str
    name: str
    description: str
    price: float
    image: str
    category: str
    badges: List[str] = []

class MenuItemCreate(BaseModel):
    name: str
    description: str
    price: float
    image: str
    category: str
    badges: List[str] = []

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    category: Optional[str] = None
    badges: Optional[List[str]] = None

# Media/Photo Upload Model
class Media(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    url: str
    type: str  # image, video
    category: str  # menu, location, promotion
    uploaded_by: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

class MediaCreate(BaseModel):
    filename: str
    url: str
    type: str
    category: str


# Special/Promotion Model
class Special(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    image: Optional[str] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: bool = True
    location_id: Optional[str] = None  # None means all locations
    created_at: datetime = Field(default_factory=datetime.utcnow)
    notification_sent: bool = False
    notification_sent_at: Optional[datetime] = None

class SpecialCreate(BaseModel):
    title: str
    description: str
    image: Optional[str] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    location_id: Optional[str] = None
    send_notification: bool = True  # Auto-send push notification

class SpecialUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: Optional[bool] = None
    location_id: Optional[str] = None

