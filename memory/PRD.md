# Fin & Feathers Restaurant PWA — Product Requirements Document

## Latest Changes (2026-03-27)
- **Timezone Verification:** Confirmed all Georgia locations use `America/New_York` (EDT) and Las Vegas uses `America/Los_Angeles` (PDT). Backend `timezone_utils.py` maps all 9 locations correctly. Frontend displays timezone abbreviation in headers, DJ schedules, and check-in times.
- **Karaoke Auto-Deactivation Fix:** Added logic to auto-deactivate karaoke sessions when the schedule window ends. Previously, auto-activated sessions stayed active forever. Now checks if current time is outside all karaoke schedule windows for the location and deactivates if `auto_activated` flag is set.
- **Midnight-Crossing Fix:** Improved karaoke schedule window detection to properly handle events crossing midnight (e.g., 20:00-02:00). Now checks both the starting day and the next day for the post-midnight portion.
- **Check-in Time Display Fix:** Fixed check-in timestamps on the "Who's Here" tab to display in the location's timezone instead of the browser's local timezone (which was UTC in some clients).
- **Check-in TTL Confirmed:** Check-ins auto-expire after 4 hours via `expires_at` field, cleaned up on read. Manual check-out also available via DELETE endpoint.

## Original Problem Statement
Build a full-featured restaurant PWA for Fin & Feathers Restaurants, including:
- Dynamic homepage, menu, events, gallery
- Admin dashboard for managing all content
- DJ/Karaoke management system with live song requests
- User check-in, social wall, and loyalty programs
- Careers section for job applications
- Merchandise store integration
- Token economy with Stripe/WooCommerce payments

## Architecture
- **Frontend:** React (CRA) + TailwindCSS + ShadCN/UI
- **Backend:** FastAPI + Motor (async MongoDB)
- **Database:** MongoDB
- **Payments:** Stripe + WooCommerce
- **AI:** OpenAI GPT-4o via emergentintegrations (event flyer reader)
- **Auth:** Google OAuth (Emergent-managed) + email/password JWT

## Backend Router Architecture
```
/app/backend/
├── server.py         (~3450 lines) — Core endpoints: locations, tokens, user profiles, admin, menu, gallery, specials, social links, page content, loyalty
├── database.py       — Shared DB connection, push service, admin credentials, get_current_admin
├── models.py         — All Pydantic models
├── auth.py           — JWT + password hashing utilities
├── push_service.py   — Push notification service
├── timezone_utils.py — Location timezone mapping (GA→Eastern, NV→Pacific)
└── routes/
    ├── auth.py       — Admin login, Google OAuth, user registration, password login, forgot/reset password
    ├── events.py     — Events CRUD, free reservations, AI flyer extraction
    ├── payments.py   — Stripe checkout (tokens, events, merch), webhooks, payment methods
    ├── wall.py       — Social wall posts, group chat, DMs, notifications
    ├── careers.py    — Job applications
    └── dj.py         — DJ/karaoke management, song requests, tipping, auto-activation/deactivation
```

## Key API Endpoints
- `/api/auth/*` — Authentication (login, register, OAuth, password reset)
- `/api/events` — Public events
- `/api/admin/events/*` — Admin events management
- `/api/stripe/*` — Stripe checkout sessions
- `/api/webhook/stripe` — Stripe webhooks
- `/api/payment/methods` — Available payment methods
- `/api/wall/*` — Social wall, chat, DMs
- `/api/dj/*` — DJ management, karaoke
- `/api/dj/next-session/{location_slug}` — Returns DJ status, karaoke state, timezone info
- `/api/locations` — Location management
- `/api/tokens/*` — Token economy
- `/api/user/profile/*` — User profile management
- `/api/admin/*` — Admin management
- `/api/checkin` — Check-in/out with 4-hour TTL
- `/api/menu/items?location_slug=X` — Per-location menus

## Key DB Collections
- `user_profiles` — User data with role, staff_title, token balances
- `events` — Event definitions
- `event_reservations` — Free event reservations
- `payment_transactions` — Stripe/WooCommerce transactions
- `admin_users` — Admin accounts
- `social_wall_posts` — Social wall feed
- `social_wall_chat` — Location group chat
- `social_wall_dms` — Direct messages
- `social_notifications` — Push notifications
- `dj_tips` — DJ tip records
- `dj_schedules` — DJ schedule with day_of_week (0=Mon, 6=Sun)
- `karaoke_sessions` — Per-location karaoke state with auto_activated flag
- `locations` — Restaurant locations
- `checkins` — User check-ins with expires_at (4h TTL)
- `menu_items` — Per-location menu items
- `gallery` — Gallery items with location_slug and source tags

## Completed Features
- Full admin dashboard with all content management tabs
- DJ/Karaoke system with song requests and tipping
- Karaoke auto-activation AND auto-deactivation by schedule
- Social Wall (Vibe page) with posts, group chat, DMs, push notifications
- DJ Status Banner: Shows "LIVE NOW" or "No DJ — Next Session" with timezone
- Check-in with 4-hour TTL auto-expiry and manual check-out
- Per-location menus with geolocation auto-detect
- Location-based timezone support (EST/EDT for GA, PST/PDT for NV)
- Geolocation welcome popup every session
- Gallery auto-add from social wall images
- Weekly promo videos admin management
- Token economy with Stripe + WooCommerce
- Google OAuth + email/password authentication
- AI-powered event flyer reader
- Careers/job application system
- Las Vegas hookah pricing hidden

## Current Status
All features working. Timezone handling verified for all locations. Karaoke auto-activation/deactivation fully functional. 100% test pass rate (16 backend + frontend verification).

## Upcoming Tasks
- (P2) Continue `server.py` refactoring (extract menus, gallery, etc.)
- (P2) Per-Location Weekly Specials management
- (P3) WordPress Integration
- (P3) Apple Sign-In Integration
- (P3) Merchandise Store Enhancements
- (P3) Safe `api.js` dead code cleanup (use AST-aware tools only)
