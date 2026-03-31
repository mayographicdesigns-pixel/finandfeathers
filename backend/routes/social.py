"""Social router — check-in, social wall posts, DMs, gallery."""
from fastapi import APIRouter, HTTPException, Depends
from database import db, get_current_admin
from models import (
    CheckIn, CheckInCreate, CheckInResponse,
    SocialPost, SocialPostCreate, SocialPostResponse,
    DirectMessage, DirectMessageCreate, DirectMessageResponse,
    GalleryItemCreate, GalleryItemUpdate
)
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid

router = APIRouter(prefix="/api")


# ==================== LOCATION CHECK-IN ====================

@router.post("/checkin", response_model=CheckInResponse)
async def check_in(checkin_data: CheckInCreate):
    """Check in at a location"""
    expires_at = datetime.now(timezone.utc) + timedelta(hours=4)

    if checkin_data.user_profile_id:
        await db.checkins.delete_many({
            "user_profile_id": checkin_data.user_profile_id,
            "location_slug": checkin_data.location_slug
        })

    checkin = CheckIn(
        id=str(uuid.uuid4()),
        location_slug=checkin_data.location_slug,
        display_name=checkin_data.display_name,
        avatar_emoji=checkin_data.avatar_emoji,
        mood=checkin_data.mood,
        message=checkin_data.message,
        selfie_url=checkin_data.selfie_url,
        checked_in_at=datetime.now(timezone.utc),
        expires_at=expires_at
    )

    checkin_dict = checkin.model_dump()
    checkin_dict["user_profile_id"] = checkin_data.user_profile_id
    await db.checkins.insert_one(checkin_dict)

    return CheckInResponse(
        id=checkin.id,
        location_slug=checkin.location_slug,
        display_name=checkin.display_name,
        avatar_emoji=checkin.avatar_emoji,
        mood=checkin.mood,
        message=checkin.message,
        selfie_url=checkin.selfie_url,
        checked_in_at=checkin.checked_in_at,
        user_profile_id=checkin_data.user_profile_id
    )


