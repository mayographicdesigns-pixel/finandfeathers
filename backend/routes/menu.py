"""Menu router — public menu, admin menu CRUD, category styles, bulk operations, file uploads."""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Request
from database import (
    db, get_current_admin, UPLOAD_DIR,
    ALLOWED_EXTENSIONS, ALLOWED_VIDEO_EXTENSIONS, MAX_FILE_SIZE, MAX_VIDEO_SIZE,
    download_image_to_uploads
)
from models import MenuItemCreate, MenuItemUpdate
from pathlib import Path
from datetime import datetime, timezone
import base64
import uuid

router = APIRouter(prefix="/api")


# ==================== FORCE MENU SEED ====================

@router.post("/admin/menu/force-seed")
async def force_seed_menu(admin: str = Depends(get_current_admin)):
    """Force re-seed all menu items from seed_menu.json. Clears existing items first."""
    from database import _get_all_location_slugs, _seed_full_menu
    slugs = await _get_all_location_slugs()
    await _seed_full_menu(slugs)
    count = await db.menu_items.count_documents({})
    cats = await db.menu_items.distinct("category")
    return {"message": f"Seeded {count} menu items across {len(cats)} categories"}


# ==================== PUBLIC MENU ====================

@router.get("/menu/items")
async def get_public_menu_items(location_slug: str = None):
    """Get menu items for public display, optionally filtered by location.
    When location_slug is provided, returns location-specific items first,
    falling back to global items (no slug) for items not overridden per-location.
    """
    if location_slug:
        # Get location-specific items
        loc_items = await db.menu_items.find(
            {"location_slug": location_slug}, {"_id": 0}
        ).to_list(2000)

        if loc_items:
            return loc_items

        # No location-specific items — return global items
        global_items = await db.menu_items.find(
            {"$or": [{"location_slug": None}, {"location_slug": {"$exists": False}}]},
            {"_id": 0}
        ).to_list(2000)
        return global_items

    items = await db.menu_items.find({}, {"_id": 0}).to_list(2000)
    return items


@router.get("/menu/categories")
async def get_menu_categories(location_slug: str = None):
    """Get unique menu categories, optionally filtered by location"""
    if location_slug:
        pipeline = [
            {"$match": {"location_slug": location_slug}},
            {"$group": {"_id": "$category"}},
            {"$sort": {"_id": 1}}
        ]
        results = await db.menu_items.aggregate(pipeline).to_list(100)
        return [r["_id"] for r in results]
    categories = await db.menu_items.distinct("category")
    return categories


# ==================== MENU CATEGORY DISPLAY SETTINGS ====================

@router.get("/menu-category-styles")
async def get_menu_category_styles():
    """Get display style settings for each menu category"""
    settings = await db.menu_settings.find_one({"type": "category_styles"}, {"_id": 0})
    if settings:
        return settings.get("styles", {})
    return {}


@router.get("/admin/menu-category-styles")
async def admin_get_menu_category_styles(username: str = Depends(get_current_admin)):
    """Admin: Get display style settings for each menu category"""
    settings = await db.menu_settings.find_one({"type": "category_styles"}, {"_id": 0})
    if settings:
        return settings.get("styles", {})
    return {}


@router.put("/admin/menu-category-styles")
async def admin_update_menu_category_styles(request: Request, username: str = Depends(get_current_admin)):
    """Admin: Update display style for menu categories"""
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Expected a dictionary of category styles")

    await db.menu_settings.update_one(
        {"type": "category_styles"},
        {
            "$set": {
                "type": "category_styles",
                "styles": body,
                "updated_at": datetime.now(timezone.utc)
            },
            "$setOnInsert": {"created_at": datetime.now(timezone.utc)}
        },
        upsert=True
    )
    return {"success": True, "styles": body}


# ==================== ADMIN MENU ITEMS CRUD ====================

