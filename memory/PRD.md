# Fin & Feathers Restaurant PWA — Product Requirements Document

## Latest Changes (2026-03-31)
- **DJ Schedules Frontend Fix (2026-03-31):** Fixed data source mismatch — frontend now calls `/api/dj/weekly-schedule/{slug}` instead of `/api/dj/schedules/location/{slug}`. Updated `LocationDetailPage.jsx` rendering to handle `day_of_week` + `time_slot` format. Seeded Edgewood (9 DJs) and Albany (3 DJs) schedules into `dj_schedule` collection.
- **Dead Code Cleanup (2026-03-31):** Deleted `AdminTabs.jsx` (5,931 lines) — all components already extracted to individual files and re-exported from `components/admin/index.js`.
- **CheckIn Page Verified (2026-03-31):** Client/Staff two-step flow with DJ/Bartender/Server/Manager role selection confirmed working.
- **Menu Style Sync Fix (2026-03-30):** Admin and public menu now always use the same merged styles (DB styles + defaults).
- **Local Menu Images Verified (2026-03-30):** All 84 local images load correctly.
- **DJ Social Wall Integration (2026-03-28):** DJ Panel "View Vibe Wall & Chat" button. DJs appear in "Who's Here" and are DM-able.
- **Unified People Tab (2026-03-28):** Merged Contacts & Loyalty with CSV export.
- **PWA & Push Verified (2026-03-28):** Service worker, manifest, VAPID keys all active.
- **Welcome Popup Routing Fix (2026-03-28):** Location selection stays on homepage; only "Check In!" navigates to Social Wall.

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
- `GET /api/dj/weekly-schedule/{location_slug}` — Weekly DJ schedules per location
- `GET /api/menu/items?location_slug=X` — Per-location menu
- `PUT /api/admin/menu-items/{item_id}` — Update item + auto-sync
- `GET /api/admin/people/export` — CSV export of contacts/loyalty
- `PUT /api/user/profile/{user_id}` — Update user profile/role

## Completed Features
- All core PWA features (menu, events, gallery, admin, DJ, social wall, careers, merchandise, tokens)
- DJ Schedules seeded for all locations (Edgewood, Albany, Stone Mountain, Douglasville, Midtown, Valdosta)
- Check-in page with Client/Staff role selection
- Dead code cleanup (AdminTabs.jsx removed)
- Menu image cross-location sync
- In-app DJ live streaming
- Push notifications for social wall
- Location-specific Google Review URLs

## Upcoming Tasks
- (P1) Continue code quality improvements (localStorage security, api.js dead code cleanup)
- (P2) Continue `server.py` refactoring (still 3839 lines, 142 endpoints)
- (P2) Per-Location Weekly Specials management
- (P3) WordPress Integration
- (P3) Apple Sign-In Integration
- (P3) Merchandise Store Enhancements
