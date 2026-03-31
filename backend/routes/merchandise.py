"""Merchandise router — WooCommerce product listing, cart checkout."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db, create_woocommerce_order
from typing import List, Optional
from datetime import datetime, timezone
import aiohttp
import os
import logging
import uuid

router = APIRouter(prefix="/api")


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


# ==================== MERCHANDISE ====================

@router.get("/merchandise")
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

                simplified = []
                for p in products:
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


@router.get("/merchandise/{product_id}")
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


# ==================== CART CHECKOUT ====================

@router.post("/cart/checkout")
async def cart_checkout(checkout: CartCheckoutRequest, origin_url: str = None):
    """Create WooCommerce order for cart items"""
    if not checkout.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

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

    line_items = []
    for item in checkout.items:
        line_items.append({
            "product_id": item.product_id,
            "quantity": item.quantity
        })

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


@router.get("/cart/order/{order_id}")
async def get_cart_order_status(order_id: str):
    """Get cart order status"""
    cart_order = await db.cart_orders.find_one({"id": order_id}, {"_id": 0})
    if not cart_order:
        raise HTTPException(status_code=404, detail="Order not found")

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