@router.get("/admin/menu-items")
async def admin_get_menu_items(location_slug: str = None, username: str = Depends(get_current_admin)):
    """Get menu items for admin, optionally filtered by location.
    Falls back to global items if no location-specific items exist.
    """
    if location_slug:
        loc_items = await db.menu_items.find(
            {"location_slug": location_slug}, {"_id": 0}
        ).to_list(2000)

        if loc_items:
            return loc_items

        # Fallback: return global items (no location_slug)
        global_items = await db.menu_items.find(
            {"$or": [{"location_slug": None}, {"location_slug": {"$exists": False}}]},
            {"_id": 0}
        ).to_list(2000)
        return global_items

    items = await db.menu_items.find({}, {"_id": 0}).to_list(2000)
    return items


@router.post("/admin/menu-items")
async def admin_create_menu_item(item: MenuItemCreate, username: str = Depends(get_current_admin)):
    """Create a new menu item"""
    item_dict = item.dict()
    item_dict["id"] = str(uuid.uuid4())
    await db.menu_items.insert_one(item_dict)
    item_dict.pop("_id", None)
    return {**item_dict}


@router.put("/admin/menu-items/{item_id}")
async def admin_update_menu_item(item_id: str, update: MenuItemUpdate, username: str = Depends(get_current_admin)):
    """Update a menu item. Optionally sync changes to all locations with the same item name."""
    update_dict = {k: v for k, v in update.dict().items() if v is not None}

    sync_all = update_dict.pop("sync_all_locations", None)

    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")

    original = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    if not original:
        raise HTTPException(status_code=404, detail="Menu item not found")

    await db.menu_items.update_one(
        {"id": item_id},
        {"$set": update_dict}
    )

    synced_count = 0
    if sync_all and original.get("name"):
        sync_fields = {k: v for k, v in update_dict.items() if k not in ("location_slug", "id")}
        if sync_fields:
            sync_result = await db.menu_items.update_many(
                {"name": original["name"], "id": {"$ne": item_id}},
                {"$set": sync_fields}
            )
            synced_count = sync_result.modified_count
    else:
        image_changed = "image" in update_dict or "image_url" in update_dict
        if image_changed:
            new_image = update_dict.get("image") or update_dict.get("image_url")
            if new_image and original.get("name"):
                sync_result = await db.menu_items.update_many(
                    {"name": original["name"], "id": {"$ne": item_id}},
                    {"$set": {"image": new_image, "image_url": new_image}}
                )
                synced_count = sync_result.modified_count

    return {
        "message": "Menu item updated successfully",
        "synced_locations": synced_count
    }


@router.delete("/admin/menu-items/{item_id}")
async def admin_delete_menu_item(item_id: str, username: str = Depends(get_current_admin)):
    """Delete a menu item"""
    result = await db.menu_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"message": "Menu item deleted successfully"}


# ==================== BULK MENU OPERATIONS ====================

@router.post("/admin/menu-items/bulk-update-images")
async def admin_bulk_update_menu_images(request: Request, username: str = Depends(get_current_admin)):
    """Bulk update menu item images by category or individual items"""
    updates = await request.json()
    updated_count = 0
    for update in updates:
        if "category" in update and "image_url" in update:
            result = await db.menu_items.update_many(
                {"category": update["category"]},
                {"$set": {"image_url": update["image_url"]}}
            )
            updated_count += result.modified_count
        elif "id" in update and "image_url" in update:
            result = await db.menu_items.update_one(
                {"id": update["id"]},
                {"$set": {"image_url": update["image_url"]}}
            )
            updated_count += result.modified_count
        elif "name" in update and "image_url" in update:
            result = await db.menu_items.update_one(
                {"name": {"$regex": update["name"], "$options": "i"}},
                {"$set": {"image_url": update["image_url"]}}
            )
            updated_count += result.modified_count
    return {"message": f"Updated {updated_count} menu items"}


