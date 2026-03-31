"""User router — profiles, tokens, transfers, cashout, staff, history, gallery submissions."""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Request
from database import db, get_current_admin, create_woocommerce_order
from models import (
    UserProfileCreate, UserProfileUpdate, UserProfileResponse,
    TokenPurchaseCreate, TokenGiftCreate,
    TokenTransferCreate,
    CashoutRequestCreate,
    RoleUpdate,
    UserGallerySubmissionCreate, UserGallerySubmissionResponse
)
from pathlib import Path
from datetime import datetime, timezone
import aiohttp
import base64
import uuid
import os
import logging

router = APIRouter(prefix="/api")

# Fixed token packages
TOKEN_PACKAGES = {
    "10": {"amount": 1.00, "tokens": 10, "name": "10 F&F Tokens"},
    "50": {"amount": 5.00, "tokens": 50, "name": "50 F&F Tokens"},
    "100": {"amount": 10.00, "tokens": 100, "name": "100 F&F Tokens"},
    "250": {"amount": 25.00, "tokens": 250, "name": "250 F&F Tokens"},
    "500": {"amount": 50.00, "tokens": 500, "name": "500 F&F Tokens"},
}


# ==================== USER PROFILES ====================

@router.post("/user/profile", response_model=UserProfileResponse)
async def create_user_profile(profile: UserProfileCreate):
    """Create a new user profile"""
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
    profile_dict["role"] = "customer"
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


def _apply_profile_defaults(profile: dict) -> dict:
    """Add default values for missing fields (backwards compatibility)"""
    defaults = {
        "role": "customer", "staff_title": None,
        "cashout_balance": 0.0, "total_earnings": 0.0,
        "profile_photo_url": None, "special_dates": [],
        "token_balance": 0, "total_visits": 0,
        "total_posts": 0, "total_photos": 0,
        "allow_gallery_posts": True, "google_picture": None,
        "username": None, "auth_provider": None,
        "birthdate": None, "anniversary": None,
        "instagram_handle": None, "facebook_handle": None,
        "twitter_handle": None, "tiktok_handle": None,
    }
    for key, default in defaults.items():
        profile.setdefault(key, default)
    profile.setdefault("updated_at", profile.get("created_at"))
    return profile


