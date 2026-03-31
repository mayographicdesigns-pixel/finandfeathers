# Fin & Feathers Restaurant PWA — Product Requirements Document

## Latest Changes (2026-03-31)
- **Menu Image Consistency Fix (2026-03-31):** Changed cocktails category display style from `style_two` (circular container) to `default` (rectangular card), ensuring mobile menu images match the admin dashboard edit view.
- **Signature Cocktails Menu Update (2026-03-31):** Updated all 11 signature cocktails with new descriptions and images from uploaded zip. Added 5 Happy Hour Favorites (Margarita, Rum Punch, Whiskey Sour, Long Island at $10; Wine Selection at $8). Set cocktails to card layout with 3-column grid.
- **DJ Schedule Bulk Import (2026-03-31):** Added "Bulk Import" tab. Admins paste a full week's schedule, auto-parse, preview, save. Backend `POST /api/dj/weekly-schedule/bulk`.
- **Weekly Schedule Auto-Publisher (2026-03-31):** Bulk import auto-posts DJ lineup to Social Wall (both `wall_posts` and `social_posts` collections).
- **PWA Cache Refresh Button (2026-03-31):** Installed app shows "Refresh" button that clears service worker caches.
- **DJ Schedules Frontend Fix (2026-03-31):** Fixed data source mismatch. Seeded Edgewood (9 DJs) and Albany (3 DJs).
- **Dead Code Cleanup (2026-03-31):** Deleted `AdminTabs.jsx` (5,931 lines dead code).

## Original Problem Statement
Build a full-featured restaurant PWA for Fin & Feathers Restaurants with dynamic homepage, menu, events, gallery, admin dashboard, DJ/Karaoke system, user check-in/social wall, careers, merchandise, and token economy.

## Architecture
- **Frontend:** React (CRA) + TailwindCSS + ShadCN/UI
- **Backend:** FastAPI + Motor (async MongoDB) + WebSocket
- **Database:** MongoDB
- **Payments:** Stripe + WooCommerce
- **AI:** OpenAI GPT-4o via emergentintegrations

## Key Menu Configuration
- Cocktails and Signature Cocktails: `default` style (rectangular card images matching admin)
- Food items (starters, entrees): `style_one` / `style_three` styles
- Cocktail images stored at `/app/frontend/public/images/cocktails/`
- Menu items use `image` field (not `image_url`) for frontend display
- Layout field controls card vs line: `layout: 'card'` for image cards

## Upcoming Tasks
- (P1) Code quality: localStorage security, api.js dead code cleanup
- (P2) Continue `server.py` refactoring (3839 lines remaining)
- (P2) Per-Location Weekly Specials management
- (P3) WordPress Integration
- (P3) Apple Sign-In Integration
- (P3) Merchandise Store Enhancements
