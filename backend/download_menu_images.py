#!/usr/bin/env python3
"""
Script to download menu images from external URLs and store them locally.
Updates the database with new local URLs.
"""

import os
import sys
import asyncio
import uuid
import requests
from urllib.parse import urlparse
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "finandfeathers")
UPLOAD_DIR = "/app/backend/uploads"
BACKEND_URL = os.environ.get("BACKEND_URL", "https://dine-admin-portal-1.preview.emergentagent.com")

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

def download_image(url, save_path):
    """Download image from URL and save locally"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30, stream=True)
        response.raise_for_status()
        
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"  Error downloading {url}: {e}")
        return False

def get_file_extension(url, content_type=None):
    """Get file extension from URL or content type"""
    parsed = urlparse(url)
    path = parsed.path.lower()
    
    if path.endswith('.jpg') or path.endswith('.jpeg'):
        return '.jpg'
    elif path.endswith('.png'):
        return '.png'
    elif path.endswith('.gif'):
        return '.gif'
    elif path.endswith('.webp'):
        return '.webp'
    else:
        # Default to jpg for most food images
        return '.jpg'

async def main():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("Fetching menu items...")
    items = await db.menu_items.find({}).to_list(1000)
    print(f"Found {len(items)} menu items")
    
    # Track stats
    downloaded = 0
    skipped = 0
    failed = 0
    already_local = 0
    
    for item in items:
        item_id = item.get('id')
        name = item.get('name', 'Unknown')
        image_url = item.get('image_url', '')
        
        if not image_url:
            skipped += 1
            continue
            
        # Check if already local
        if 'emergentagent.com' in image_url and '/api/uploads/' in image_url:
            already_local += 1
            continue
            
        # Check if it's an external URL we need to download
        if 'finandfeathers' in image_url or 'emergentagent' not in image_url:
            print(f"\nDownloading: {name}")
            print(f"  From: {image_url[:80]}...")
            
            # Generate unique filename
            ext = get_file_extension(image_url)
            filename = f"menu_{item_id}_{uuid.uuid4().hex[:8]}{ext}"
            save_path = os.path.join(UPLOAD_DIR, filename)
            
            if download_image(image_url, save_path):
                # Update database with new local URL
                new_url = f"{BACKEND_URL}/api/uploads/{filename}"
                await db.menu_items.update_one(
                    {"id": item_id},
                    {"$set": {"image_url": new_url}}
                )
                print(f"  Saved as: {filename}")
                downloaded += 1
            else:
                failed += 1
        else:
            already_local += 1
    
    print(f"\n{'='*50}")
    print(f"Summary:")
    print(f"  Downloaded: {downloaded}")
    print(f"  Already local: {already_local}")
    print(f"  Skipped (no image): {skipped}")
    print(f"  Failed: {failed}")
    print(f"{'='*50}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