@router.get("/user/profile/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(user_id: str):
    """Get a user profile by ID"""
    profile = await db.user_profiles.find_one({"id": user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return UserProfileResponse(**_apply_profile_defaults(profile))


@router.get("/user/profile/by-email/{email}")
async def get_user_profile_by_email(email: str):
    """Get a user profile by email"""
    profile = await db.user_profiles.find_one({"email": email.lower()}, {"_id": 0})
    if not profile:
        profile = await db.user_profiles.find_one(
            {"email": {"$regex": f"^{email}$", "$options": "i"}}, {"_id": 0}
        )
    if not profile:
        return None
    return UserProfileResponse(**_apply_profile_defaults(profile))


@router.put("/user/profile/{user_id}", response_model=UserProfileResponse)
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


@router.post("/user/profile/{user_id}/photo")
async def upload_profile_photo(user_id: str, file: UploadFile = File(...)):
    """Upload a profile photo/selfie - stores in MongoDB for production"""
    profile = await db.user_profiles.find_one({"id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: JPG, PNG, GIF, WebP")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB")

    file_id = f"profile_{user_id}_{uuid.uuid4().hex[:8]}"
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{file_id}.{ext}"

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

    try:
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)
        file_path = upload_dir / filename
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception:
        pass

    photo_url = f"/api/media/{file_id}"
    await db.user_profiles.update_one(
        {"id": user_id},
        {"$set": {"profile_photo_url": photo_url, "updated_at": datetime.now(timezone.utc)}}
    )

    return {"url": photo_url, "filename": filename}


# ==================== F&F TOKENS ====================

@router.get("/tokens/packages")
async def get_token_packages():
    """Get available token packages for purchase"""
    return TOKEN_PACKAGES


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

    await db.payment_transactions.update_one(
        {"id": transaction_id},
        {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc)}}
    )


@router.post("/tokens/checkout")
async def create_token_checkout(request: Request, package_id: str, user_id: str, origin_url: str):
    """Create WooCommerce order for token purchase"""
    if package_id not in TOKEN_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")

    profile = await db.user_profiles.find_one({"id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    package = TOKEN_PACKAGES[package_id]
    amount = package["amount"]
    tokens = package["tokens"]
    name = package["name"]

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

    line_items = [{"name": name, "quantity": 1, "total": str(amount)}]

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
        await db.payment_transactions.delete_one({"id": transaction_id})
        raise


@router.get("/tokens/checkout/status/{transaction_id}")
async def get_checkout_status(transaction_id: str):
    """Get the status of a token checkout"""
    transaction = await db.payment_transactions.find_one({"id": transaction_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if transaction.get("payment_status") == "paid":
        return {
            "status": "complete",
            "payment_status": "paid",
            "tokens_credited": transaction.get("tokens", 0),
            "already_processed": True
        }

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

                if order_status in ["completed", "processing"]:
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


@router.post("/webhook/woocommerce")
async def woocommerce_webhook(request: Request):
    """Handle WooCommerce webhook for order status updates"""
    try:
        body = await request.json()

        order_id = body.get("id")
        order_status = body.get("status")

        if not order_id:
            return {"status": "ok", "message": "No order ID"}

        transaction = await db.payment_transactions.find_one({"woo_order_id": order_id})

        if not transaction:
            cart_order = await db.cart_orders.find_one({"woo_order_id": order_id})
            if cart_order and order_status in ["completed", "processing"]:
                await db.cart_orders.update_one(
                    {"woo_order_id": order_id},
                    {"$set": {"status": "paid", "updated_at": datetime.now(timezone.utc)}}
                )
            return {"status": "ok"}

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


@router.post("/user/tokens/purchase/{user_id}")
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


@router.get("/user/tokens/balance/{user_id}")
async def get_token_balance(user_id: str):
    """Get user's F&F token balance"""
    profile = await db.user_profiles.find_one({"id": user_id}, {"_id": 0, "token_balance": 1, "id": 1})
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return {"user_id": user_id, "token_balance": profile.get("token_balance", 0)}


@router.get("/user/tokens/history/{user_id}")
async def get_token_history(user_id: str):
    """Get user's token purchase/gift history"""
    history = await db.token_purchases.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return history


@router.post("/user/tokens/spend/{user_id}")
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


# ==================== ADMIN TOKEN MANAGEMENT ====================

@router.post("/admin/tokens/gift")
async def admin_gift_tokens(gift: TokenGiftCreate, username: str = Depends(get_current_admin)):
    """Admin: Gift F&F tokens to a user"""
    profile = await db.user_profiles.find_one({"id": gift.user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    if gift.tokens < 1:
        raise HTTPException(status_code=400, detail="Must gift at least 1 token")

    gift_record = {
        "id": str(uuid.uuid4()),
        "user_id": gift.user_id,
        "amount_usd": gift.tokens / 10,
        "tokens_purchased": gift.tokens,
        "payment_method": "gift",
        "gifted_by": username,
        "message": gift.message,
        "created_at": datetime.now(timezone.utc)
    }
    await db.token_purchases.insert_one(gift_record)

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


@router.get("/admin/users")
async def admin_get_users(username: str = Depends(get_current_admin)):
    """Get all user profiles (admin only)"""
    users = await db.user_profiles.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return users


@router.post("/admin/users/role")
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


@router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, username: str = Depends(get_current_admin)):
    """Delete a user and all their associated data"""
    profile = await db.user_profiles.find_one({"id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    if profile.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete admin users")

    await db.user_profiles.delete_one({"id": user_id})
    await db.checkins.delete_many({"$or": [{"user_id": user_id}, {"id": user_id}]})
    await db.social_posts.delete_many({"author_id": user_id})
    await db.direct_messages.delete_many({"$or": [{"from_id": user_id}, {"to_id": user_id}]})
    await db.dj_tips.delete_many({"from_id": user_id})
    await db.drink_orders.delete_many({"$or": [{"from_id": user_id}, {"to_id": user_id}]})
    await db.token_purchases.delete_many({"user_id": user_id})
    await db.user_gallery_submissions.delete_many({"user_id": user_id})

    return {"success": True, "message": f"User {profile.get('name', 'Unknown')} and all their data deleted"}


# ==================== TOKEN TRANSFERS ====================

@router.post("/user/tokens/transfer/{from_user_id}")
async def transfer_tokens(from_user_id: str, transfer: TokenTransferCreate):
    """Transfer tokens from one user to another (tips, drinks, gifts)"""
    sender = await db.user_profiles.find_one({"id": from_user_id})
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")

    receiver = await db.user_profiles.find_one({"id": transfer.to_user_id})
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")

    sender_balance = sender.get("token_balance", 0)
    if sender_balance < transfer.amount:
        raise HTTPException(status_code=400, detail="Insufficient token balance")

    if transfer.amount < 1:
        raise HTTPException(status_code=400, detail="Must transfer at least 1 token")

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

    new_sender_balance = sender_balance - transfer.amount
    await db.user_profiles.update_one(
        {"id": from_user_id},
        {"$set": {"token_balance": new_sender_balance, "updated_at": datetime.now(timezone.utc)}}
    )

    receiver_role = receiver.get("role", "customer")
    if receiver_role == "staff" and transfer.transfer_type == "tip":
        tip_usd_value = transfer.amount / 10
        new_cashout = receiver.get("cashout_balance", 0) + tip_usd_value
        await db.user_profiles.update_one(
            {"id": transfer.to_user_id},
            {"$set": {"cashout_balance": new_cashout, "updated_at": datetime.now(timezone.utc)}}
        )
    else:
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


@router.get("/user/tokens/transfers/{user_id}")
async def get_user_transfers(user_id: str):
    """Get user's token transfer history (sent and received)"""
    transfers = await db.token_transfers.find(
        {"$or": [{"from_user_id": user_id}, {"to_user_id": user_id}]},
        {"_id": 0}
    ).sort("created_at", -1).limit(100).to_list(100)
    return transfers


# ==================== STAFF CASHOUT ====================

@router.post("/staff/cashout/{user_id}")
async def request_cashout(user_id: str, cashout: CashoutRequestCreate):
    """Staff: Request to cash out accumulated tips (min $20, 80% rate)"""
    user = await db.user_profiles.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("role") != "staff":
        raise HTTPException(status_code=403, detail="Only staff can request cashouts")

    cashout_balance = user.get("cashout_balance", 0)

    if cashout_balance < 20:
        raise HTTPException(status_code=400, detail=f"Minimum cashout is $20. Current balance: ${cashout_balance:.2f}")

    tokens_to_cashout = cashout.amount_tokens
    usd_value = tokens_to_cashout / 10

    if usd_value > cashout_balance:
        raise HTTPException(status_code=400, detail=f"Requested amount exceeds balance. Max: ${cashout_balance:.2f}")

    payout_amount = usd_value * 0.8

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


@router.get("/staff/cashout/history/{user_id}")
async def get_cashout_history(user_id: str):
    """Get staff's cashout request history"""
    history = await db.cashout_requests.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return history


@router.post("/staff/transfer-to-personal/{user_id}")
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

    tokens_to_add = int(amount * 10)

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


@router.get("/admin/cashouts")
async def admin_get_cashouts(username: str = Depends(get_current_admin)):
    """Get all pending cashout requests (admin only)"""
    requests = await db.cashout_requests.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return requests


@router.put("/admin/cashouts/{cashout_id}")
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


@router.get("/staff/list")
async def get_staff_list():
    """Get list of all staff members (for customers to tip)"""
    staff = await db.user_profiles.find(
        {"role": "staff"},
        {"_id": 0, "id": 1, "name": 1, "staff_title": 1, "avatar_emoji": 1, "profile_photo_url": 1}
    ).to_list(100)
    return staff


# ==================== USER HISTORY ====================

@router.get("/user/history/visits/{user_id}")
async def get_user_visits(user_id: str):
    """Get user's check-in/visit history"""
    visits = await db.user_visits.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("checked_in_at", -1).limit(50).to_list(50)
    return visits


@router.get("/user/history/posts/{user_id}")
async def get_user_posts(user_id: str):
    """Get user's social wall post history"""
    posts = await db.social_posts.find(
        {"author_user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return posts


@router.get("/user/history/drinks/{user_id}")
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


@router.get("/user/history/tips/{user_id}")
async def get_user_tip_history(user_id: str):
    """Get user's DJ tip history"""
    tips = await db.dj_tips.find(
        {"tipper_user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return tips


# ==================== USER GALLERY SUBMISSIONS ====================

@router.post("/user/gallery/submit/{user_id}", response_model=UserGallerySubmissionResponse)
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

    gallery_item = {
        "id": str(uuid.uuid4()),
        "title": submission.caption or f"Photo by {profile.get('name', 'Guest')}",
        "image_url": submission.image_url,
        "category": "community",
        "is_active": True,
        "display_order": 999,
        "submitted_by_user": user_id,
        "created_at": datetime.now(timezone.utc)
    }
    await db.gallery_items.insert_one(gallery_item)

    await db.user_profiles.update_one(
        {"id": user_id},
        {"$inc": {"total_photos": 1}, "$set": {"updated_at": datetime.now(timezone.utc)}}
    )

    submission_dict.pop("_id", None)
    return UserGallerySubmissionResponse(**submission_dict)


@router.get("/user/gallery/submissions/{user_id}")
async def get_user_submissions(user_id: str):
    """Get user's gallery submissions"""
    submissions = await db.user_gallery_submissions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return submissions