@router.post("/admin/menu-items/copy-to-locations")
async def admin_copy_menu_to_locations(username: str = Depends(get_current_admin)):
    """Copy all menu items without a location_slug to every location (except hibachi-food-truck)"""
    locations = await db.locations.find(
        {"slug": {"$ne": "hibachi-food-truck"}},
        {"_id": 0, "slug": 1}
    ).to_list(50)
    location_slugs = [loc["slug"] for loc in locations]

    source_items = await db.menu_items.find(
        {"$or": [{"location_slug": None}, {"location_slug": {"$exists": False}}]},
        {"_id": 0}
    ).to_list(2000)

    if not source_items:
        return {"message": "No source menu items found", "created": 0}

    created = 0
    for slug in location_slugs:
        existing = await db.menu_items.count_documents({"location_slug": slug})
        if existing > 0:
            continue

        new_items = []
        for item in source_items:
            new_item = {**item}
            new_item["id"] = str(uuid.uuid4())
            new_item["location_slug"] = slug
            new_items.append(new_item)

        if new_items:
            await db.menu_items.insert_many(new_items)
            created += len(new_items)

    return {"message": f"Copied menu to {len(location_slugs)} locations", "created": created}


@router.post("/admin/menu-items/sync-images-to-locations")
async def admin_sync_images_to_locations(username: str = Depends(get_current_admin)):
    """Sync images from the master menu (no location_slug) to all location copies by item name."""
    master_items = await db.menu_items.find(
        {"$or": [{"location_slug": None}, {"location_slug": {"$exists": False}}]},
        {"_id": 0}
    ).to_list(2000)

    if not master_items:
        return {"message": "No master menu items found", "synced": 0}

    synced = 0
    for item in master_items:
        image = item.get("image") or item.get("image_url")
        if not image:
            continue
        result = await db.menu_items.update_many(
            {"name": item["name"], "location_slug": {"$ne": None, "$exists": True}},
            {"$set": {"image": image, "image_url": image}}
        )
        synced += result.modified_count

    return {"message": f"Synced images for {len(master_items)} master items", "synced": synced}


@router.post("/admin/menu-items/convert-external-images")
async def admin_convert_external_images(username: str = Depends(get_current_admin)):
    """Download ALL external/old images and store them in local /api/media/ storage."""
    all_items = await db.menu_items.find({}, {"_id": 0, "id": 1, "name": 1, "image": 1, "image_url": 1}).to_list(5000)

    url_to_ids = {}
    for item in all_items:
        img = item.get("image") or item.get("image_url") or ""
        if not img or img.startswith("/api/media/"):
            continue
        if img.startswith("http") or img.startswith("/api/uploads/"):
            if img not in url_to_ids:
                url_to_ids[img] = []
            url_to_ids[img].append(item["id"])

    converted = 0
    failed = 0
    for url, item_ids in url_to_ids.items():
        try:
            stored_url = await download_image_to_uploads(url)
            if stored_url:
                await db.menu_items.update_many(
                    {"id": {"$in": item_ids}},
                    {"$set": {"image": stored_url, "image_url": stored_url}}
                )
                converted += len(item_ids)
        except Exception:
            failed += 1

    return {"message": f"Converted {converted} images, {failed} failed", "converted": converted, "failed": failed}


@router.post("/admin/menu-items/store-images")
async def admin_store_menu_images(request: Request, username: str = Depends(get_current_admin)):
    """Download external menu item images and store them locally"""
    body = await request.json() if request else {}
    categories = body.get("categories") if isinstance(body, dict) else None

    query = {}
    if categories:
        query["category"] = {"$in": categories}

    items = await db.menu_items.find(query, {"_id": 0}).to_list(1000)
    updated = 0
    skipped = 0

    for item in items:
        image_url = item.get("image") or item.get("image_url")
        if not image_url or not isinstance(image_url, str):
            skipped += 1
            continue
        if image_url.startswith("/api/uploads/"):
            skipped += 1
            continue
        if not image_url.startswith("http"):
            skipped += 1
            continue

        stored_url = await download_image_to_uploads(image_url)
        if stored_url:
            await db.menu_items.update_one(
                {"id": item["id"]},
                {"$set": {"image": stored_url, "image_url": stored_url}}
            )
            updated += 1

    return {"updated": updated, "skipped": skipped}


# ==================== FILE UPLOADS ====================

