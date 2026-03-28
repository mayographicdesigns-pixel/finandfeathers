# Fin & Feathers Restaurant PWA — Product Requirements Document

## Latest Changes (2026-03-28)
- **Menu Image Sync Across Locations:** Admin image updates now auto-propagate to all locations sharing the same item name. Added "Sync Images to All Locations" button in admin panel.
- **All Images Stored in MongoDB:** Added "Store All Images Locally" button that converts external URLs to `/api/media/` (MongoDB). Converted 386 external images, 0 remaining external.
- **Better Admin Image Editing:** Item images are now clickable for quick photo replacement. "LOCAL"/"EXTERNAL" badge shows storage status. `download_image_to_uploads` now stores in MongoDB (production-safe).
- **In-App Live Streaming (2026-03-27):** DJs stream from camera via WebSocket relay. "DJ IS LIVE" homepage banner.
- **Timezone Verification (2026-03-27):** GA→America/New_York, NV→America/Los_Angeles. Karaoke auto-deactivation fixed.

## Original Problem Statement
Build a full-featured restaurant PWA for Fin & Feathers Restaurants with dynamic homepage, menu, events, gallery, admin dashboard, DJ/Karaoke system, user check-in/social wall, careers, merchandise, and token economy.

## Architecture
- **Frontend:** React (CRA) + TailwindCSS + ShadCN/UI
- **Backend:** FastAPI + Motor (async MongoDB) + WebSocket
- **Database:** MongoDB (media_files collection for all images)
- **Payments:** Stripe + WooCommerce
- **AI:** OpenAI GPT-4o via emergentintegrations

## Key API Endpoints (Menu)
- `GET /api/menu/items?location_slug=X` — Per-location menu
- `PUT /api/admin/menu-items/{item_id}` — Update item + auto-sync image to all locations
- `POST /api/admin/menu-items/sync-images-to-locations` — Bulk sync master images to all locations
- `POST /api/admin/menu-items/convert-external-images` — Convert all external URLs to local MongoDB storage
- `POST /api/admin/upload` — Upload image to MongoDB media_files collection

## Completed Features
- All features from previous sessions
- Menu image cross-location sync on update
- Bulk image conversion to local MongoDB storage
- Admin quick-replace photo (click image to replace)
- LOCAL/EXTERNAL image status badges in admin
- In-app DJ live streaming (WebSocket)
- "DJ IS LIVE" homepage banner
- Karaoke auto-activation/deactivation
- Timezone-correct displays

## Upcoming Tasks
- (P2) Continue `server.py` refactoring
- (P2) Per-Location Weekly Specials management
- (P3) WordPress Integration
- (P3) Apple Sign-In Integration
- (P3) Merchandise Store Enhancements
- (P3) Safe `api.js` dead code cleanup
