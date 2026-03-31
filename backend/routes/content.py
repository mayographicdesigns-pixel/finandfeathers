"""Content router — homepage, page content, daily specials, weekly videos, specials, social links, Instagram."""
from fastapi import APIRouter, HTTPException, Depends, Request
from database import db, get_current_admin, push_service
from models import (
    HomepageContentUpdate, PageContentUpdate, DailySpecialUpdate,
    SpecialCreate, SpecialUpdate,
    SocialLinkCreate, SocialLinkUpdate,
    InstagramPostCreate, InstagramPostUpdate,
    PushNotification
)
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api")


# ==================== HOMEPAGE CONTENT ====================

@router.get("/homepage/content")
async def get_homepage_content():
    """Get homepage content for public display"""
    content = await db.homepage_content.find_one({"id": "homepage"}, {"_id": 0})
    if not content:
        return {
            "id": "homepage",
            "tagline": "Elevated dining meets Southern soul",
            "logo_url": "https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png",
            "contact_phone": "(404) 855-5524",
            "contact_email": "info@finandfeathersrestaurants.com",
            "contact_address": "Multiple Locations across Georgia & Las Vegas",
            "social_feed_images": [
                {"url": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6608.jpg", "caption": "F&F Signature Wings"},
                {"url": "https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Shrimp-Grits-scaled.jpg", "caption": "Shrimp & Grits"},
                {"url": "https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Malibu-Ribeye-scaled.jpg", "caption": "Malibu Ribeye"},
                {"url": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/a3e08521f140462cbedf10dedd32f879.jpeg", "caption": "Chicken & Waffle"}
            ]
        }
    return content


@router.put("/admin/homepage/content")
async def update_homepage_content(update: HomepageContentUpdate, username: str = Depends(get_current_admin)):
    """Update homepage content (admin only)"""
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_dict["updated_at"] = datetime.now(timezone.utc)

    await db.homepage_content.update_one(
        {"id": "homepage"},
        {"$set": update_dict},
        upsert=True
    )

    return {"message": "Homepage content updated"}


@router.get("/admin/homepage/content")
async def admin_get_homepage_content(username: str = Depends(get_current_admin)):
    """Get homepage content (admin)"""
    content = await db.homepage_content.find_one({"id": "homepage"}, {"_id": 0})
    if not content:
        return {
            "id": "homepage",
            "tagline": "Elevated dining meets Southern soul",
            "logo_url": "https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png",
            "contact_phone": "(404) 855-5524",
            "contact_email": "info@finandfeathersrestaurants.com",
            "contact_address": "Multiple Locations across Georgia & Las Vegas",
            "social_feed_images": [
                {"url": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6608.jpg", "caption": "F&F Signature Wings"},
                {"url": "https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Shrimp-Grits-scaled.jpg", "caption": "Shrimp & Grits"},
                {"url": "https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Malibu-Ribeye-scaled.jpg", "caption": "Malibu Ribeye"},
                {"url": "https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/a3e08521f140462cbedf10dedd32f879.jpeg", "caption": "Chicken & Waffle"}
            ]
        }
    return content


# ==================== PAGE CONTENT ====================

@router.get("/page-content/{page_key}")
async def get_page_content(page_key: str):
    content = await db.page_content.find({"page_key": page_key}, {"_id": 0}).to_list(100)
    return content


@router.put("/admin/page-content/{page_key}/{section_key}")
async def update_page_content(page_key: str, section_key: str, update: PageContentUpdate, username: str = Depends(get_current_admin)):
    update_doc = {
        "page_key": page_key,
        "section_key": section_key,
        "html": update.html,
        "updated_at": datetime.now(timezone.utc)
    }
    await db.page_content.update_one(
        {"page_key": page_key, "section_key": section_key},
        {"$set": update_doc, "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    return {"success": True}


# ==================== DAILY SPECIALS ====================

@router.get("/daily-specials")
async def get_daily_specials():
    specials = await db.daily_specials.find({}, {"_id": 0}).to_list(20)
    return specials


@router.get("/admin/daily-specials")
async def admin_get_daily_specials(username: str = Depends(get_current_admin)):
    specials = await db.daily_specials.find({}, {"_id": 0}).to_list(20)
    return specials


@router.put("/admin/daily-specials")
async def admin_update_daily_specials(request: Request, username: str = Depends(get_current_admin)):
    body = await request.json()
    if not isinstance(body, list):
        raise HTTPException(status_code=400, detail="Expected a list of daily specials")

    updated = 0
    for item in body:
        try:
            update = DailySpecialUpdate(**item)
        except Exception:
            continue
        update_doc = {
            "day_index": update.day_index,
            "name": update.name,
            "description": update.description,
            "hours": update.hours,
            "emoji": update.emoji,
            "specials": item.get("specials", []),
            "updated_at": datetime.now(timezone.utc)
        }
        await db.daily_specials.update_one(
            {"day_index": update.day_index},
            {"$set": update_doc, "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc)}},
            upsert=True
        )
        updated += 1

    return {"updated": updated}


# ==================== WEEKLY VIDEOS ====================

@router.get("/weekly-videos")
async def get_weekly_videos():
    videos = await db.weekly_videos.find({}, {"_id": 0}).sort("day_index", 1).to_list(7)
    return videos


@router.get("/admin/weekly-videos")
async def admin_get_weekly_videos(username: str = Depends(get_current_admin)):
    videos = await db.weekly_videos.find({}, {"_id": 0}).sort("day_index", 1).to_list(7)
    return videos


@router.put("/admin/weekly-videos")
async def admin_update_weekly_videos(request: Request, username: str = Depends(get_current_admin)):
    body = await request.json()
    if not isinstance(body, list):
        raise HTTPException(status_code=400, detail="Expected a list of weekly video entries")

    updated = 0
    for item in body:
        day_index = item.get("day_index")
        if day_index is None or not isinstance(day_index, int) or day_index < 0 or day_index > 6:
            continue
        video_urls = item.get("video_urls", [])
        if not isinstance(video_urls, list):
            continue

        await db.weekly_videos.update_one(
            {"day_index": day_index},
            {"$set": {
                "day_index": day_index,
                "video_urls": video_urls,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }, "$setOnInsert": {
                "id": str(uuid.uuid4()),
                "created_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        updated += 1

    return {"updated": updated}


# ==================== SPECIALS (PROMOTIONS) ====================

@router.get("/specials")
async def get_public_specials():
    """Get all active specials for public display"""
    now = datetime.now(timezone.utc)
    specials = await db.specials.find(
        {
            "is_active": True,
            "$or": [
                {"valid_until": None},
                {"valid_until": {"$gte": now}}
            ]
        },
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return specials


@router.get("/admin/specials")
async def admin_get_specials(username: str = Depends(get_current_admin)):
    """Get all specials (including inactive)"""
    specials = await db.specials.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return specials


@router.post("/admin/specials")
async def admin_create_special(special: SpecialCreate, username: str = Depends(get_current_admin)):
    """Create a new special and optionally send push notification"""
    special_dict = special.dict()
    special_dict["id"] = str(uuid.uuid4())
    special_dict["is_active"] = True
    special_dict["created_at"] = datetime.now(timezone.utc)
    special_dict["notification_sent"] = False
    special_dict["notification_sent_at"] = None

    send_notification = special_dict.pop("send_notification", True)

    await db.specials.insert_one(special_dict)

    notification_result = None

    if send_notification:
        notification_data = {
            "title": f"🎉 {special.title}",
            "body": special.description[:100] + ("..." if len(special.description) > 100 else ""),
            "icon": "/logo192.png",
            "image": special.image,
            "url": "/"
        }

        notification_result = await push_service.send_to_all_subscribers(notification_data)

        await db.specials.update_one(
            {"id": special_dict["id"]},
            {"$set": {"notification_sent": True, "notification_sent_at": datetime.now(timezone.utc)}}
        )
        special_dict["notification_sent"] = True
        special_dict["notification_sent_at"] = datetime.now(timezone.utc)

        push_notif = PushNotification(
            title=notification_data["title"],
            body=notification_data["body"],
            icon=notification_data["icon"],
            image=notification_data.get("image"),
            url=notification_data["url"],
            sent_to=[]
        )
        await db.push_notifications.insert_one(push_notif.dict())

    special_dict.pop("_id", None)

    return {
        "special": special_dict,
        "notification_result": notification_result
    }


@router.put("/admin/specials/{special_id}")
async def admin_update_special(special_id: str, update: SpecialUpdate, username: str = Depends(get_current_admin)):
    """Update a special"""
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.specials.update_one(
        {"id": special_id},
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Special not found")
    return {"message": "Special updated successfully"}


@router.delete("/admin/specials/{special_id}")
async def admin_delete_special(special_id: str, username: str = Depends(get_current_admin)):
    """Delete a special"""
    result = await db.specials.delete_one({"id": special_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Special not found")
    return {"message": "Special deleted successfully"}


@router.post("/admin/specials/{special_id}/notify")
async def admin_resend_special_notification(special_id: str, username: str = Depends(get_current_admin)):
    """Resend push notification for a special"""
    special = await db.specials.find_one({"id": special_id}, {"_id": 0})
    if not special:
        raise HTTPException(status_code=404, detail="Special not found")

    notification_data = {
        "title": f"🎉 {special['title']}",
        "body": special['description'][:100] + ("..." if len(special['description']) > 100 else ""),
        "icon": "/logo192.png",
        "image": special.get("image"),
        "url": "/"
    }

    result = await push_service.send_to_all_subscribers(notification_data)

    await db.specials.update_one(
        {"id": special_id},
        {"$set": {"notification_sent": True, "notification_sent_at": datetime.now(timezone.utc)}}
    )

    return {
        "message": "Notification sent",
        "result": result
    }


# ==================== SOCIAL LINKS ====================

@router.get("/social-links")
async def get_public_social_links():
    """Get all active social links"""
    links = await db.social_links.find(
        {"is_active": True},
        {"_id": 0}
    ).sort("display_order", 1).to_list(100)
    return links


@router.get("/admin/social-links")
async def admin_get_social_links(username: str = Depends(get_current_admin)):
    """Get all social links"""
    links = await db.social_links.find({}, {"_id": 0}).sort("display_order", 1).to_list(100)
    return links


@router.post("/admin/social-links")
async def admin_create_social_link(link: SocialLinkCreate, username: str = Depends(get_current_admin)):
    """Create a new social link"""
    link_dict = link.dict()
    link_dict["id"] = str(uuid.uuid4())
    link_dict["is_active"] = True
    link_dict["created_at"] = datetime.now(timezone.utc)
    await db.social_links.insert_one(link_dict)
    link_dict.pop("_id", None)
    return link_dict


@router.put("/admin/social-links/{link_id}")
async def admin_update_social_link(link_id: str, update: SocialLinkUpdate, username: str = Depends(get_current_admin)):
    """Update a social link"""
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.social_links.update_one({"id": link_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Social link not found")
    return {"message": "Social link updated"}


@router.delete("/admin/social-links/{link_id}")
async def admin_delete_social_link(link_id: str, username: str = Depends(get_current_admin)):
    """Delete a social link"""
    result = await db.social_links.delete_one({"id": link_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Social link not found")
    return {"message": "Social link deleted"}


# ==================== INSTAGRAM FEED ====================

@router.get("/instagram-feed")
async def get_public_instagram_feed():
    """Get Instagram posts for public display"""
    posts = await db.instagram_posts.find(
        {"is_active": True},
        {"_id": 0}
    ).sort("display_order", 1).to_list(20)
    return posts


@router.get("/admin/instagram-posts")
async def admin_get_instagram_posts(username: str = Depends(get_current_admin)):
    """Get all Instagram posts"""
    posts = await db.instagram_posts.find({}, {"_id": 0}).sort("display_order", 1).to_list(100)
    return posts


@router.post("/admin/instagram-posts")
async def admin_create_instagram_post(post: InstagramPostCreate, username: str = Depends(get_current_admin)):
    """Add an Instagram post to the feed"""
    post_dict = post.dict()
    post_dict["id"] = str(uuid.uuid4())
    post_dict["is_active"] = True
    post_dict["created_at"] = datetime.now(timezone.utc)
    await db.instagram_posts.insert_one(post_dict)
    post_dict.pop("_id", None)
    return post_dict


@router.put("/admin/instagram-posts/{post_id}")
async def admin_update_instagram_post(post_id: str, update: InstagramPostUpdate, username: str = Depends(get_current_admin)):
    """Update an Instagram post"""
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.instagram_posts.update_one({"id": post_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Instagram post not found")
    return {"message": "Instagram post updated"}


@router.delete("/admin/instagram-posts/{post_id}")
async def admin_delete_instagram_post(post_id: str, username: str = Depends(get_current_admin)):
    """Delete an Instagram post"""
    result = await db.instagram_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Instagram post not found")
    return {"message": "Instagram post deleted"}
