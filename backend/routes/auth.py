"""Auth router — admin login, Google OAuth, user registration, password login, forgot/reset password."""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from database import (
    db, security, get_current_admin,
    ADMIN_USERNAME, ADMIN_PASSWORD_HASH,
    SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD
)
from auth import verify_password, get_password_hash, create_access_token, decode_access_token
from models import UserLogin, Token, UserResponse
from datetime import datetime, timezone, timedelta
import aiohttp
import uuid
import logging
import re
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter(prefix="/api")


# ==================== AUTH ENDPOINTS ====================

@router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """Admin login endpoint - supports both legacy username and email login"""
    admin_user = None
    if "@" in credentials.username:
        admin_user = await db.admin_users.find_one({"email": credentials.username.lower()})
    else:
        admin_user = await db.admin_users.find_one({"username": credentials.username.lower()})

    if admin_user:
        if not admin_user.get("is_active", True):
            raise HTTPException(status_code=401, detail="Account is disabled")
        if verify_password(credentials.password, admin_user.get("password_hash", "")):
            access_token = create_access_token(data={"sub": admin_user["username"], "admin_id": admin_user["id"]})
            return Token(access_token=access_token, token_type="bearer")
        if credentials.username.lower() == ADMIN_USERNAME and verify_password(credentials.password, ADMIN_PASSWORD_HASH):
            await db.admin_users.update_one(
                {"id": admin_user["id"]},
                {"$set": {"password_hash": ADMIN_PASSWORD_HASH, "updated_at": datetime.now(timezone.utc)}}
            )
            access_token = create_access_token(data={"sub": admin_user["username"], "admin_id": admin_user["id"]})
            return Token(access_token=access_token, token_type="bearer")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if credentials.username.lower() != ADMIN_USERNAME:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(credentials.password, ADMIN_PASSWORD_HASH):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": credentials.username})
    return Token(access_token=access_token, token_type="bearer")


@router.get("/auth/me", response_model=UserResponse)
async def get_current_user(username: str = Depends(get_current_admin)):
    """Get current authenticated admin info"""
    admin_user = await db.admin_users.find_one({"username": username}, {"_id": 0})
    if admin_user:
        return UserResponse(
            id=admin_user["id"],
            username=admin_user["username"],
            email=admin_user.get("email", ""),
            is_admin=True,
            is_active=admin_user.get("is_active", True),
            created_at=admin_user.get("created_at", datetime.now(timezone.utc))
        )
    return UserResponse(
        id="admin-001", username=username, email="admin@finandfeathers.com",
        is_admin=True, is_active=True, created_at=datetime.now(timezone.utc)
    )


# ==================== ADMIN USER MANAGEMENT ====================

@router.get("/admin/users/admins")
async def get_admin_users(username: str = Depends(get_current_admin)):
    """Get all admin users"""
    admins = await db.admin_users.find({}, {"_id": 0, "password_hash": 0}).to_list(100)
    if not admins:
        admins = [{
            "id": "admin-001", "username": "admin", "email": "admin@finandfeathers.com",
            "is_active": True, "is_super_admin": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }]
    for admin in admins:
        if isinstance(admin.get("created_at"), datetime):
            admin["created_at"] = admin["created_at"].isoformat()
    return admins


