from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
import uuid

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
    sent_to: List[str] = []  # List of member IDs
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
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ContactFormCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str
