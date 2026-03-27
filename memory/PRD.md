# Fin & Feathers Restaurant PWA — Product Requirements Document

## Latest Changes (2026-03-27)
- **In-App Live Streaming:** DJs can now go live directly from their camera in the DJ panel. Uses WebSocket relay (MediaRecorder → server → MediaSource) for real-time streaming. Viewers watch on the Vibe page's auto-appearing "LIVE" tab with live chat. Also keeps existing YouTube/Facebook/Twitch URL paste option.
- **"DJ IS LIVE" Homepage Banner:** When any DJ is streaming (camera or URL), a prominent animated red banner appears on the homepage with "DJ [Name] is LIVE — Watch Now" text. Clicking navigates to the Vibe page. Polls every 15 seconds.
- **Karaoke Auto-Deactivation Fix:** Sessions that were auto-activated by schedule now auto-deactivate when the window ends. Fixed midnight-crossing detection.
- **Check-in Time Display Fix:** "Who's Here" tab now shows times in location timezone instead of UTC.
- **Timezone Verification:** All Georgia locations → America/New_York (EDT), Las Vegas → America/Los_Angeles (PDT).

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
- **Backend:** FastAPI + Motor (async MongoDB) + WebSocket
- **Database:** MongoDB
- **Payments:** Stripe + WooCommerce
- **AI:** OpenAI GPT-4o via emergentintegrations (event flyer reader)
- **Auth:** Google OAuth (Emergent-managed) + email/password JWT
- **Streaming:** WebSocket relay (MediaRecorder → FastAPI WS → MediaSource)

## Backend Router Architecture
```
/app/backend/
├── server.py         (~3450 lines) — Core endpoints
├── database.py       — Shared DB connection
├── models.py         — All Pydantic models
├── auth.py           — JWT + password hashing
├── push_service.py   — Push notification service
├── timezone_utils.py — Location timezone mapping
└── routes/
    ├── auth.py       — Authentication endpoints
    ├── events.py     — Events CRUD
    ├── payments.py   — Stripe checkout, webhooks
    ├── wall.py       — Social wall, chat, DMs
    ├── careers.py    — Job applications
    ├── dj.py         — DJ/karaoke management
    └── stream.py     — NEW: WebSocket live streaming relay
```

## Key API Endpoints
- `/api/stream/active` — Get all active in-app streams
- `/api/stream/active/{location_slug}` — Check stream status for a location
- `/api/ws/live-stream/{location_slug}` — WebSocket endpoint (broadcaster/viewer)
- `/api/dj/next-session/{location_slug}` — DJ status, karaoke state, timezone
- `/api/auth/*` — Authentication
- `/api/wall/*` — Social wall, chat, DMs
- `/api/dj/*` — DJ management, karaoke
- `/api/checkin` — Check-in/out with 4-hour TTL
- `/api/menu/items?location_slug=X` — Per-location menus

## Key DB Collections
- `dj_profiles` — Added `live_stream_url`, `in_app_stream` fields
- `karaoke_sessions` — Per-location karaoke state with `auto_activated` flag
- `checkins` — User check-ins with `expires_at` (4h TTL)
- All other collections unchanged

## Completed Features
- Full admin dashboard with all content management tabs
- DJ/Karaoke system with song requests and tipping
- **In-App Camera Live Streaming (WebSocket relay)**
- **YouTube/Facebook/Twitch URL live streaming**
- **"DJ IS LIVE" homepage banner**
- Karaoke auto-activation AND auto-deactivation by schedule
- Social Wall (Vibe page) with posts, group chat, DMs, push notifications
- Check-in with 4-hour TTL auto-expiry
- Per-location menus with geolocation auto-detect
- Location-based timezone support (EST/EDT for GA, PST/PDT for NV)
- Geolocation welcome popup
- Gallery auto-add from social wall images
- Token economy with Stripe + WooCommerce
- Google OAuth + email/password authentication
- AI-powered event flyer reader
- Careers/job application system

## Current Status
All features working. In-app live streaming via WebSocket tested and verified. 100% test pass rate.

## Upcoming Tasks
- (P2) Continue `server.py` refactoring (extract menus, gallery, etc.)
- (P2) Per-Location Weekly Specials management
- (P3) WordPress Integration
- (P3) Apple Sign-In Integration
- (P3) Merchandise Store Enhancements
- (P3) Safe `api.js` dead code cleanup