@router.post("/admin/upload")
async def admin_upload_file(
    file: UploadFile = File(...),
    username: str = Depends(get_current_admin)
):
    """Upload an image file - stores in MongoDB for production persistence"""
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    file_id = str(uuid.uuid4())
    unique_filename = f"{file_id}{file_ext}"

    try:
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")

        base64_data = base64.b64encode(contents).decode('utf-8')
        content_type = file.content_type or f"image/{file_ext[1:]}"

        await db.media_files.insert_one({
            "file_id": file_id,
            "filename": unique_filename,
            "data": base64_data,
            "content_type": content_type,
            "size": len(contents),
            "uploaded_at": datetime.now(timezone.utc),
            "uploaded_by": username
        })

        try:
            file_path = UPLOAD_DIR / unique_filename
            with open(file_path, "wb") as f:
                f.write(contents)
        except Exception:
            pass

        return {
            "filename": unique_filename,
            "url": f"/api/media/{file_id}",
            "legacy_url": f"/api/uploads/{unique_filename}",
            "size": len(contents)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")


@router.post("/admin/upload/video")
async def admin_upload_video(
    file: UploadFile = File(...),
    username: str = Depends(get_current_admin)
):
    """Upload a video file for promo carousel - stores in MongoDB for production"""
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Video type not allowed. Allowed types: {', '.join(ALLOWED_VIDEO_EXTENSIONS)}"
        )

    file_id = str(uuid.uuid4())
    unique_filename = f"{file_id}{file_ext}"

    try:
        contents = await file.read()
        if len(contents) > MAX_VIDEO_SIZE:
            raise HTTPException(status_code=400, detail="Video too large. Maximum size is 50MB")

        base64_data = base64.b64encode(contents).decode('utf-8')
        content_type = file.content_type or f"video/{file_ext[1:]}"

        await db.media_files.insert_one({
            "file_id": file_id,
            "filename": unique_filename,
            "data": base64_data,
            "content_type": content_type,
            "size": len(contents),
            "type": "video",
            "uploaded_at": datetime.now(timezone.utc),
            "uploaded_by": username
        })

        try:
            file_path = UPLOAD_DIR / unique_filename
            with open(file_path, "wb") as f:
                f.write(contents)
        except Exception:
            pass

        return {
            "filename": unique_filename,
            "url": f"/api/media/{file_id}",
            "legacy_url": f"/api/uploads/{unique_filename}",
            "size": len(contents)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save video: {str(e)}")


@router.get("/admin/uploads")
async def admin_list_uploads(username: str = Depends(get_current_admin)):
    """List all uploaded files from both local and MongoDB"""
    files = []

    db_files = await db.media_files.find({}, {"_id": 0, "data": 0}).to_list(500)
    for f in db_files:
        files.append({
            "filename": f.get("filename", ""),
            "url": f"/api/media/{f.get('file_id', '')}",
            "size": f.get("size", 0),
            "source": "mongodb"
        })

    try:
        for f in UPLOAD_DIR.iterdir():
            if f.is_file() and f.suffix.lower() in ALLOWED_EXTENSIONS:
                if not any(file.get("filename") == f.name for file in files):
                    files.append({
                        "filename": f.name,
                        "url": f"/api/uploads/{f.name}",
                        "size": f.stat().st_size,
                        "source": "local"
                    })
    except Exception:
        pass

    return files


@router.delete("/admin/uploads/{filename}")
async def admin_delete_upload(filename: str, username: str = Depends(get_current_admin)):
    """Delete an uploaded file from both local and MongoDB"""
    deleted = False

    file_id = filename.rsplit('.', 1)[0] if '.' in filename else filename
    result = await db.media_files.delete_one({"$or": [{"file_id": file_id}, {"filename": filename}]})
    if result.deleted_count > 0:
        deleted = True

    try:
        file_path = UPLOAD_DIR / filename
        if file_path.exists():
            file_path.unlink()
            deleted = True
    except Exception:
        pass

    if not deleted:
        raise HTTPException(status_code=404, detail="File not found")

    return {"message": "File deleted successfully"}
