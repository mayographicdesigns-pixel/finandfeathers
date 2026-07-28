"""Admin router — settings, stats, loyalty, contacts, people, notifications, gallery/social moderation, system cleanup."""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import Response
from database import db, get_current_admin, push_service
from models import (
    LoyaltyMember, LoyaltyMemberCreate, PushSubscription,
    PushNotification, PushNotificationCreate,
    ContactForm, ContactFormCreate, ContactFormUpdate
)
from typing import List
from datetime import datetime, timezone, timedelta
import csv
import io
import os
import uuid

router = APIRouter(prefix="/api")


# ==================== APP SETTINGS ====================

@router.get("/settings")
async def get_app_settings():
    """Get public app settings"""
    settings = await db.app_settings.find_one({"_id": "global"}, {"_id": 0})
    defaults = {
        "token_program_enabled": True,
        "loyalty_program_enabled": True,
        "buy_drink_enabled": True,
        "dj_live_banner_enabled": True,
        "karaoke_signup_banner_enabled": True,
        "song_request_banner_enabled": True,
        "marietta_coming_soon_enabled": True,
        "featured_events_enabled": True,
    }
    if not settings:
        return defaults
    return {**defaults, **settings}


@router.get("/admin/settings")
async def get_admin_settings(admin: str = Depends(get_current_admin)):
    """Get all app settings for admin"""
    settings = await db.app_settings.find_one({"_id": "global"})
    defaults = {
        "token_program_enabled": True,
        "loyalty_program_enabled": True,
        "buy_drink_enabled": True,
        "dj_live_banner_enabled": True,
        "karaoke_signup_banner_enabled": True,
        "song_request_banner_enabled": True,
        "marietta_coming_soon_enabled": True,
        "featured_events_enabled": True,
    }
    if not settings:
        settings = {"_id": "global", **defaults}
        await db.app_settings.insert_one(settings)
    result = {k: v for k, v in settings.items() if k != "_id"}
    return {**defaults, **result}


@router.put("/admin/settings")
async def update_admin_settings(settings: dict, admin: str = Depends(get_current_admin)):
    """Update app settings"""
    allowed_keys = [
        "token_program_enabled", "loyalty_program_enabled", "buy_drink_enabled",
        "dj_live_banner_enabled", "karaoke_signup_banner_enabled",
        "song_request_banner_enabled", "marietta_coming_soon_enabled",
        "featured_events_enabled",
    ]
    update_data = {k: v for k, v in settings.items() if k in allowed_keys}

    await db.app_settings.update_one(
        {"_id": "global"},
        {"$set": update_data},
        upsert=True
    )
    return {"message": "Settings updated successfully"}


# ==================== VAPID / PUSH ====================

@router.get("/push/public-key")
async def get_vapid_public_key():
    return {"publicKey": push_service.get_public_key()}


# ==================== LOYALTY ====================

