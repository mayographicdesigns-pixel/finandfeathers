"""Social Wall router — posts, group chat, DMs, push notifications."""
from fastapi import APIRouter, HTTPException, UploadFile, File
from database import db, UPLOAD_DIR, push_service
from datetime import datetime, timezone
import uuid
import logging

router = APIRouter(prefix="/api")


# ==========================================
# WALL POSTS
# ==========================================

@router.post("/wall/posts")
async def create_wall_post(body: dict):
    user_id = body.get("user_id")
    location_slug = body.get("location_slug")
    if not user_id or not location_slug:
        raise HTTPException(status_code=400, detail="user_id and location_slug required")

    post = {
        "id": str(uuid.uuid4()),
        "location_slug": location_slug,
        "user_id": user_id,
        "user_name": body.get("user_name", "Anonymous"),
        "user_avatar": body.get("user_avatar", ""),
        "post_type": body.get("post_type", "text"),
        "content": body.get("content", ""),
        "image_url": body.get("image_url"),
        "likes": [],
        "comments": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.wall_posts.insert_one(post)
    post.pop("_id", None)
    return post


@router.get("/wall/posts/{location_slug}")
async def get_wall_posts(location_slug: str, limit: int = 50, skip: int = 0):
    cursor = db.wall_posts.find(
        {"location_slug": location_slug}, {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit)
    return await cursor.to_list(length=limit)


@router.post("/wall/posts/{post_id}/like")
async def like_wall_post(post_id: str, body: dict):
    user_id = body.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")

    post = await db.wall_posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    likes = post.get("likes", [])
    if user_id in likes:
        likes.remove(user_id)
        action = "unliked"
    else:
        likes.append(user_id)
        action = "liked"
        # Push notification to post author
        if post.get("user_id") != user_id:
            await _notify_user(
                post["user_id"],
                f"{body.get('user_name', 'Someone')} liked your post",
                post.get("content", "")[:60]
            )

    await db.wall_posts.update_one({"id": post_id}, {"$set": {"likes": likes}})
    return {"action": action, "likes_count": len(likes)}


@router.post("/wall/posts/{post_id}/comment")
async def comment_wall_post(post_id: str, body: dict):
    user_id = body.get("user_id")
    content = body.get("content", "").strip()
    if not user_id or not content:
        raise HTTPException(status_code=400, detail="user_id and content required")

    comment = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "user_name": body.get("user_name", "Anonymous"),
        "user_avatar": body.get("user_avatar", ""),
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.wall_posts.update_one({"id": post_id}, {"$push": {"comments": comment}})

    # Push notification to post author
    post = await db.wall_posts.find_one({"id": post_id}, {"_id": 0})
    if post and post.get("user_id") != user_id:
        await _notify_user(
            post["user_id"],
            f"{body.get('user_name', 'Someone')} commented on your post",
            content[:60]
        )

    return comment


@router.delete("/wall/posts/{post_id}")
async def delete_wall_post(post_id: str, user_id: str = ""):
    post = await db.wall_posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.wall_posts.delete_one({"id": post_id})
    return {"message": "Post deleted"}


@router.post("/wall/posts/upload-image")
async def upload_wall_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 5MB")
    filename = f"wall_{uuid.uuid4().hex[:8]}_{file.filename}"
    filepath = UPLOAD_DIR / filename
    with open(filepath, "wb") as f:
        f.write(contents)
    return {"image_url": f"/api/uploads/{filename}"}


# ==========================================
# GROUP CHAT
# ==========================================

@router.post("/wall/chat/{location_slug}")
async def send_chat_message(location_slug: str, body: dict):
    user_id = body.get("user_id")
    content = body.get("content", "").strip()
    if not user_id or not content:
        raise HTTPException(status_code=400, detail="user_id and content required")

    msg = {
        "id": str(uuid.uuid4()),
        "location_slug": location_slug,
        "user_id": user_id,
        "user_name": body.get("user_name", "Anonymous"),
        "user_avatar": body.get("user_avatar", ""),
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.wall_chat_messages.insert_one(msg)
    msg.pop("_id", None)
    return msg


@router.get("/wall/chat/{location_slug}")
async def get_chat_messages(location_slug: str, limit: int = 100, before: str = ""):
    query = {"location_slug": location_slug}
    if before:
        query["created_at"] = {"$lt": before}
    cursor = db.wall_chat_messages.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
    messages = await cursor.to_list(length=limit)
    messages.reverse()
    return messages


# ==========================================
# DIRECT MESSAGES
# ==========================================

@router.post("/wall/dm")
async def send_dm(body: dict):
    from_user_id = body.get("from_user_id")
    to_user_id = body.get("to_user_id")
    content = body.get("content", "").strip()
    if not from_user_id or not to_user_id or not content:
        raise HTTPException(status_code=400, detail="from_user_id, to_user_id, and content required")

    msg = {
        "id": str(uuid.uuid4()),
        "from_user_id": from_user_id,
        "from_user_name": body.get("from_user_name", "Anonymous"),
        "from_user_avatar": body.get("from_user_avatar", ""),
        "to_user_id": to_user_id,
        "to_user_name": body.get("to_user_name", ""),
        "content": content,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.wall_dm_messages.insert_one(msg)
    msg.pop("_id", None)

    # Push notification to recipient
    await _notify_user(
        to_user_id,
        f"New message from {body.get('from_user_name', 'Someone')}",
        content[:60]
    )

    return msg


@router.get("/wall/dm/conversations/{user_id}")
async def get_dm_conversations(user_id: str):
    pipeline = [
        {"$match": {"$or": [{"from_user_id": user_id}, {"to_user_id": user_id}]}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": {"$cond": [{"$eq": ["$from_user_id", user_id]}, "$to_user_id", "$from_user_id"]},
            "last_message": {"$first": "$content"},
            "last_time": {"$first": "$created_at"},
            "partner_name": {"$first": {"$cond": [{"$eq": ["$from_user_id", user_id]}, "$to_user_name", "$from_user_name"]}},
            "partner_avatar": {"$first": {"$cond": [{"$eq": ["$from_user_id", user_id]}, {"$ifNull": ["$to_user_avatar", ""]}, {"$ifNull": ["$from_user_avatar", ""]}]}},
            "unread": {"$sum": {"$cond": [{"$and": [{"$eq": ["$to_user_id", user_id]}, {"$eq": ["$read", False]}]}, 1, 0]}}
        }},
        {"$sort": {"last_time": -1}},
        {"$project": {"_id": 0, "partner_id": "$_id", "partner_name": 1, "partner_avatar": 1, "last_message": 1, "last_time": 1, "unread": 1}}
    ]
    return await db.wall_dm_messages.aggregate(pipeline).to_list(length=50)


@router.get("/wall/dm/thread/{user_id}/{partner_id}")
async def get_dm_thread(user_id: str, partner_id: str, limit: int = 50):
    messages = await db.wall_dm_messages.find(
        {"$or": [
            {"from_user_id": user_id, "to_user_id": partner_id},
            {"from_user_id": partner_id, "to_user_id": user_id}
        ]}, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    messages.reverse()
    await db.wall_dm_messages.update_many(
        {"from_user_id": partner_id, "to_user_id": user_id, "read": False},
        {"$set": {"read": True}}
    )
    return messages


@router.get("/wall/dm/unread/{user_id}")
async def get_dm_unread_count(user_id: str):
    count = await db.wall_dm_messages.count_documents({"to_user_id": user_id, "read": False})
    return {"unread": count}


@router.get("/wall/users/{location_slug}")
async def get_wall_users(location_slug: str):
    recent_posters = await db.wall_posts.find(
        {"location_slug": location_slug},
        {"_id": 0, "user_id": 1, "user_name": 1, "user_avatar": 1}
    ).sort("created_at", -1).limit(50).to_list(length=50)
    recent_chatters = await db.wall_chat_messages.find(
        {"location_slug": location_slug},
        {"_id": 0, "user_id": 1, "user_name": 1, "user_avatar": 1}
    ).sort("created_at", -1).limit(50).to_list(length=50)
    seen = set()
    users = []
    for u in recent_posters + recent_chatters:
        uid = u.get("user_id")
        if uid and uid not in seen:
            seen.add(uid)
            users.append({"user_id": uid, "user_name": u.get("user_name", "Anonymous"), "user_avatar": u.get("user_avatar", "")})
    return users


# ==========================================
# PUSH NOTIFICATION SUBSCRIPTIONS
# ==========================================

@router.post("/wall/subscribe-push")
async def subscribe_wall_push(body: dict):
    """Subscribe a user to push notifications for the social wall"""
    user_id = body.get("user_id")
    subscription = body.get("subscription")
    if not user_id or not subscription:
        raise HTTPException(status_code=400, detail="user_id and subscription required")

    await db.wall_push_subscriptions.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "subscription": subscription,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"message": "Subscribed to push notifications"}


@router.get("/wall/notifications/{user_id}")
async def get_wall_notifications(user_id: str, limit: int = 20):
    """Get in-app notifications for a user"""
    cursor = db.wall_notifications.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).limit(limit)
    return await cursor.to_list(length=limit)


@router.post("/wall/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    await db.wall_notifications.update_one(
        {"id": notification_id}, {"$set": {"read": True}}
    )
    return {"message": "Marked as read"}


@router.post("/wall/notifications/read-all")
async def mark_all_notifications_read(body: dict):
    user_id = body.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    await db.wall_notifications.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}


@router.get("/wall/notifications/unread/{user_id}")
async def get_unread_notification_count(user_id: str):
    count = await db.wall_notifications.count_documents({"user_id": user_id, "read": False})
    return {"count": count}


# ==========================================
# HELPER: Send push notification to a user
# ==========================================

async def _notify_user(user_id: str, title: str, body: str):
    """Create an in-app notification and attempt to send push notification"""
    try:
        # Save in-app notification
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": title,
            "body": body,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.wall_notifications.insert_one(notification)

        # Try to send web push notification
        sub_doc = await db.wall_push_subscriptions.find_one({"user_id": user_id}, {"_id": 0})
        if sub_doc and sub_doc.get("subscription"):
            try:
                await push_service.send_notification(
                    sub_doc["subscription"],
                    {"title": title, "body": body, "tag": "social-wall"}
                )
            except Exception as e:
                logging.debug(f"Push notification failed for {user_id}: {e}")
    except Exception as e:
        logging.error(f"Notification error for {user_id}: {e}")