@router.get("/checkin/{location_slug}", response_model=List[CheckInResponse])
async def get_checked_in_users(location_slug: str):
    """Get all users currently checked in at a location, including the live DJ"""
    await db.checkins.delete_many({
        "expires_at": {"$lt": datetime.now(timezone.utc)}
    })

    checkins = await db.checkins.find(
        {"location_slug": location_slug},
        {"_id": 0}
    ).sort("checked_in_at", -1).to_list(100)

    live_dj = await db.dj_profiles.find_one(
        {"current_location": location_slug, "is_active": True},
        {"_id": 0}
    )
    if live_dj:
        dj_checkin_id = f"dj-{live_dj.get('id', '')}"
        existing_ids = {c.get("id") for c in checkins}
        existing_profile_ids = {c.get("user_profile_id") for c in checkins}
        if dj_checkin_id not in existing_ids and live_dj.get("id") not in existing_profile_ids:
            checkins.insert(0, {
                "id": dj_checkin_id,
                "location_slug": location_slug,
                "display_name": f"DJ {live_dj.get('stage_name') or live_dj.get('name', 'Unknown')}",
                "avatar_emoji": live_dj.get("avatar_emoji", "🎧"),
                "mood": "🎵 Live DJ",
                "message": "",
                "user_profile_id": live_dj.get("id", ""),
                "checked_in_at": live_dj.get("checked_in_at", datetime.now(timezone.utc).isoformat()),
                "expires_at": (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat()
            })

    return [CheckInResponse(**c) for c in checkins]


@router.delete("/checkin/{checkin_id}")
async def check_out(checkin_id: str):
    """Check out from a location"""
    result = await db.checkins.delete_one({"id": checkin_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Check-in not found")
    return {"message": "Checked out successfully"}


@router.get("/checkin/count/{location_slug}")
async def get_checkin_count(location_slug: str):
    """Get the count of people checked in at a location"""
    await db.checkins.delete_many({
        "expires_at": {"$lt": datetime.now(timezone.utc)}
    })

    count = await db.checkins.count_documents({"location_slug": location_slug})
    return {"location_slug": location_slug, "count": count}


# ==================== GALLERY ====================

@router.get("/gallery")
async def get_public_gallery(location_slug: str = None):
    """Get all active gallery items for public display"""
    query = {"is_active": True}
    if location_slug:
        query["location_slug"] = location_slug
    items = await db.gallery_items.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return items


@router.get("/admin/gallery")
async def admin_get_gallery(username: str = Depends(get_current_admin)):
    """Get all gallery items (including inactive)"""
    items = await db.gallery_items.find({}, {"_id": 0}).sort("display_order", 1).to_list(100)
    return items


@router.post("/admin/gallery")
async def admin_create_gallery_item(item: GalleryItemCreate, username: str = Depends(get_current_admin)):
    """Add a new gallery item"""
    item_dict = item.dict()
    item_dict["id"] = str(uuid.uuid4())
    item_dict["is_active"] = True
    item_dict["created_at"] = datetime.now(timezone.utc)
    await db.gallery_items.insert_one(item_dict)
    item_dict.pop("_id", None)
    return item_dict


@router.put("/admin/gallery/{item_id}")
async def admin_update_gallery_item(item_id: str, update: GalleryItemUpdate, username: str = Depends(get_current_admin)):
    """Update a gallery item"""
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.gallery_items.update_one({"id": item_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    return {"message": "Gallery item updated"}


@router.delete("/admin/gallery/{item_id}")
async def admin_delete_gallery_item(item_id: str, username: str = Depends(get_current_admin)):
    """Delete a gallery item"""
    result = await db.gallery_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    return {"message": "Gallery item deleted"}


# ==================== SOCIAL WALL POSTS ====================

@router.post("/social/posts", response_model=SocialPostResponse)
async def create_social_post(post: SocialPostCreate):
    """Create a post on the social wall for a location"""
    checkin = await db.checkins.find_one({"id": post.checkin_id})
    if not checkin:
        raise HTTPException(status_code=400, detail="You must be checked in to post")

    post_dict = post.dict()
    post_dict["id"] = str(uuid.uuid4())
    post_dict["likes"] = []
    post_dict["created_at"] = datetime.now(timezone.utc)
    post_dict["author_selfie"] = checkin.get("selfie_url") or post.author_selfie

    await db.social_posts.insert_one(post_dict)

    return SocialPostResponse(
        id=post_dict["id"],
        location_slug=post_dict["location_slug"],
        checkin_id=post_dict["checkin_id"],
        author_name=post_dict["author_name"],
        author_emoji=post_dict["author_emoji"],
        author_selfie=post_dict.get("author_selfie"),
        message=post_dict["message"],
        image_url=post_dict.get("image_url"),
        likes_count=0,
        liked_by_me=False,
        created_at=post_dict["created_at"]
    )


@router.get("/social/posts/{location_slug}")
async def get_social_posts(location_slug: str, my_checkin_id: Optional[str] = None):
    """Get all posts for a location's social wall"""
    posts = await db.social_posts.find(
        {"location_slug": location_slug},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)

    result = []
    for post in posts:
        liked_by_me = my_checkin_id in post.get("likes", []) if my_checkin_id else False
        result.append(SocialPostResponse(
            id=post["id"],
            location_slug=post["location_slug"],
            checkin_id=post["checkin_id"],
            author_name=post["author_name"],
            author_emoji=post["author_emoji"],
            author_selfie=post.get("author_selfie"),
            message=post["message"],
            image_url=post.get("image_url"),
            likes_count=len(post.get("likes", [])),
            liked_by_me=liked_by_me,
            created_at=post["created_at"]
        ))

    return result


@router.post("/social/posts/{post_id}/like")
async def like_post(post_id: str, checkin_id: str):
    """Like or unlike a post"""
    post = await db.social_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    likes = post.get("likes", [])
    if checkin_id in likes:
        likes.remove(checkin_id)
        action = "unliked"
    else:
        likes.append(checkin_id)
        action = "liked"

    await db.social_posts.update_one(
        {"id": post_id},
        {"$set": {"likes": likes}}
    )

    return {"action": action, "likes_count": len(likes)}


@router.delete("/social/posts/{post_id}")
async def delete_social_post(post_id: str, checkin_id: str):
    """Delete your own post"""
    post = await db.social_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post["checkin_id"] != checkin_id:
        raise HTTPException(status_code=403, detail="You can only delete your own posts")

    await db.social_posts.delete_one({"id": post_id})
    return {"message": "Post deleted"}


# ==================== DIRECT MESSAGES ====================

@router.post("/social/dm", response_model=DirectMessageResponse)
async def send_direct_message(dm: DirectMessageCreate):
    """Send a direct message to another checked-in user"""
    from_checkin = await db.checkins.find_one({"id": dm.from_checkin_id})
    to_checkin = await db.checkins.find_one({"id": dm.to_checkin_id})

    if not from_checkin:
        raise HTTPException(status_code=400, detail="You must be checked in to send messages")
    if not to_checkin:
        raise HTTPException(status_code=400, detail="Recipient is no longer checked in")

    dm_dict = dm.dict()
    dm_dict["id"] = str(uuid.uuid4())
    dm_dict["read"] = False
    dm_dict["created_at"] = datetime.now(timezone.utc)

    await db.direct_messages.insert_one(dm_dict)

    return DirectMessageResponse(**dm_dict)


@router.get("/social/dm/{checkin_id}")
async def get_my_messages(checkin_id: str):
    """Get all DMs for a checked-in user (sent and received)"""
    messages = await db.direct_messages.find(
        {
            "$or": [
                {"from_checkin_id": checkin_id},
                {"to_checkin_id": checkin_id}
            ]
        },
        {"_id": 0}
    ).sort("created_at", -1).limit(100).to_list(100)

    return [DirectMessageResponse(**m) for m in messages]


@router.get("/social/dm/{checkin_id}/conversations")
async def get_conversations(checkin_id: str):
    """Get list of unique conversations for a user"""
    messages = await db.direct_messages.find(
        {
            "$or": [
                {"from_checkin_id": checkin_id},
                {"to_checkin_id": checkin_id}
            ]
        },
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)

    conversations = {}
    for msg in messages:
        if msg["from_checkin_id"] == checkin_id:
            partner_id = msg["to_checkin_id"]
            partner_name = msg["to_name"]
            partner_emoji = msg["to_emoji"]
        else:
            partner_id = msg["from_checkin_id"]
            partner_name = msg["from_name"]
            partner_emoji = msg["from_emoji"]

        if partner_id not in conversations:
            unread_count = await db.direct_messages.count_documents({
                "from_checkin_id": partner_id,
                "to_checkin_id": checkin_id,
                "read": False
            })
            conversations[partner_id] = {
                "partner_id": partner_id,
                "partner_name": partner_name,
                "partner_emoji": partner_emoji,
                "last_message": msg["message"],
                "last_message_at": msg["created_at"],
                "unread_count": unread_count
            }

    return list(conversations.values())


@router.get("/social/dm/{checkin_id}/thread/{partner_id}")
async def get_dm_thread(checkin_id: str, partner_id: str):
    """Get message thread between two users"""
    messages = await db.direct_messages.find(
        {
            "$or": [
                {"from_checkin_id": checkin_id, "to_checkin_id": partner_id},
                {"from_checkin_id": partner_id, "to_checkin_id": checkin_id}
            ]
        },
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)

    await db.direct_messages.update_many(
        {"from_checkin_id": partner_id, "to_checkin_id": checkin_id, "read": False},
        {"$set": {"read": True}}
    )

    return [DirectMessageResponse(**m) for m in messages]


@router.get("/social/dm/{checkin_id}/unread")
async def get_unread_count(checkin_id: str):
    """Get count of unread messages"""
    count = await db.direct_messages.count_documents({
        "to_checkin_id": checkin_id,
        "read": False
    })
    return {"unread_count": count}
