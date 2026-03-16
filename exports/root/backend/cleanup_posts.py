#!/usr/bin/env python3
"""
Scheduled cleanup script for old social posts.
Run via cron at 4am EST daily:
0 4 * * * cd /app/backend && python cleanup_posts.py

Posts older than 24 hours without images are deleted.
"""

import os
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "finandfeathers")


async def cleanup_old_posts():
    """Delete posts older than 24 hours that don't have images"""
    logging.info("Starting scheduled cleanup of old posts...")
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Calculate cutoff time (24 hours ago)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    
    # Delete posts older than 24 hours that don't have images
    result = await db.social_posts.delete_many({
        "created_at": {"$lt": cutoff},
        "$or": [
            {"image_url": None},
            {"image_url": ""},
            {"image_url": {"$exists": False}}
        ]
    })
    
    logging.info(f"Cleanup complete: Deleted {result.deleted_count} old posts without images")
    
    # Also cleanup expired check-ins (older than 24 hours)
    checkin_result = await db.checkins.delete_many({
        "checked_in_at": {"$lt": cutoff}
    })
    
    logging.info(f"Cleaned up {checkin_result.deleted_count} expired check-ins")
    
    client.close()
    
    return {
        "deleted_posts": result.deleted_count,
        "deleted_checkins": checkin_result.deleted_count,
        "cleanup_time": datetime.now(timezone.utc).isoformat()
    }


if __name__ == "__main__":
    result = asyncio.run(cleanup_old_posts())
    print(f"Cleanup result: {result}")
