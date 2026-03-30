# Fin & Feathers Restaurant PWA — Product Requirements Document

## Latest Changes (2026-03-30)
- **Menu Style Sync Fix (2026-03-30):** Admin and public menu now always use the same merged styles (DB styles + defaults). All 19 category styles persisted to DB on first admin load. No more fallback mismatch where admin showed "Default Cards" but public rendered "Horizontal".
- **Local Menu Images Verified (2026-03-30):** All 84 local images load correctly (0 broken). 95 items have no image (drinks, etc.). External image URLs fully converted.
- **DJ Social Wall Integration (2026-03-28):** DJ Panel now has "View Vibe Wall & Chat" button. Checked-in DJs appear in "Who's Here" tab and are DM-able by patrons. Auto-creates user profile for DJs visiting the wall. Song request feed button only appears when DJ is live.
- **Unified People Tab (2026-03-28):** Merged Loyalty Members, Contact Forms, and Check-ins into a single searchable "People" tab in the admin panel. Added CSV export for all contacts. Replaced separate Loyalty/Contacts tabs.
- **Fixed Google Review Links (2026-03-28):** Replaced broken `g.page/r/CfinandfeathersReview` with location-specific Google Review URLs using verified Place IDs (Edgewood, Midtown, Douglasville, Riverdale). The "Leave a Review" button now opens the correct review page for the user's saved location.
- **PWA & Push Verified (2026-03-28):** Confirmed service worker registers, manifest is valid with all icons, VAPID keys are configured, and push subscription flow is wired end-to-end.
- **Welcome Popup Routing Fix (2026-03-28):** Geolocation denied → no default location shown, "Find Your Location" prompt with full scrollable list. Selecting a location saves it and closes popup (stays on homepage). Only the "Check In !" button on the homepage navigates to the Social Wall.
- **Reservation Time Slots (2026-03-28):** Last reservation time updated to 10 PM (Sun-Thu) and 12:00 AM (Fri-Sat).
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
- Welcome Popup: geolocation-off shows "Find Your Location" + full list; location selection stays on homepage; only "Check In !" button goes to Social Wall
- Unified People tab: Loyalty + Contacts + Check-ins merged with search, filter, delete, status management, and CSV export
- Location-specific Google Review URLs (verified Place IDs for 4 main locations)
- PWA: Service worker, manifest, icons, push notifications all verified working

## Upcoming Tasks
- (P2) Continue `server.py` refactoring
- (P2) Per-Location Weekly Specials management
- (P3) WordPress Integration
- (P3) Apple Sign-In Integration
- (P3) Merchandise Store Enhancements
- (P3) Safe `api.js` dead code cleanup