@router.post("/admin/users/admins")
async def create_admin_user(request: Request, username: str = Depends(get_current_admin)):
    """Create a new admin user"""
    try:
        body = await request.json()
        new_username = body.get("username", "").strip().lower()
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")
        is_super_admin = body.get("is_super_admin", False)

        if not new_username or not email or not password:
            raise HTTPException(status_code=400, detail="Username, email, and password are required")
        if len(new_username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
        if len(password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

        existing = await db.admin_users.find_one({"username": new_username})
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists")
        existing_email = await db.admin_users.find_one({"email": email})
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already in use")

        admin_id = f"admin_{uuid.uuid4().hex[:12]}"
        password_hash = get_password_hash(password)
        new_admin = {
            "id": admin_id, "username": new_username, "email": email,
            "password_hash": password_hash, "is_active": True,
            "is_super_admin": is_super_admin, "created_by": username,
            "created_at": datetime.now(timezone.utc)
        }
        await db.admin_users.insert_one(new_admin)
        return {
            "success": True,
            "admin": {
                "id": admin_id, "username": new_username, "email": email,
                "is_active": True, "is_super_admin": is_super_admin,
                "created_at": new_admin["created_at"].isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Create admin error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create admin user")


@router.put("/admin/users/admins/{admin_id}")
async def update_admin_user(admin_id: str, request: Request, username: str = Depends(get_current_admin)):
    """Update an admin user (change password, email, status)"""
    try:
        body = await request.json()
        admin_user = await db.admin_users.find_one({"id": admin_id})
        if not admin_user:
            if admin_id == "admin-001":
                raise HTTPException(status_code=400, detail="Cannot modify legacy admin account from here")
            raise HTTPException(status_code=404, detail="Admin user not found")

        update_fields = {}
        if "email" in body and body["email"]:
            new_email = body["email"].strip().lower()
            existing = await db.admin_users.find_one({"email": new_email, "id": {"$ne": admin_id}})
            if existing:
                raise HTTPException(status_code=400, detail="Email already in use")
            update_fields["email"] = new_email
        if "password" in body and body["password"]:
            if len(body["password"]) < 6:
                raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
            update_fields["password_hash"] = get_password_hash(body["password"])
        if "is_active" in body:
            update_fields["is_active"] = body["is_active"]
        if "is_super_admin" in body:
            update_fields["is_super_admin"] = body["is_super_admin"]

        if update_fields:
            update_fields["updated_at"] = datetime.now(timezone.utc)
            await db.admin_users.update_one({"id": admin_id}, {"$set": update_fields})

        updated_admin = await db.admin_users.find_one({"id": admin_id}, {"_id": 0, "password_hash": 0})
        if isinstance(updated_admin.get("created_at"), datetime):
            updated_admin["created_at"] = updated_admin["created_at"].isoformat()
        if isinstance(updated_admin.get("updated_at"), datetime):
            updated_admin["updated_at"] = updated_admin["updated_at"].isoformat()
        return {"success": True, "admin": updated_admin}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Update admin error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update admin user")


@router.delete("/admin/users/admins/{admin_id}")
async def delete_admin_user(admin_id: str, username: str = Depends(get_current_admin)):
    """Delete an admin user"""
    try:
        if admin_id == "admin-001":
            raise HTTPException(status_code=400, detail="Cannot delete legacy admin account")
        admin_user = await db.admin_users.find_one({"id": admin_id})
        if not admin_user:
            raise HTTPException(status_code=404, detail="Admin user not found")
        if admin_user["username"] == username:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")
        await db.admin_users.delete_one({"id": admin_id})
        return {"success": True, "message": "Admin user deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Delete admin error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete admin user")


@router.post("/admin/users/admins/change-password")
async def change_admin_password(request: Request, username: str = Depends(get_current_admin)):
    """Change the current admin's password"""
    try:
        body = await request.json()
        current_password = body.get("current_password", "")
        new_password = body.get("new_password", "")
        if not current_password or not new_password:
            raise HTTPException(status_code=400, detail="Current and new passwords are required")
        if len(new_password) < 6:
            raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

        admin_user = await db.admin_users.find_one({"username": username})
        if admin_user:
            if not verify_password(current_password, admin_user.get("password_hash", "")):
                raise HTTPException(status_code=401, detail="Current password is incorrect")
            new_hash = get_password_hash(new_password)
            await db.admin_users.update_one(
                {"username": username},
                {"$set": {"password_hash": new_hash, "updated_at": datetime.now(timezone.utc)}}
            )
            return {"success": True, "message": "Password changed successfully"}
        else:
            if not verify_password(current_password, ADMIN_PASSWORD_HASH):
                raise HTTPException(status_code=401, detail="Current password is incorrect")
            admin_id = f"admin_{uuid.uuid4().hex[:12]}"
            new_hash = get_password_hash(new_password)
            new_admin = {
                "id": admin_id, "username": username, "email": "admin@finandfeathers.com",
                "password_hash": new_hash, "is_active": True, "is_super_admin": True,
                "created_at": datetime.now(timezone.utc)
            }
            await db.admin_users.insert_one(new_admin)
            return {"success": True, "message": "Password changed successfully. Please use your new password to login."}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Change password error: {e}")
        raise HTTPException(status_code=500, detail="Failed to change password")


# ==================== GOOGLE OAUTH ENDPOINTS ====================

@router.post("/auth/google/session")
async def process_google_session(request: Request):
    """Process Google OAuth session_id and create user session."""
    try:
        body = await request.json()
        session_id = body.get("session_id")
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id is required")

        async with aiohttp.ClientSession() as session:
            async with session.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logging.error(f"Emergent Auth error: {error_text}")
                    raise HTTPException(status_code=401, detail="Invalid session")
                auth_data = await response.json()

        email = auth_data.get("email")
        name = auth_data.get("name")
        picture = auth_data.get("picture")
        session_token = auth_data.get("session_token")
        if not email or not session_token:
            raise HTTPException(status_code=400, detail="Invalid auth data received")

        existing_profile = await db.user_profiles.find_one({"email": email}, {"_id": 0})
        if existing_profile:
            user_id = existing_profile["id"]
            await db.user_profiles.update_one(
                {"id": user_id},
                {"$set": {"google_picture": picture, "updated_at": datetime.now(timezone.utc)}}
            )
        else:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            new_profile = {
                "id": user_id, "name": name or email.split("@")[0], "email": email,
                "phone": None, "avatar_emoji": "\U0001f60a", "google_picture": picture,
                "profile_photo_url": picture, "token_balance": 0, "total_visits": 0,
                "total_posts": 0, "total_photos": 0, "special_dates": [],
                "allow_gallery_posts": True, "birthdate": None, "anniversary": None,
                "role": "customer", "staff_title": None, "cashout_balance": 0.0,
                "total_earnings": 0.0, "instagram_handle": None, "facebook_handle": None,
                "twitter_handle": None, "tiktok_handle": None, "auth_provider": "google",
                "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
            }
            await db.user_profiles.insert_one(new_profile)

        session_expires = datetime.now(timezone.utc) + timedelta(days=7)
        await db.user_sessions.update_one(
            {"user_id": user_id},
            {"$set": {
                "user_id": user_id, "session_token": session_token,
                "expires_at": session_expires, "created_at": datetime.now(timezone.utc)
            }},
            upsert=True
        )

        user_profile_doc = await db.user_profiles.find_one({"id": user_id}, {"_id": 0})
        user_profile = {}
        for k, v in user_profile_doc.items():
            user_profile[k] = v.isoformat() if isinstance(v, datetime) else v

        response = JSONResponse(content={"success": True, "user": user_profile})
        response.set_cookie(
            key="session_token", value=session_token, httponly=True, secure=True,
            samesite="none", path="/", max_age=7 * 24 * 60 * 60
        )
        return response
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Google session processing error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process authentication")


@router.get("/auth/user/me")
async def get_current_google_user(request: Request):
    """Get current authenticated user info from session cookie or Authorization header."""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user_id = session_doc.get("user_id")
    user_profile_doc = await db.user_profiles.find_one({"id": user_id}, {"_id": 0})
    if not user_profile_doc:
        raise HTTPException(status_code=404, detail="User not found")

    user_profile = {}
    for k, v in user_profile_doc.items():
        user_profile[k] = v.isoformat() if isinstance(v, datetime) else v

    user_profile.setdefault("role", "customer")
    user_profile.setdefault("staff_title", None)
    user_profile.setdefault("cashout_balance", 0.0)
    user_profile.setdefault("total_earnings", 0.0)
    user_profile.setdefault("profile_photo_url", None)
    user_profile.setdefault("special_dates", [])
    user_profile.setdefault("token_balance", 0)
    user_profile.setdefault("total_visits", 0)
    user_profile.setdefault("total_posts", 0)
    user_profile.setdefault("total_photos", 0)
    user_profile.setdefault("allow_gallery_posts", True)
    return user_profile


@router.post("/auth/user/logout")
async def logout_user(request: Request):
    """Logout user and clear session"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response = JSONResponse(content={"success": True, "message": "Logged out"})
    response.delete_cookie(key="session_token", path="/")
    return response


# ==================== PASSWORD-BASED LOGIN ====================

@router.post("/user/register")
async def register_user_quick(request: Request):
    """Quick user registration from welcome popup with role"""
    try:
        body = await request.json()
        name = body.get("name", "").strip()
        phone = body.get("phone", "").strip()
        email = body.get("email", "").strip().lower()
        role = body.get("role", "customer")

        if not name:
            raise HTTPException(status_code=400, detail="Name is required")
        valid_roles = ["customer", "server", "bartender", "manager", "dj"]
        if role not in valid_roles:
            role = "customer"

        existing = None
        if email:
            existing = await db.user_profiles.find_one({"email": email}, {"_id": 0})
        if not existing and phone:
            existing = await db.user_profiles.find_one({"phone": phone}, {"_id": 0})

        if existing:
            await db.user_profiles.update_one(
                {"id": existing["id"]},
                {"$set": {"role": role, "name": name}}
            )
            return {"id": existing["id"], "message": "Profile updated", "role": role}

        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_profile = {
            "id": user_id, "name": name, "phone": phone or None,
            "email": email or None, "role": role, "avatar_emoji": "\U0001f60a",
            "token_balance": 0, "total_visits": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.user_profiles.insert_one(new_profile)
        return {"id": user_id, "message": "Profile created", "role": role}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Quick register error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/user/register")
async def register_user_with_password(request: Request):
    """Register a new user with username and password. Email and phone optional."""
    try:
        body = await request.json()
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")
        name = body.get("name", "").strip()
        username = body.get("username", "").strip().lower()
        phone = body.get("phone", "").strip()

        if not username:
            raise HTTPException(status_code=400, detail="Username is required")
        if len(username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
        if not re.match(r'^[a-z0-9_]+$', username):
            raise HTTPException(status_code=400, detail="Username can only contain letters, numbers, and underscores")
        if not password:
            raise HTTPException(status_code=400, detail="Password is required")
        if len(password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

        existing_username = await db.user_profiles.find_one({"username": username}, {"_id": 0})
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already taken")
        if email:
            existing_email = await db.user_profiles.find_one({"email": email}, {"_id": 0})
            if existing_email:
                raise HTTPException(status_code=400, detail="Email already registered")
        if phone:
            existing_phone = await db.user_profiles.find_one({"phone": phone}, {"_id": 0})
            if existing_phone:
                raise HTTPException(status_code=400, detail="Phone number already registered")

        password_hash = get_password_hash(password)
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_profile = {
            "id": user_id, "username": username, "name": name or username,
            "email": email or None, "password_hash": password_hash, "phone": phone or None,
            "avatar_emoji": "\U0001f60a", "google_picture": None,
            "profile_photo_url": None, "token_balance": 0, "total_visits": 0,
            "total_posts": 0, "total_photos": 0, "special_dates": [],
            "allow_gallery_posts": True, "birthdate": None, "anniversary": None,
            "role": "customer", "staff_title": None, "cashout_balance": 0.0,
            "total_earnings": 0.0, "instagram_handle": None, "facebook_handle": None,
            "twitter_handle": None, "tiktok_handle": None, "auth_provider": "email",
            "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
        }
        await db.user_profiles.insert_one(new_profile)

        session_token = str(uuid.uuid4())
        session_expires = datetime.now(timezone.utc) + timedelta(days=7)
        await db.user_sessions.insert_one({
            "user_id": user_id, "session_token": session_token,
            "expires_at": session_expires, "created_at": datetime.now(timezone.utc)
        })

        user_response = {}
        for k, v in new_profile.items():
            if k in ("password_hash", "_id"):
                continue
            user_response[k] = v.isoformat() if isinstance(v, datetime) else v

        response = JSONResponse(content={"success": True, "user": user_response})
        response.set_cookie(
            key="session_token", value=session_token, httponly=True, secure=True,
            samesite="none", path="/", max_age=7 * 24 * 60 * 60
        )
        return response
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/auth/user/login")
async def login_user_with_password(request: Request):
    """Login user with username, email, or phone and password."""
    try:
        body = await request.json()
        identifier = body.get("identifier", "").strip().lower()
        if not identifier:
            identifier = body.get("email", "").strip().lower()
        password = body.get("password", "")
        if not identifier or not password:
            raise HTTPException(status_code=400, detail="Username/email/phone and password are required")

        if "@" in identifier:
            user_profile = await db.user_profiles.find_one({"email": identifier})
        elif identifier.replace("+", "").replace("-", "").replace("(", "").replace(")", "").replace(" ", "").isdigit():
            user_profile = await db.user_profiles.find_one({"phone": {"$regex": identifier.replace("-", "").replace("(", "").replace(")", "").replace(" ", ""), "$options": "i"}})
        else:
            user_profile = await db.user_profiles.find_one({"username": identifier})
            if not user_profile:
                user_profile = await db.user_profiles.find_one({"email": identifier})

        if not user_profile:
            raise HTTPException(status_code=401, detail="Invalid username/email or password")

        password_hash = user_profile.get("password_hash")
        if not password_hash:
            auth_provider = user_profile.get("auth_provider")
            if auth_provider == "google":
                raise HTTPException(status_code=400, detail="This account uses Google login. Please sign in with Google.")
            else:
                raise HTTPException(status_code=400, detail="No password set for this account. Please sign up with email to set a password, or use Google login.")

        if not verify_password(password, password_hash):
            raise HTTPException(status_code=401, detail="Invalid username/email or password")

        user_id = user_profile["id"]
        session_token = str(uuid.uuid4())
        session_expires = datetime.now(timezone.utc) + timedelta(days=7)
        await db.user_sessions.update_one(
            {"user_id": user_id},
            {"$set": {
                "session_token": session_token,
                "expires_at": session_expires,
                "created_at": datetime.now(timezone.utc)
            }},
            upsert=True
        )

        user_response = {}
        for k, v in user_profile.items():
            if k in ("password_hash", "_id"):
                continue
            user_response[k] = v.isoformat() if isinstance(v, datetime) else v
        user_response.setdefault("role", "customer")
        user_response.setdefault("token_balance", 0)
        user_response.setdefault("username", None)

        response = JSONResponse(content={"success": True, "user": user_response})
        response.set_cookie(
            key="session_token", value=session_token, httponly=True, secure=True,
            samesite="none", path="/", max_age=7 * 24 * 60 * 60
        )
        return response
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")


# ==================== FORGOT PASSWORD ====================

@router.post("/auth/user/forgot-password")
async def forgot_password(request: Request):
    """Request a password reset."""
    try:
        body = await request.json()
        identifier = body.get("identifier", "").strip().lower()
        if not identifier:
            raise HTTPException(status_code=400, detail="Email or username is required")

        if "@" in identifier:
            user = await db.user_profiles.find_one({"email": identifier}, {"_id": 0})
        else:
            user = await db.user_profiles.find_one({"username": identifier}, {"_id": 0})
            if not user:
                user = await db.user_profiles.find_one({"email": identifier}, {"_id": 0})

        if not user:
            return {"success": True, "message": "If an account exists, a reset link has been sent"}
        if not user.get("password_hash"):
            return {"success": True, "message": "If an account exists, a reset link has been sent"}

        reset_token = str(uuid.uuid4())
        reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.password_resets.update_one(
            {"user_id": user["id"]},
            {"$set": {
                "user_id": user["id"], "token": reset_token,
                "expires_at": reset_expires, "created_at": datetime.now(timezone.utc), "used": False
            }},
            upsert=True
        )
        reset_url = f"/reset-password?token={reset_token}"
        return {
            "success": True,
            "message": "If an account exists, a reset link has been sent",
            "_debug_reset_url": reset_url,
            "_debug_token": reset_token
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Forgot password error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process request")


@router.post("/auth/user/reset-password")
async def reset_password(request: Request):
    """Reset password using a valid reset token."""
    try:
        body = await request.json()
        token = body.get("token", "").strip()
        new_password = body.get("password", "")
        if not token:
            raise HTTPException(status_code=400, detail="Reset token is required")
        if not new_password or len(new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

        reset_doc = await db.password_resets.find_one({"token": token}, {"_id": 0})
        if not reset_doc:
            raise HTTPException(status_code=400, detail="Invalid or expired reset link")

        expires_at = reset_doc.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Reset link has expired. Please request a new one.")
        if reset_doc.get("used"):
            raise HTTPException(status_code=400, detail="This reset link has already been used")

        user_id = reset_doc.get("user_id")
        user = await db.user_profiles.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=400, detail="User not found")

        new_password_hash = get_password_hash(new_password)
        await db.user_profiles.update_one(
            {"id": user_id},
            {"$set": {"password_hash": new_password_hash, "updated_at": datetime.now(timezone.utc)}}
        )
        await db.password_resets.update_one({"token": token}, {"$set": {"used": True}})
        await db.user_sessions.delete_many({"user_id": user_id})
        return {"success": True, "message": "Password has been reset successfully. Please log in with your new password."}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Reset password error: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset password")


@router.get("/auth/user/verify-reset-token")
async def verify_reset_token(token: str):
    """Verify if a reset token is valid."""
    try:
        if not token:
            return {"valid": False, "message": "Token is required"}
        reset_doc = await db.password_resets.find_one({"token": token}, {"_id": 0})
        if not reset_doc:
            return {"valid": False, "message": "Invalid reset link"}

        expires_at = reset_doc.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            return {"valid": False, "message": "Reset link has expired"}
        if reset_doc.get("used"):
            return {"valid": False, "message": "Reset link has already been used"}
        return {"valid": True, "message": "Token is valid"}
    except Exception as e:
        logging.error(f"Verify token error: {e}")
        return {"valid": False, "message": "Error verifying token"}
