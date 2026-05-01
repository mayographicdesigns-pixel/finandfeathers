"""Merchandise router — WooCommerce + local product listing, cart checkout."""
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel
from database import db, create_woocommerce_order, UPLOAD_DIR
from routes.auth import get_current_admin
from typing import List, Optional
from datetime import datetime, timezone
from pathlib import Path
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
    """Fetch products — tries Printful sync → WooCommerce → local DB fallback."""
    # 1. Try Printful sync products
    printful_token = os.environ.get("PRINTFUL_API_TOKEN")
    printful_store = os.environ.get("PRINTFUL_STORE_ID")
    if printful_token:
        try:
            headers = {"Authorization": f"Bearer {printful_token}"}
            if printful_store:
                headers["X-PF-Store-Id"] = printful_store
            async with aiohttp.ClientSession() as session:
                async with session.get("https://api.printful.com/sync/products?limit=100", headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        products = data.get("result", [])
                        if products:
                            simplified = []
                            for p in products:
                                simplified.append({
                                    "id": p.get("id"),
                                    "name": p.get("name"),
                                    "price": None,
                                    "description": "",
                                    "image": p.get("thumbnail_url", ""),
                                    "in_stock": True,
                                    "categories": [],
                                    "source": "printful"
                                })
                            # Fetch variant details for prices
                            for item in simplified[:20]:
                                try:
                                    async with session.get(f"https://api.printful.com/sync/products/{item['id']}", headers=headers, timeout=aiohttp.ClientTimeout(total=5)) as detail_resp:
                                        if detail_resp.status == 200:
                                            detail = await detail_resp.json()
                                            variants = detail.get("result", {}).get("sync_variants", [])
                                            if variants:
                                                item["price"] = variants[0].get("retail_price") or variants[0].get("price")
                                                item["variants"] = [{"name": v.get("name"), "price": v.get("retail_price") or v.get("price")} for v in variants]
                                except Exception:
                                    pass
                            if simplified:
                                return simplified
        except Exception as e:
            logging.error(f"Printful API error: {e}")

    # 2. Try local DB products
    local_products = await db.merchandise.find({"is_active": True}, {"_id": 0}).sort("display_order", 1).to_list(100)
    if local_products:
        return local_products

    # 3. Fall back to WooCommerce
    woo_url = os.environ.get("WOOCOMMERCE_URL")
    woo_key = os.environ.get("WOOCOMMERCE_KEY")
    woo_secret = os.environ.get("WOOCOMMERCE_SECRET")

    if not all([woo_url, woo_key, woo_secret]):
        return []

    api_url = f"{woo_url}/wp-json/wc/v3/products"
    params = {
        "consumer_key": woo_key,
        "consumer_secret": woo_secret,
        "per_page": 50,
        "status": "publish"
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(api_url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status != 200:
                    return []
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
    except Exception as e:
        logging.error(f"WooCommerce API error: {e}")
        return []


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


# ==================== LOCAL MERCHANDISE ADMIN ====================

@router.get("/admin/merchandise")
async def admin_get_merchandise(admin: str = Depends(get_current_admin)):
    """Get all local merchandise products for admin."""
    items = await db.merchandise.find({}, {"_id": 0}).sort("display_order", 1).to_list(200)
    return items


@router.post("/admin/merchandise")
async def admin_create_product(body: dict = None, admin: str = Depends(get_current_admin)):
    """Create a new local merchandise product."""
    body = body or {}
    product = {
        "id": str(uuid.uuid4()),
        "name": body.get("name") or "New Product",
        "price": body.get("price") if body.get("price") not in (None, "") else "0",
        "description": body.get("description") or "",
        "image": body.get("image") or "",
        "categories": body.get("categories") or [],
        "in_stock": body.get("in_stock", True),
        "is_active": body.get("is_active", True),
        "display_order": body.get("display_order", 999),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.merchandise.insert_one(product)
    product.pop("_id", None)
    return product


@router.put("/admin/merchandise/{product_id}")
async def admin_update_product(product_id: str, body: dict, admin: str = Depends(get_current_admin)):
    """Update a local merchandise product."""
    body.pop("_id", None)
    body.pop("id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.merchandise.update_one({"id": product_id}, {"$set": body})
    product = await db.merchandise.find_one({"id": product_id}, {"_id": 0})
    return product


@router.delete("/admin/merchandise/{product_id}")
async def admin_delete_product(product_id: str, admin: str = Depends(get_current_admin)):
    """Delete a local merchandise product."""
    await db.merchandise.delete_one({"id": product_id})
    return {"status": "deleted"}


@router.post("/admin/merchandise/upload-image")
async def admin_upload_product_image(file: UploadFile = File(...), admin: str = Depends(get_current_admin)):
    """Upload a product image."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 5MB")
    filename = f"merch_{uuid.uuid4().hex[:8]}_{file.filename}"
    filepath = UPLOAD_DIR / filename
    with open(filepath, "wb") as f:
        f.write(contents)
    return {"image_url": f"/api/uploads/{filename}"}
