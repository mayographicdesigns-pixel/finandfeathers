from pywebpush import webpush, WebPushException
import json
import os
from typing import List, Dict

# VAPID keys for web push - must be set in environment
VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY')
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY')

# Validate VAPID keys at startup
if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
    print("WARNING: VAPID keys not set. Push notifications will be disabled.")
    VAPID_PRIVATE_KEY = None
    VAPID_PUBLIC_KEY = None

VAPID_CLAIMS = {
    "sub": "mailto:notifications@finandfeathers.com"
}

class PushNotificationService:
    def __init__(self, db):
        self.db = db
        self.vapid_private_key = VAPID_PRIVATE_KEY
        self.vapid_public_key = VAPID_PUBLIC_KEY
        self.vapid_claims = VAPID_CLAIMS

    async def send_notification(self, subscription: Dict, notification_data: Dict) -> bool:
        """Send a push notification to a single subscription"""
        try:
            webpush(
                subscription_info=subscription,
                data=json.dumps(notification_data),
                vapid_private_key=self.vapid_private_key,
                vapid_claims=self.vapid_claims
            )
            return True
        except WebPushException as e:
            print(f"Push notification failed: {e}")
            # If subscription is no longer valid, remove it
            if e.response and e.response.status_code in [404, 410]:
                await self.remove_invalid_subscription(subscription['endpoint'])
            return False

    async def send_to_all_subscribers(self, notification_data: Dict) -> Dict:
        """Send push notification to all subscribers"""
        members = await self.db.loyalty_members.find(
            {"push_subscription": {"$exists": True, "$ne": None}}
        ).to_list(None)
        
        sent_count = 0
        failed_count = 0
        
        for member in members:
            if member.get('push_subscription'):
                success = await self.send_notification(
                    member['push_subscription'],
                    notification_data
                )
                if success:
                    sent_count += 1
                else:
                    failed_count += 1
        
        return {
            "sent": sent_count,
            "failed": failed_count,
            "total_subscribers": len(members)
        }

    async def send_to_specific_members(self, member_ids: List[str], notification_data: Dict) -> Dict:
        """Send push notification to specific members"""
        sent_count = 0
        failed_count = 0
        
        for member_id in member_ids:
            member = await self.db.loyalty_members.find_one({"id": member_id})
            if member and member.get('push_subscription'):
                success = await self.send_notification(
                    member['push_subscription'],
                    notification_data
                )
                if success:
                    sent_count += 1
                else:
                    failed_count += 1
        
        return {
            "sent": sent_count,
            "failed": failed_count,
            "total_targeted": len(member_ids)
        }

    async def remove_invalid_subscription(self, endpoint: str):
        """Remove invalid push subscription from database"""
        await self.db.loyalty_members.update_many(
            {"push_subscription.endpoint": endpoint},
            {"$unset": {"push_subscription": ""}}
        )

    def get_public_key(self) -> str:
        """Get VAPID public key for client subscription"""
        return self.vapid_public_key