@router.post("/loyalty/signup", response_model=LoyaltyMember)
async def signup_loyalty(member: LoyaltyMemberCreate):
    """Sign up for loyalty program"""
    existing = await db.loyalty_members.find_one({"email": member.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    member_dict = member.dict()
    loyalty_member = LoyaltyMember(**member_dict)
    await db.loyalty_members.insert_one(loyalty_member.dict())
    return loyalty_member


@router.post("/loyalty/subscribe-push/{member_id}")
async def subscribe_push(member_id: str, subscription: PushSubscription):
    """Subscribe to push notifications"""
    member = await db.loyalty_members.find_one({"id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    await db.loyalty_members.update_one(
        {"id": member_id},
        {"$set": {"push_subscription": subscription.dict()}}
    )
    return {"message": "Push subscription saved successfully"}


@router.get("/loyalty/members", response_model=List[LoyaltyMember])
async def get_loyalty_members():
    """Get all loyalty members"""
    members = await db.loyalty_members.find().to_list(1000)
    return [LoyaltyMember(**member) for member in members]


# ==================== NOTIFICATIONS ====================

@router.post("/notifications/send")
async def send_push_notification(notification: PushNotificationCreate):
    """Send push notification to subscribers"""
    notification_data = {
        "title": notification.title,
        "body": notification.body,
        "icon": notification.icon,
        "image": notification.image,
        "url": notification.url
    }

    if notification.send_to_all:
        result = await push_service.send_to_all_subscribers(notification_data)
    else:
        result = {"sent": 0, "failed": 0, "total_subscribers": 0}

    push_notif = PushNotification(
        **notification.dict(exclude={'send_to_all'}),
        sent_to=[]
    )
    await db.push_notifications.insert_one(push_notif.dict())

    return {
        "message": "Push notifications sent",
        "result": result
    }


@router.get("/notifications/history", response_model=List[PushNotification])
async def get_notification_history():
    """Get push notification history"""
    notifications = await db.push_notifications.find().sort("sent_at", -1).limit(50).to_list(50)
    return [PushNotification(**notif) for notif in notifications]


# ==================== CONTACT FORM ====================

@router.post("/contact", response_model=ContactForm)
async def submit_contact_form(form: ContactFormCreate):
    """Submit contact form"""
    contact = ContactForm(**form.dict())
    await db.contact_forms.insert_one(contact.dict())
    return contact


# ==================== ADMIN: LOYALTY ====================

@router.get("/admin/loyalty-members", response_model=List[LoyaltyMember])
async def admin_get_loyalty_members(username: str = Depends(get_current_admin)):
    """Get all loyalty members (protected)"""
    members = await db.loyalty_members.find({}, {"_id": 0}).to_list(1000)
    return [LoyaltyMember(**member) for member in members]


@router.delete("/admin/loyalty-members/{member_id}")
async def admin_delete_loyalty_member(member_id: str, username: str = Depends(get_current_admin)):
    """Delete a loyalty member"""
    result = await db.loyalty_members.delete_one({"id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"message": "Member deleted successfully"}


# ==================== ADMIN: CONTACTS ====================

@router.get("/admin/contacts")
async def admin_get_contacts(username: str = Depends(get_current_admin)):
    """Get all contact form submissions"""
    contacts = await db.contact_forms.find({"is_deleted": {"$ne": True}}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return contacts


@router.patch("/admin/contacts/{contact_id}")
async def admin_update_contact(contact_id: str, update: ContactFormUpdate, username: str = Depends(get_current_admin)):
    """Update contact form status"""
    result = await db.contact_forms.update_one(
        {"id": contact_id, "is_deleted": {"$ne": True}},
        {"$set": {"status": update.status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact updated successfully"}


@router.delete("/admin/contacts/{contact_id}")
async def admin_delete_contact(contact_id: str, username: str = Depends(get_current_admin)):
    """Soft delete a contact form"""
    result = await db.contact_forms.update_one(
        {"id": contact_id, "is_deleted": {"$ne": True}},
        {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact deleted successfully"}


# ==================== ADMIN: PEOPLE ====================

@router.get("/admin/people/export")
async def admin_export_people(username: str = Depends(get_current_admin)):
    """Export all contacts, loyalty members, and check-ins as CSV"""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Email", "Phone", "Source", "Status", "Location", "Message", "Date"])

    members = await db.loyalty_members.find({}, {"_id": 0}).to_list(5000)
    for m in members:
        writer.writerow([
            m.get("name", ""), m.get("email", ""), m.get("phone", ""),
            "Loyalty Signup", "active", "", "",
            m.get("created_at", m.get("joined_at", ""))
        ])

    contacts = await db.contact_forms.find({"is_deleted": {"$ne": True}}, {"_id": 0}).to_list(5000)
    for c in contacts:
        writer.writerow([
            c.get("name", ""), c.get("email", ""), c.get("phone", ""),
            "Contact Form", c.get("status", "new"), "", c.get("message", ""),
            c.get("created_at", "")
        ])

    checkins = await db.checkins.find({}, {"_id": 0}).sort("checked_in_at", -1).to_list(5000)
    for ci in checkins:
        writer.writerow([
            ci.get("display_name", ""), "", "",
            "Check-in", "active", ci.get("location_slug", ""),
            ci.get("message", ci.get("mood", "")), ci.get("checked_in_at", "")
        ])

    csv_content = output.getvalue()
    output.close()

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=fin_feathers_contacts.csv"}
    )


@router.get("/admin/people")
async def admin_get_people(username: str = Depends(get_current_admin)):
    """Get all people from loyalty, contacts, and check-ins combined"""
    people = []

    members = await db.loyalty_members.find({}, {"_id": 0}).to_list(5000)
    for m in members:
        people.append({
            "id": m.get("id", ""), "name": m.get("name", ""),
            "email": m.get("email", ""), "phone": m.get("phone", ""),
            "source": "loyalty", "status": "active", "location": "", "message": "",
            "date": str(m.get("created_at", m.get("joined_at", "")))
        })

    contacts = await db.contact_forms.find({"is_deleted": {"$ne": True}}, {"_id": 0}).to_list(5000)
    for c in contacts:
        people.append({
            "id": c.get("id", ""), "name": c.get("name", ""),
            "email": c.get("email", ""), "phone": c.get("phone", ""),
            "source": "contact", "status": c.get("status", "new"),
            "location": "", "message": c.get("message", ""),
            "date": str(c.get("created_at", ""))
        })

    checkins = await db.checkins.find({}, {"_id": 0}).sort("checked_in_at", -1).to_list(5000)
    for ci in checkins:
        people.append({
            "id": ci.get("id", ""), "name": ci.get("display_name", ""),
            "email": "", "phone": "",
            "source": "checkin", "status": "active",
            "location": ci.get("location_slug", ""),
            "message": ci.get("message", ci.get("mood", "")),
            "date": str(ci.get("checked_in_at", ""))
        })

    people.sort(key=lambda x: x.get("date", ""), reverse=True)
    return people


# ==================== ADMIN: NOTIFICATIONS ====================

@router.post("/admin/notifications/send")
async def admin_send_notification(notification: PushNotificationCreate, username: str = Depends(get_current_admin)):
    """Send push notification (protected)"""
    notification_data = {
        "title": notification.title,
        "body": notification.body,
        "icon": notification.icon,
        "image": notification.image,
        "url": notification.url
    }

    if notification.send_to_all:
        result = await push_service.send_to_all_subscribers(notification_data)
    else:
        result = {"sent": 0, "failed": 0, "total_subscribers": 0}

    push_notif = PushNotification(
        **notification.dict(exclude={'send_to_all'}),
        sent_to=[]
    )
    await db.push_notifications.insert_one(push_notif.dict())

    return {
        "message": "Push notifications sent",
        "result": result
    }


@router.get("/admin/notifications/history")
async def admin_get_notification_history(username: str = Depends(get_current_admin)):
    """Get push notification history (protected)"""
    notifications = await db.push_notifications.find({}, {"_id": 0}).sort("sent_at", -1).limit(50).to_list(50)
    return notifications


# ==================== ADMIN: STATS ====================

@router.get("/admin/stats")
async def admin_get_stats(username: str = Depends(get_current_admin)):
    """Get dashboard statistics"""
    loyalty_count = await db.loyalty_members.count_documents({})
    contacts_count = await db.contact_forms.count_documents({"is_deleted": {"$ne": True}})
    new_contacts_count = await db.contact_forms.count_documents({"status": "new", "is_deleted": {"$ne": True}})
    menu_items_count = await db.menu_items.count_documents({})
    notifications_count = await db.push_notifications.count_documents({})
    specials_count = await db.specials.count_documents({"is_active": True})

    return {
        "loyalty_members": loyalty_count,
        "total_contacts": contacts_count,
        "new_contacts": new_contacts_count,
        "menu_items": menu_items_count,
        "notifications_sent": notifications_count,
        "active_specials": specials_count
    }


# ==================== ADMIN: GALLERY SUBMISSIONS ====================

@router.get("/admin/gallery-submissions")
async def admin_get_gallery_submissions(username: str = Depends(get_current_admin)):
    """Get all user gallery submissions for admin moderation"""
    submissions = await db.user_gallery_submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return submissions


@router.delete("/admin/gallery-submissions/{submission_id}")
async def admin_delete_gallery_submission(submission_id: str, username: str = Depends(get_current_admin)):
    """Delete a user gallery submission and its corresponding gallery item"""
    result = await db.user_gallery_submissions.delete_one({"id": submission_id})
    await db.gallery_items.delete_one({"id": submission_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")

    return {"success": True, "message": "Submission deleted"}


# ==================== ADMIN: SOCIAL POSTS ====================

@router.get("/admin/social-posts")
async def admin_get_all_social_posts(username: str = Depends(get_current_admin)):
    """Get all social posts across all locations for admin moderation"""
    posts = await db.social_posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return posts


@router.delete("/admin/social-posts/{post_id}")
async def admin_delete_social_post(post_id: str, username: str = Depends(get_current_admin)):
    """Delete a social post (admin only)"""
    result = await db.social_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"success": True, "message": "Post deleted"}


@router.delete("/admin/social-posts/cleanup/old")
async def admin_cleanup_old_posts(username: str = Depends(get_current_admin)):
    """Manually trigger cleanup of old posts without images"""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)

    result = await db.social_posts.delete_many({
        "created_at": {"$lt": cutoff},
        "$or": [
            {"image_url": None},
            {"image_url": ""},
            {"image_url": {"$exists": False}}
        ]
    })

    return {
        "success": True,
        "deleted_count": result.deleted_count,
        "message": f"Deleted {result.deleted_count} old posts without images"
    }


# ==================== SYSTEM CLEANUP ====================

@router.post("/system/cleanup-old-posts")
async def system_cleanup_old_posts(api_key: str = None):
    """System endpoint to clean up old posts without images. Called by scheduler at 4am EST daily."""
    system_key = os.environ.get("SYSTEM_API_KEY", "ff-system-cleanup-2026")
    if api_key != system_key:
        raise HTTPException(status_code=401, detail="Invalid API key")

    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)

    result = await db.social_posts.delete_many({
        "created_at": {"$lt": cutoff},
        "$or": [
            {"image_url": None},
            {"image_url": ""},
            {"image_url": {"$exists": False}}
        ]
    })

    return {
        "success": True,
        "deleted_count": result.deleted_count,
        "cleanup_time": datetime.now(timezone.utc).isoformat()
    }



# ==================== EMERGENCY BROADCAST ====================

@router.post("/admin/wall/emergency-broadcast")
async def admin_emergency_broadcast(body: dict, username: str = Depends(get_current_admin)):
    """Admin-only fan-out post: drops one wall_posts entry into every active
    non-hibachi location, tagged as an emergency broadcast. Uses the same
    broadcast_id linkage as DJ broadcasts."""
    content = (body.get("content") or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message content is required")
    if len(content) > 500:
        raise HTTPException(status_code=400, detail="Message is too long (max 500 chars)")

    author_name = (body.get("author_name") or "Fin & Feathers Management").strip()
    active_locs = await db.locations.find(
        {"is_active": True, "slug": {"$ne": "hibachi-food-truck"}},
        {"_id": 0, "slug": 1}
    ).to_list(length=50)
    if not active_locs:
        raise HTTPException(status_code=404, detail="No active locations to broadcast to")

    broadcast_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    inserted = []
    for loc in active_locs:
        slug = loc.get("slug")
        if not slug:
            continue
        post = {
            "id": str(uuid.uuid4()),
            "location_slug": slug,
            "user_id": f"admin-{username}",
            "user_name": author_name,
            "user_avatar": "📣",
            "user_photo": "",
            "post_type": "text",
            "content": content,
            "image_url": None,
            "likes": [],
            "comments": [],
            "broadcast_id": broadcast_id,
            "is_broadcast": True,
            "is_emergency": True,
            "created_at": now
        }
        await db.wall_posts.insert_one(post)
        post.pop("_id", None)
        inserted.append(post)

    return {"broadcast_id": broadcast_id, "count": len(inserted), "emergency": True}
