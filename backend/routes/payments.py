"""Payments router — Stripe checkout, webhooks, payment methods."""
from fastapi import APIRouter, HTTPException, Request, Body
from database import db
from routes.events import EVENT_PACKAGES, fetch_event_by_id
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest
)
from datetime import datetime, timezone
import uuid
import os
import logging

router = APIRouter(prefix="/api")


# ==================== STRIPE CHECKOUT ====================

@router.post("/stripe/tokens/checkout")
async def create_stripe_token_checkout(request: Request, package_id: str, user_id: str, origin_url: str):
    """Create Stripe checkout session for token purchase"""
    # Import TOKEN_PACKAGES from server (still there) — kept inline for clarity
    TOKEN_PACKAGES = {
        "10": {"amount": 1.00, "tokens": 10, "name": "10 F&F Tokens"},
        "50": {"amount": 5.00, "tokens": 50, "name": "50 F&F Tokens"},
        "100": {"amount": 10.00, "tokens": 100, "name": "100 F&F Tokens"},
        "250": {"amount": 25.00, "tokens": 250, "name": "250 F&F Tokens"},
        "500": {"amount": 50.00, "tokens": 500, "name": "500 F&F Tokens"},
    }
    if package_id not in TOKEN_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")
    profile = await db.user_profiles.find_one({"id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    package = TOKEN_PACKAGES[package_id]
    amount = float(package["amount"])
    tokens = package["tokens"]
    name = package["name"]

    transaction_id = str(uuid.uuid4())
    transaction = {
        "id": transaction_id, "type": "token_purchase", "payment_provider": "stripe",
        "user_id": user_id, "amount": amount, "currency": "usd", "tokens": tokens,
        "package_id": package_id, "payment_status": "pending", "stripe_session_id": None,
        "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
    }
    await db.payment_transactions.insert_one(transaction)

    try:
        stripe_api_key = os.environ.get("STRIPE_API_KEY")
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)

        success_url = f"{origin_url}/account?payment=success&session_id={{CHECKOUT_SESSION_ID}}&transaction_id={transaction_id}"
        cancel_url = f"{origin_url}/account?payment=cancelled"

        checkout_request = CheckoutSessionRequest(
            amount=amount, currency="usd", success_url=success_url, cancel_url=cancel_url,
            metadata={
                "transaction_id": transaction_id, "user_id": user_id,
                "tokens": str(tokens), "type": "token_purchase", "package_name": name
            }
        )
        session = await stripe_checkout.create_checkout_session(checkout_request)
        await db.payment_transactions.update_one(
            {"id": transaction_id},
            {"$set": {"stripe_session_id": session.session_id, "updated_at": datetime.now(timezone.utc)}}
        )
        return {"checkout_url": session.url, "session_id": session.session_id, "transaction_id": transaction_id}
    except Exception as e:
        logging.error(f"Stripe checkout error: {e}")
        await db.payment_transactions.delete_one({"id": transaction_id})
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@router.post("/stripe/events/checkout")
async def create_stripe_event_checkout(
    request: Request, package_id: str, quantity: int = 1, user_id: str = None,
    origin_url: str = None, event_id: str = None, customer_email: str = None
):
    """Create Stripe checkout session for event tickets"""
    if not event_id:
        raise HTTPException(status_code=400, detail="event_id is required")
    if package_id not in EVENT_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid event package")

    event = await fetch_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    quantity = max(1, quantity)
    package_prices = event.get("package_prices") or {}
    package_amount = float(package_prices.get(package_id, EVENT_PACKAGES[package_id]["amount"]))
    if package_amount <= 0:
        raise HTTPException(status_code=400, detail="Free package should use the free reservation endpoint")

    amount = package_amount * quantity
    name = EVENT_PACKAGES[package_id]["name"]
    event_name = event.get("name", "Event")

    transaction_id = str(uuid.uuid4())
    transaction = {
        "id": transaction_id, "type": "event_ticket", "payment_provider": "stripe",
        "user_id": user_id, "event_id": event_id, "event_name": event_name,
        "amount": amount, "currency": "usd", "package_id": package_id,
        "package_price": package_amount, "quantity": quantity,
        "customer_email": customer_email, "payment_status": "pending",
        "stripe_session_id": None,
        "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
    }
    await db.payment_transactions.insert_one(transaction)

    try:
        stripe_api_key = os.environ.get("STRIPE_API_KEY")
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)

        success_url = f"{origin_url}/?payment=success&session_id={{CHECKOUT_SESSION_ID}}&transaction_id={transaction_id}&type=event"
        cancel_url = f"{origin_url}/?payment=cancelled"

        checkout_request = CheckoutSessionRequest(
            amount=amount, currency="usd", success_url=success_url, cancel_url=cancel_url,
            metadata={
                "transaction_id": transaction_id, "user_id": user_id or "guest",
                "type": "event_ticket", "package_id": package_id,
                "quantity": str(quantity), "package_name": name,
                "event_id": event_id, "event_name": event_name,
                "customer_email": customer_email or ""
            }
        )
        session = await stripe_checkout.create_checkout_session(checkout_request)
        await db.payment_transactions.update_one(
            {"id": transaction_id},
            {"$set": {"stripe_session_id": session.session_id, "updated_at": datetime.now(timezone.utc)}}
        )
        return {"checkout_url": session.url, "session_id": session.session_id, "transaction_id": transaction_id}
    except Exception as e:
        logging.error(f"Stripe event checkout error: {e}")
        await db.payment_transactions.delete_one({"id": transaction_id})
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@router.post("/stripe/merch/checkout")
async def create_stripe_merch_checkout(
    request: Request,
    items: list = Body(..., embed=False),
    customer_email: str = None,
    origin_url: str = None,
):
    """Create Stripe checkout session for merchandise purchase. Body is raw JSON list of cart items."""
    if not items:
        raise HTTPException(status_code=400, detail="No items in cart")

    total = 0.0
    item_details = []
    for item in items:
        item_total = float(item.get("price", 0)) * int(item.get("quantity", 1))
        total += item_total
        item_details.append({
            "name": item.get("name"), "price": item.get("price"),
            "quantity": item.get("quantity", 1), "product_id": item.get("product_id")
        })
    if total <= 0:
        raise HTTPException(status_code=400, detail="Invalid cart total")

    order_id = str(uuid.uuid4())
    order = {
        "id": order_id, "type": "merchandise", "payment_provider": "stripe",
        "items": item_details, "total": total, "currency": "usd",
        "customer_email": customer_email, "payment_status": "pending",
        "stripe_session_id": None,
        "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
    }
    await db.payment_transactions.insert_one(order)

    try:
        stripe_api_key = os.environ.get("STRIPE_API_KEY")
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)

        success_url = f"{origin_url}/merch?payment=success&session_id={{CHECKOUT_SESSION_ID}}&order_id={order_id}"
        cancel_url = f"{origin_url}/merch?payment=cancelled"

        checkout_request = CheckoutSessionRequest(
            amount=total, currency="usd", success_url=success_url, cancel_url=cancel_url,
            metadata={
                "order_id": order_id, "type": "merchandise",
                "customer_email": customer_email or "guest",
                "item_count": str(len(item_details))
            }
        )
        session = await stripe_checkout.create_checkout_session(checkout_request)
        await db.payment_transactions.update_one(
            {"id": order_id},
            {"$set": {"stripe_session_id": session.session_id, "updated_at": datetime.now(timezone.utc)}}
        )
        return {"checkout_url": session.url, "session_id": session.session_id, "order_id": order_id, "total": total}
    except Exception as e:
        logging.error(f"Stripe merch checkout error: {e}")
        await db.payment_transactions.delete_one({"id": order_id})
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@router.get("/stripe/checkout/status/{session_id}")
async def get_stripe_checkout_status(request: Request, session_id: str):
    """Get the status of a Stripe checkout session"""
    transaction = await db.payment_transactions.find_one({"stripe_session_id": session_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if transaction.get("payment_status") == "paid":
        return {
            "status": "complete", "payment_status": "paid",
            "transaction_id": transaction.get("id"), "type": transaction.get("type")
        }

    try:
        stripe_api_key = os.environ.get("STRIPE_API_KEY")
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        status_response = await stripe_checkout.get_checkout_status(session_id)

        if status_response.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"stripe_session_id": session_id},
                {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc)}}
            )
            if transaction.get("type") == "token_purchase":
                user_id = transaction.get("user_id")
                tokens = transaction.get("tokens", 0)
                if user_id and tokens > 0:
                    existing = await db.token_credits.find_one({
                        "transaction_id": transaction.get("id"), "credited": True
                    })
                    if not existing:
                        await db.user_profiles.update_one(
                            {"id": user_id}, {"$inc": {"ff_tokens": tokens}}
                        )
                        await db.token_credits.insert_one({
                            "transaction_id": transaction.get("id"), "user_id": user_id,
                            "tokens": tokens, "credited": True,
                            "created_at": datetime.now(timezone.utc)
                        })
            return {
                "status": "complete", "payment_status": "paid",
                "transaction_id": transaction.get("id"), "type": transaction.get("type")
            }
        elif status_response.status == "expired":
            await db.payment_transactions.update_one(
                {"stripe_session_id": session_id},
                {"$set": {"payment_status": "expired", "updated_at": datetime.now(timezone.utc)}}
            )
            return {"status": "expired", "payment_status": "expired", "transaction_id": transaction.get("id")}
        else:
            return {"status": "pending", "payment_status": "pending", "transaction_id": transaction.get("id")}
    except Exception as e:
        logging.error(f"Error checking Stripe status: {e}")
        return {"status": "pending", "payment_status": "pending", "transaction_id": transaction.get("id")}


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        stripe_api_key = os.environ.get("STRIPE_API_KEY")
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        webhook_response = await stripe_checkout.handle_webhook(body, signature)

        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            metadata = webhook_response.metadata
            await db.payment_transactions.update_one(
                {"stripe_session_id": session_id},
                {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc)}}
            )
            if metadata.get("type") == "token_purchase":
                user_id = metadata.get("user_id")
                tokens = int(metadata.get("tokens", 0))
                transaction_id = metadata.get("transaction_id")
                if user_id and tokens > 0 and transaction_id:
                    existing = await db.token_credits.find_one({
                        "transaction_id": transaction_id, "credited": True
                    })
                    if not existing:
                        await db.user_profiles.update_one(
                            {"id": user_id}, {"$inc": {"ff_tokens": tokens}}
                        )
                        await db.token_credits.insert_one({
                            "transaction_id": transaction_id, "user_id": user_id,
                            "tokens": tokens, "credited": True,
                            "created_at": datetime.now(timezone.utc)
                        })
            if metadata.get("type") == "dj_tip":
                transaction_id = metadata.get("transaction_id")
                if transaction_id:
                    txn = await db.payment_transactions.find_one({"id": transaction_id}, {"_id": 0})
                    if txn and txn.get("payment_status") != "paid":
                        await db.dj_tips.insert_one({
                            "id": str(uuid.uuid4()), "type": "dj_tip",
                            "location_slug": txn.get("location_slug"),
                            "dj_id": txn.get("dj_id"), "dj_name": txn.get("dj_name"),
                            "tipper_name": txn.get("tipper_name", "Anonymous"),
                            "amount": txn.get("amount", 0), "payment_method": "stripe",
                            "song_request_id": txn.get("song_request_id"),
                            "payment_status": "completed", "stripe_session_id": session_id,
                            "created_at": datetime.now(timezone.utc)
                        })
        return {"status": "received"}
    except Exception as e:
        logging.error(f"Stripe webhook error: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/payment/methods")
async def get_payment_methods():
    """Get available payment methods"""
    return {
        "methods": [
            {
                "id": "stripe", "name": "Credit/Debit Card (Stripe)",
                "description": "Pay securely with your card",
                "icon": "credit-card", "enabled": True
            },
            {
                "id": "woocommerce", "name": "WooCommerce",
                "description": "Pay via WooCommerce checkout",
                "icon": "shopping-cart", "enabled": True
            }
        ]
    }
