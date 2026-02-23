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


# Social Links Model
class SocialLink(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    platform: str  # instagram, facebook, tiktok, twitter
    url: str
    username: str
    is_active: bool = True
    display_order: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SocialLinkCreate(BaseModel):
    platform: str
    url: str
    username: str
    display_order: int = 0

class SocialLinkUpdate(BaseModel):
    platform: Optional[str] = None
    url: Optional[str] = None
    username: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


# Instagram Post Model (for feed)
class InstagramPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    instagram_url: str
    caption: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    display_order: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class InstagramPostCreate(BaseModel):
    instagram_url: str
    caption: Optional[str] = None
    image_url: Optional[str] = None
    display_order: int = 0

class InstagramPostUpdate(BaseModel):
    instagram_url: Optional[str] = None
    caption: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


# Location Check-in Model
class CheckIn(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location_slug: str
    display_name: str
    avatar_emoji: str = "😊"
    mood: Optional[str] = None  # e.g., "Vibing", "Hungry", "Celebrating"
    message: Optional[str] = None
    checked_in_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = None  # Auto-checkout after X hours

class CheckInCreate(BaseModel):
    location_slug: str
    display_name: str
    avatar_emoji: str = "😊"
    mood: Optional[str] = None
    message: Optional[str] = None

class CheckInResponse(BaseModel):
    id: str
    location_slug: str
    display_name: str
    avatar_emoji: str
    mood: Optional[str]
    message: Optional[str]
    checked_in_at: datetime


# Gallery Item Model
class GalleryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    image_url: str
    category: str  # food, ambiance, drinks, promo
    is_active: bool = True
    display_order: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GalleryItemCreate(BaseModel):
    title: str
    image_url: str
    category: str = "food"
    display_order: int = 0

class GalleryItemUpdate(BaseModel):
    title: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


# Homepage Content Model
class HomepageContent(BaseModel):
    id: str = "homepage"  # Single document for homepage
    tagline: str = "Elevated dining meets Southern soul"
    logo_url: str = ""
    contact_phone: str = "(404) 855-5524"
    contact_email: str = "info@finandfeathersrestaurants.com"
    contact_address: str = "Multiple Locations across Georgia & Las Vegas"
    social_feed_images: List[dict] = []  # [{url, caption}]
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class HomepageContentUpdate(BaseModel):
    tagline: Optional[str] = None
    logo_url: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    contact_address: Optional[str] = None
    social_feed_images: Optional[List[dict]] = None


# =====================================================
# SOCIAL CHECK-IN MODELS
# =====================================================

# Social Wall Post (public messages at a location)
class SocialPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location_slug: str
    checkin_id: str  # Reference to the check-in
    author_name: str
    author_emoji: str
    message: str
    image_url: Optional[str] = None
    likes: List[str] = []  # List of checkin_ids that liked
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SocialPostCreate(BaseModel):
    location_slug: str
    checkin_id: str
    author_name: str
    author_emoji: str
    message: str
    image_url: Optional[str] = None

class SocialPostResponse(BaseModel):
    id: str
    location_slug: str
    checkin_id: str
    author_name: str
    author_emoji: str
    message: str
    image_url: Optional[str]
    likes_count: int
    liked_by_me: bool = False
    created_at: datetime


# Direct Messages between checked-in users
class DirectMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location_slug: str
    from_checkin_id: str
    from_name: str
    from_emoji: str
    to_checkin_id: str
    to_name: str
    to_emoji: str
    message: str
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DirectMessageCreate(BaseModel):
    location_slug: str
    from_checkin_id: str
    from_name: str
    from_emoji: str
    to_checkin_id: str
    to_name: str
    to_emoji: str
    message: str

class DirectMessageResponse(BaseModel):
    id: str
    location_slug: str
    from_checkin_id: str
    from_name: str
    from_emoji: str
    to_checkin_id: str
    to_name: str
    to_emoji: str
    message: str
    read: bool
    created_at: datetime


# DJ Tips
class DJTip(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location_slug: str
    checkin_id: str
    tipper_name: str
    tipper_emoji: str
    amount: float
    message: Optional[str] = None
    song_request: Optional[str] = None
    payment_method: str = "cash_app"  # cash_app, apple_pay, venmo
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DJTipCreate(BaseModel):
    location_slug: str
    checkin_id: str
    tipper_name: str
    tipper_emoji: str
    amount: float
    message: Optional[str] = None
    song_request: Optional[str] = None
    payment_method: str = "cash_app"

class DJTipResponse(BaseModel):
    id: str
    location_slug: str
    tipper_name: str
    tipper_emoji: str
    amount: float
    message: Optional[str]
    song_request: Optional[str]
    payment_method: Optional[str] = "cash_app"
    created_at: datetime


# DJ Profile - For DJs to register and show their payment info
class DJProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    stage_name: Optional[str] = None
    avatar_emoji: str = "🎧"
    cash_app_username: Optional[str] = None  # e.g., "$DJMike"
    venmo_username: Optional[str] = None  # e.g., "@DJMike"
    apple_pay_phone: Optional[str] = None  # Phone number for Apple Pay
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: bool = True
    current_location: Optional[str] = None  # Location slug where DJ is currently playing
    checked_in_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DJProfileCreate(BaseModel):
    name: str
    stage_name: Optional[str] = None
    avatar_emoji: str = "🎧"
    cash_app_username: Optional[str] = None
    venmo_username: Optional[str] = None
    apple_pay_phone: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None

class DJProfileUpdate(BaseModel):
    name: Optional[str] = None
    stage_name: Optional[str] = None
    avatar_emoji: Optional[str] = None
    cash_app_username: Optional[str] = None
    venmo_username: Optional[str] = None
    apple_pay_phone: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: Optional[bool] = None

class DJProfileResponse(BaseModel):
    id: str
    name: str
    stage_name: Optional[str]
    avatar_emoji: str
    cash_app_username: Optional[str]
    venmo_username: Optional[str]
    apple_pay_phone: Optional[str]
    bio: Optional[str]
    photo_url: Optional[str]
    is_active: bool
    current_location: Optional[str]
    checked_in_at: Optional[datetime]


# Send a Drink - Users can send drinks to each other
class DrinkOrder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location_slug: str
    from_checkin_id: str
    from_name: str
    from_emoji: str
    to_checkin_id: str
    to_name: str
    to_emoji: str
    drink_name: str
    drink_emoji: str
    message: Optional[str] = None
    status: str = "pending"  # pending, accepted, delivered
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DrinkOrderCreate(BaseModel):
    location_slug: str
    from_checkin_id: str
    from_name: str
    from_emoji: str
    to_checkin_id: str
    to_name: str
    to_emoji: str
    drink_name: str
    drink_emoji: str
    message: Optional[str] = None

class DrinkOrderResponse(BaseModel):
    id: str
    location_slug: str
    from_checkin_id: str
    from_name: str
    from_emoji: str
    to_checkin_id: str
    to_name: str
    to_emoji: str
    drink_name: str
    drink_emoji: str
    message: Optional[str]
    status: str
    created_at: datetime


# =====================================================
# USER PROFILE MODELS
# =====================================================

class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    avatar_emoji: str = "😊"
    profile_photo_url: Optional[str] = None  # URL to uploaded profile photo/selfie
    # Role: customer, staff, management, admin
    role: str = "customer"
    # Staff-specific fields
    staff_title: Optional[str] = None  # e.g., "Bartender", "DJ", "Server"
    cashout_balance: float = 0.0  # Accumulated tips in USD for staff (before cashout)
    total_earnings: float = 0.0  # Total lifetime earnings from tips
    # Dates
    birthdate: Optional[str] = None  # YYYY-MM-DD format
    anniversary: Optional[str] = None  # YYYY-MM-DD format
    special_dates: List[dict] = []  # [{name, date}]
    # Social media handles
    instagram_handle: Optional[str] = None
    facebook_handle: Optional[str] = None
    twitter_handle: Optional[str] = None
    tiktok_handle: Optional[str] = None
    # F&F Tokens - $1 = 10 tokens, used for DJ tips and drinks
    token_balance: int = 0
    # Stats
    total_visits: int = 0
    total_posts: int = 0
    total_photos: int = 0
    # Settings
    allow_gallery_posts: bool = True  # Auto-add photo posts to gallery
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserProfileCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    avatar_emoji: str = "😊"

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    avatar_emoji: Optional[str] = None
    profile_photo_url: Optional[str] = None
    role: Optional[str] = None
    staff_title: Optional[str] = None
    birthdate: Optional[str] = None
    anniversary: Optional[str] = None
    special_dates: Optional[List[dict]] = None
    instagram_handle: Optional[str] = None
    facebook_handle: Optional[str] = None
    twitter_handle: Optional[str] = None
    tiktok_handle: Optional[str] = None
    allow_gallery_posts: Optional[bool] = None

class UserProfileResponse(BaseModel):
    id: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    avatar_emoji: str = "👤"
    profile_photo_url: Optional[str] = None
    role: str = "customer"
    staff_title: Optional[str] = None
    cashout_balance: float = 0.0
    total_earnings: float = 0.0
    birthdate: Optional[str] = None
    anniversary: Optional[str] = None
    special_dates: List[dict] = []
    instagram_handle: Optional[str] = None
    facebook_handle: Optional[str] = None
    twitter_handle: Optional[str] = None
    tiktok_handle: Optional[str] = None
    token_balance: int = 0
    total_visits: int = 0
    total_posts: int = 0
    total_photos: int = 0
    allow_gallery_posts: bool = True
    created_at: datetime
    updated_at: datetime


# Token Transfer Model
class TokenTransfer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_user_id: str
    to_user_id: str
    amount: int
    transfer_type: str  # "tip", "drink", "gift", "transfer"
    message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TokenTransferCreate(BaseModel):
    to_user_id: str
    amount: int
    transfer_type: str = "transfer"
    message: Optional[str] = None

class TokenTransferResponse(BaseModel):
    id: str
    from_user_id: str
    to_user_id: str
    amount: int
    transfer_type: str
    message: Optional[str]
    created_at: datetime


# Cashout Request Model
class CashoutRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount_tokens: int
    amount_usd: float  # 80% of token value
    status: str = "pending"  # pending, approved, paid, rejected
    payment_method: Optional[str] = None  # venmo, cashapp, bank
    payment_details: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None

class CashoutRequestCreate(BaseModel):
    amount_tokens: int
    payment_method: str
    payment_details: str

class CashoutRequestResponse(BaseModel):
    id: str
    user_id: str
    amount_tokens: int
    amount_usd: float
    status: str
    payment_method: Optional[str]
    created_at: datetime


# Role Update Model (admin/management only)
class RoleUpdate(BaseModel):
    user_id: str
    new_role: str  # customer, staff, management
    staff_title: Optional[str] = None


# Token Purchase Model
class TokenPurchase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount_usd: float  # $1 = 10 tokens
    tokens_purchased: int
    payment_method: str = "card"  # card, gift (admin gifted)
    gifted_by: Optional[str] = None  # Admin username if gifted
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TokenPurchaseCreate(BaseModel):
    amount_usd: float  # Must be at least $1

class TokenGiftCreate(BaseModel):
    user_id: str
    tokens: int
    message: Optional[str] = None

class TokenPurchaseResponse(BaseModel):
    id: str
    user_id: str
    amount_usd: float
    tokens_purchased: int
    payment_method: str
    gifted_by: Optional[str]
    created_at: datetime


# User Gallery Submission Model (auto-approved)
class UserGallerySubmission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    image_url: str
    caption: Optional[str] = None
    location_slug: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserGallerySubmissionCreate(BaseModel):
    image_url: str
    caption: Optional[str] = None
    location_slug: Optional[str] = None

class UserGallerySubmissionResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    image_url: str
    caption: Optional[str]
    location_slug: Optional[str]
    created_at: datetime


# User Visit History
class UserVisit(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    location_slug: str
    location_name: str
    checkin_id: str
    checked_in_at: datetime
    checked_out_at: Optional[datetime] = None

class UserVisitResponse(BaseModel):
    id: str
    location_slug: str
    location_name: str
    checked_in_at: datetime
    checked_out_at: Optional[datetime]


# =====================================================
# LOCATION MODELS
# =====================================================

class LocationHours(BaseModel):
    monday: str = "Closed"
    tuesday: str = "Closed"
    wednesday: str = "Closed"
    thursday: str = "Closed"
    friday: str = "Closed"
    saturday: str = "Closed"
    sunday: str = "Closed"

class LocationCoordinates(BaseModel):
    lat: float
    lng: float

class LocationSocialMedia(BaseModel):
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    twitter: Optional[str] = None
    tiktok: Optional[str] = None

class WeeklySpecial(BaseModel):
    day: str
    special: str
    image: Optional[str] = None

class Location(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str  # URL-friendly identifier e.g., "edgewood-atlanta"
    name: str
    address: str
    phone: str
    reservation_phone: Optional[str] = None
    coordinates: LocationCoordinates
    image: str  # Main location image
    hours: LocationHours
    online_ordering: Optional[str] = None  # ToastTab or similar URL
    reservations: Optional[str] = None  # SMS link for reservations
    delivery: Optional[str] = None
    social_media: LocationSocialMedia = LocationSocialMedia()
    weekly_specials: List[WeeklySpecial] = []
    is_active: bool = True
    display_order: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class LocationCreate(BaseModel):
    slug: str
    name: str
    address: str
    phone: str
    reservation_phone: Optional[str] = None
    coordinates: LocationCoordinates
    image: str
    hours: LocationHours = LocationHours()
    online_ordering: Optional[str] = None
    reservations: Optional[str] = None
    delivery: Optional[str] = None
    social_media: LocationSocialMedia = LocationSocialMedia()
    weekly_specials: List[WeeklySpecial] = []
    display_order: int = 0

class LocationUpdate(BaseModel):
    slug: Optional[str] = None
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    reservation_phone: Optional[str] = None
    coordinates: Optional[LocationCoordinates] = None
    image: Optional[str] = None
    hours: Optional[LocationHours] = None
    online_ordering: Optional[str] = None
    reservations: Optional[str] = None
    delivery: Optional[str] = None
    social_media: Optional[LocationSocialMedia] = None
    weekly_specials: Optional[List[WeeklySpecial]] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None

class LocationResponse(BaseModel):
    id: str
    slug: str
    name: str
    address: str
    phone: str
    reservation_phone: Optional[str]
    coordinates: LocationCoordinates
    image: str
    hours: LocationHours
    online_ordering: Optional[str]
    reservations: Optional[str]
    delivery: Optional[str]
    social_media: LocationSocialMedia
    weekly_specials: List[WeeklySpecial]
    is_active: bool
    display_order: int
    created_at: datetime
    updated_at: datetime


# =====================================================
# PROMO VIDEO MODELS
# =====================================================

class PromoVideo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    url: str
    day_of_week: int = -1  # 0=Sunday, 1=Monday, ..., 6=Saturday, -1=All days
    is_common: bool = False  # Common videos show on all days after day-specific
    display_order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PromoVideoCreate(BaseModel):
    title: str
    url: str
    day_of_week: int = -1
    is_common: bool = False
    display_order: int = 0

class PromoVideoUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    day_of_week: Optional[int] = None
    is_common: Optional[bool] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

