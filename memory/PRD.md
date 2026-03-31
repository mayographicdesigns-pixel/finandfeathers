# Fin & Feathers Restaurant PWA — Product Requirements Document

## Latest Changes (2026-03-31)
- **DJ Schedule Bulk Import (2026-03-31):** Added "Bulk Import" tab to admin DJ Schedule panel. Admins can paste a full week's schedule text (e.g., "Tuesday: DJ Flexxrated 8pm - 12am"), auto-parse it, preview entries, and save in one click. Backend endpoint `POST /api/dj/weekly-schedule/bulk` supports replace-existing mode.
- **PWA Cache Refresh Button (2026-03-31):** When the app is installed (standalone/PWA mode), the "Install App" button transforms into a "Refresh" button that clears all service worker caches and hard-reloads the page. Fixes stale menu/image content issues.
- **DJ Schedules Frontend Fix (2026-03-31):** Fixed data source mismatch — frontend now calls `/api/dj/weekly-schedule/{slug}` instead of `/api/dj/schedules/location/{slug}`. Updated `LocationDetailPage.jsx` rendering for `day_of_week` + `time_slot` format. Seeded Edgewood (9 DJs) and Albany (3 DJs) schedules.
- **Dead Code Cleanup (2026-03-31):** Deleted `AdminTabs.jsx` (5,931 lines) — all components already extracted to individual files.
- **CheckIn Page Verified (2026-03-31):** Client/Staff two-step flow with DJ/Bartender/Server/Manager role selection confirmed working.

## Original Problem Statement
Build a full-featured restaurant PWA for Fin & Feathers Restaurants with dynamic homepage, menu, events, gallery, admin dashboard, DJ/Karaoke system, user check-in/social wall, careers, merchandise, and token economy.

## Architecture
- **Frontend:** React (CRA) + TailwindCSS + ShadCN/UI
- **Backend:** FastAPI + Motor (async MongoDB) + WebSocket
- **Database:** MongoDB (media_files collection for all images)
- **Payments:** Stripe + WooCommerce
- **AI:** OpenAI GPT-4o via emergentintegrations

## Key DB Collections
- `dj_schedule` (singular): Weekly DJ schedules (day_of_week, time_slot, week_label)
- `dj_schedules` (plural): Legacy date-specific schedules (scheduled_date, start_time, end_time)
- `menu_items`: Menu entries, synced across locations
- `locations`: Restaurant locations with slugs
- `dj_profiles`: DJ profiles for the DJ panel

## Key API Endpoints
- `POST /api/dj/weekly-schedule/bulk` — Bulk import weekly DJ schedules
- `GET /api/dj/weekly-schedule/{location_slug}` — Weekly DJ schedules per location
- `GET /api/menu/items?location_slug=X` — Per-location menu
- `PUT /api/admin/menu-items/{item_id}` — Update item + auto-sync
- `GET /api/admin/people/export` — CSV export of contacts/loyalty
- `PUT /api/user/profile/{user_id}` — Update user profile/role

## Completed Features
- All core PWA features (menu, events, gallery, admin, DJ, social wall, careers, merchandise, tokens)
- DJ Schedule Bulk Import (paste text → parse → save)
- PWA Cache Refresh button (standalone mode)
- DJ Schedules seeded for all locations
- Check-in page with Client/Staff role selection
- Dead code cleanup (AdminTabs.jsx removed)
- Menu image cross-location sync
- In-app DJ live streaming
- Push notifications for social wall
- Location-specific Google Review URLs

## Upcoming Tasks
- (P1) Code quality: localStorage security review, api.js dead code cleanup
- (P2) Continue `server.py` refactoring (3839 lines remaining)
- (P2) Per-Location Weekly Specials management
- (P3) WordPress Integration
- (P3) Apple Sign-In Integration
- (P3) Merchandise Store Enhancements
