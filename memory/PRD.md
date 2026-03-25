# Fin & Feathers Restaurant PWA — Product Requirements Document

## Latest Changes (2026-03-25)
- **Bug Fix:** Restored 90 accidentally deleted functions in `api.js` that were purged during an aggressive dead-code cleanup, which broke the entire frontend with `TypeError: X is not a function` errors.
- **DJ Status Fix:** "LIVE NOW" on Social Wall and Location pages now only shows when a DJ is actually checked in — not for karaoke alone. Song request and karaoke indicators hidden when no DJ present. Location pages show "Upcoming DJs" schedule instead.
- **Geolocation Popup Every Session:** Welcome popup now shows every app session (not just once ever), using geolocation to detect the user's nearest location. Returning users see a simplified view with a "Go to Social Wall" quick action and a list of all other locations to switch to.
- **Social Wall Images → Gallery:** Photos posted on the Social Wall feed are automatically added to the main gallery, tagged with `location_slug`, `posted_by`, and `source: social_wall`. Gallery API supports `?location_slug=` filtering.
- Simplified CheckInPage to only Client/Staff selection + staff role picker
- Added Close (X) bypass button to skip check-in
- Removed location detection, song requests, tipping from check-in page
- Updated welcome popup: "I am a..." now shows Client/Staff buttons, staff position picker on step 2
- Fixed Facebook page URL to finandfeathersrestaurants
- **DJ Live Streaming:** DJs can now "Go Live" by pasting a YouTube/Facebook/Instagram Live URL from their DJ panel. A "Live" tab auto-appears on the Social Wall with the embedded stream + live chat below it. Stream is auto-cleared on checkout.
- **Location-Based Timezone:** Auto-detects timezone from location (GA→Eastern, NV→Pacific). Social Wall header shows current local time (e.g., "9:02 AM EDT"). DJ schedule times display with timezone abbreviation. Backend uses location-aware datetime comparisons for schedules.

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
└── routes/
    ├── auth.py       — Admin login, Google OAuth, user registration, password login, forgot/reset password
    ├── events.py     — Events CRUD, free reservations, AI flyer extraction
    ├── payments.py   — Stripe checkout (tokens, events, merch), webhooks, payment methods
    ├── wall.py       — Social wall posts, group chat, DMs, notifications
    ├── careers.py    — Job applications
    └── dj.py         — DJ/karaoke management, song requests, tipping
```

## Key API Endpoints
- `/api/auth/*` — Authentication (login, register, OAuth, password reset)
- `/api/events` — Public events
- `/api/admin/events/*` — Admin events management
- `/api/stripe/*` — Stripe checkout sessions
- `/api/webhook/stripe` — Stripe webhooks
- `/api/payment/methods` — Available payment methods
- `/api/wall/*` — Social wall, chat, DMs
- `/api/dj/*` — DJ management
- `/api/locations` — Location management
- `/api/tokens/*` — Token economy
- `/api/user/profile/*` — User profile management
- `/api/admin/*` — Admin management

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
- `locations` — Restaurant locations

## Completed Features
- Full admin dashboard with all content management tabs
- DJ/Karaoke system with song requests and tipping
- Social Wall with posts, group chat, DMs, push notifications
- DJ Status Banner: Shows "LIVE NOW" or "No DJ — Next Session" with DJ name, event, date/time
- Conditional song request: Song button only visible when DJ is live or karaoke active
- Check-in page with Client/Staff role selection, linked to My Account
- My Account page with Profile, Photos, DMs (Messages), and History tabs
- Account <-> Check-in bidirectional navigation
- Signup/login redirects to Check-in flow
- Social Media Feed: Official Instagram embed (@finandfeathers) + Facebook Page Plugin between Find a Location and Order Online
- Events toggle: admin can activate/deactivate events, reflected on homepage immediately
- Token economy with Stripe + WooCommerce
- Google OAuth + email/password authentication
- AI-powered event flyer reader
- Careers/job application system
- Menu, gallery, specials management
- User profile management

## Current Status
All features working. `api.js` restored to full 2400-line version after botched cleanup. Major backend refactoring completed — server.py reduced from 5190 to ~3450 lines.

## Upcoming Tasks
- (P2) Per-Location Weekly Specials management
- (P3) WordPress Integration
- (P3) Apple Sign-In Integration
- (P3) Merchandise Store Enhancements
