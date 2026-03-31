# Fin & Feathers Restaurant PWA — Product Requirements Document

## Latest Changes (2026-03-31)
- **Signature Cocktails Menu Update (2026-03-31):** Updated all 11 signature cocktails with new descriptions and images from uploaded zip. Added 5 Happy Hour Favorites (Margarita, Rum Punch, Whiskey Sour, Long Island at $10; Wine Selection at $8). Changed cocktail display from line layout to card layout with 3-column grid showing cocktail images.
- **DJ Schedule Bulk Import (2026-03-31):** Added "Bulk Import" tab to admin DJ Schedule panel. Admins paste a full week's schedule text, auto-parse, preview, and save in one click. Backend `POST /api/dj/weekly-schedule/bulk`.
- **Weekly Schedule Auto-Publisher (2026-03-31):** When a bulk import saves, it auto-posts a formatted DJ lineup to the Social Wall (both `wall_posts` and `social_posts` collections) for that location.
- **PWA Cache Refresh Button (2026-03-31):** When app is installed (standalone), "Install App" transforms into "Refresh" button that clears service worker caches and reloads.
- **DJ Schedules Frontend Fix (2026-03-31):** Fixed data source mismatch, seeded Edgewood (9 DJs) and Albany (3 DJs) schedules.
- **Dead Code Cleanup (2026-03-31):** Deleted `AdminTabs.jsx` (5,931 lines dead code).

## Original Problem Statement
Build a full-featured restaurant PWA for Fin & Feathers Restaurants with dynamic homepage, menu, events, gallery, admin dashboard, DJ/Karaoke system, user check-in/social wall, careers, merchandise, and token economy.

## Architecture
- **Frontend:** React (CRA) + TailwindCSS + ShadCN/UI
- **Backend:** FastAPI + Motor (async MongoDB) + WebSocket
- **Database:** MongoDB
- **Payments:** Stripe + WooCommerce
- **AI:** OpenAI GPT-4o via emergentintegrations

## Key DB Collections
- `menu_items`: Menu entries with `image` field for local images, `layout` field ('card'/'line')
- `dj_schedule`: Weekly DJ schedules (day_of_week, time_slot, week_label)
- `wall_posts` + `social_posts`: Social wall posts (auto-published DJ lineups go here)
- `locations`: Restaurant locations with slugs

## Key API Endpoints
- `POST /api/dj/weekly-schedule/bulk` — Bulk import + auto-publish to Social Wall
- `GET /api/dj/weekly-schedule/{location_slug}` — Weekly DJ schedules
- `GET /api/menu/items?location_slug=X` — Per-location menu (cocktails now with card layout + images)

## Cocktail Menu Items (Updated 2026-03-31)
Signature: The 405, Sunset Blvd, Baldwin Hills, LAX Sidecar, Melrose Ave, East LA, California Dreaming, Marina Del Rey, The Hollywood ($15-17), Pacific Coast Hwy, Fin-A-Rita, Rodeo Drive ($20)
Happy Hour: Margarita, Rum Punch, Whiskey Sour, Long Island ($10), Wine Selection ($8)

## Upcoming Tasks
- (P1) Code quality: localStorage security, api.js dead code cleanup
- (P2) Continue `server.py` refactoring (3839 lines remaining)
- (P2) Per-Location Weekly Specials management
- (P3) WordPress Integration
- (P3) Apple Sign-In Integration
- (P3) Merchandise Store Enhancements
