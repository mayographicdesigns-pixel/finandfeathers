# Fin & Feathers Restaurant PWA — Product Requirements Document

## Overview
A full-featured Progressive Web App (PWA) for Fin & Feathers restaurant chain. Built with React (frontend) + FastAPI (backend) + MongoDB. Features location-based routing, menu management, DJ/karaoke management, social wall, loyalty tokens, merchandise, and admin dashboard.

## Core Architecture
- **Frontend:** React (CRA) at `/app/frontend/`, served on port 3000
- **Backend:** FastAPI at `/app/backend/`, served on port 8001 (proxied via /api)
- **Database:** MongoDB via MONGO_URL
- **Deployment:** Kubernetes with supervisor-managed services

## Backend Structure (Modular Routers)
```
server.py (199 lines) — App creation, media serving, scheduler, router registration
database.py (171 lines) — Shared DB, helpers (download_image, create_woocommerce_order)
routes/
  auth.py — Authentication, admin login, Google OAuth
  admin.py — Settings, stats, loyalty, contacts, people, notifications, moderation
  menu.py — Menu items CRUD, category styles, bulk ops, uploads (with location fallback)
  content.py — Homepage, page content, daily specials, weekly videos, specials, social links, Instagram
  social.py — Check-in, social wall posts, DMs, gallery
  user.py — User profiles, tokens, transfers, cashout, staff, history, gallery submissions
  locations.py — Locations CRUD, seed, promo videos
  merchandise.py — WooCommerce products, cart checkout
  dj.py — DJ profiles, karaoke, song requests, tipping
  events.py — Events CRUD, AI flyer reader
  careers.py — Job applications
  payments.py — Stripe payments
  wall.py — Social wall v2, chat, DMs
  stream.py — Live streaming
```

## Key Technical Decisions
- **Menu location fallback:** When `GET /api/menu/items?location_slug=X` finds no items for that slug, it falls back to global items (no slug). This ensures databases with only global items still work.
- **Admin auth:** `adminHeaders()` / `adminJsonHeaders()` centralized in api.js (51 occurrences fixed from raw `token` references).
- **Service worker:** v2.4.0 with critical update flag for forced cache refresh.

## Implemented Features
- Multi-location restaurant directory with geolocation
- Full menu system with local image storage (frontend/public/images/)
- DJ/Karaoke management with live check-in status
- Social Wall with group chat and DMs
- Push notifications (VAPID)
- F&F Token economy (purchase, transfer, spend, tip)
- Staff cashout system
- WooCommerce merchandise integration
- Admin dashboard with 18+ management tabs
- PWA install/refresh functionality
- AI-powered event creation from flyers (OpenAI GPT-4 Vision)
- DJ schedule bulk import with auto-publish to social wall

## 3rd Party Integrations
- Stripe (Payments)
- WooCommerce (Merchandise)
- Hostinger SMTP (Email)
- OpenAI GPT-4 Vision (AI Flyer Reader) via emergentintegrations
- APScheduler (Background tasks)
- **LiveKit Cloud (WebRTC live streaming — DJ Go Live)** [Feb 2026]

## Completed Tasks
### March 2026 Session 1
- [x] DJ Schedules Frontend Fix
- [x] Dead Code Removal (AdminTabs.jsx)
- [x] PWA Cache Refresh
- [x] DJ Schedule Bulk Import + Auto-Publish
- [x] Signature Cocktails Menu Update
- [x] Local Image Migration (MongoDB → filesystem)
- [x] Menu Display Sync Fix
- [x] api.js Code Quality Sweep (dead functions removed)

### March 2026 Session 2
- [x] Complete server.py refactoring: 3839 → 199 lines (14 routers)
- [x] Fixed api.js adminHeaders bugs (undefined token, recursion)
- [x] Added menu images: 2 Tacos, Catfish Nuggets & Fries
- [x] Service worker v2.4.0 + critical update flag
- [x] Fixed missing getVapidPublicKey() function
- [x] Fixed SMTP_PASSWORD .env quoting
- [x] **Menu location fallback** — backend returns global items when no location-specific items exist (fixes live site mock data issue)
- [x] **Admin token fix** — replaced 51 raw `Bearer ${token}` with centralized helpers
- [x] **Global location filter** — added "Global (All Locations)" to admin dashboard
- [x] All regression tests passing (iteration_46, iteration_47)

### April 2026 Session
- [x] Check-in Page Redesign (Client vs Staff flow)
- [x] Sandwich toppings: Fried Egg $3, Sauteed Mushrooms $3, sorted high-to-low
- [x] Guest mode for Social Wall (name-only entry, no signup required)
- [x] Karaoke signup banner on Feed tab when DJ activates karaoke
- [x] Fixed karaoke auto_activated flag bug in manual toggle
- [x] Ground Turkey Burger image compressed (7.9MB → 566KB)
- [x] Auto-seed: locations + full menu (187 items) on empty DB startup
- [x] Code quality: XSS protection (DOMPurify), empty catch blocks fixed, test secrets removed, database.py refactored
- [x] Renamed cocktail "Fin-A-Rita" → "Rodeo Drive" (seed_menu.json, mockData.js, MongoDB, image swap to /images/cocktails/Rodeo-Drive.jpg)

### February 2026 Session (LiveKit)
- [x] **DJ Go Live — LiveKit Cloud integration** (replaces broken WebSocket+MediaRecorder+MediaSource DIY streaming). Works reliably on iOS Safari, Android Chrome, and desktop. Supports audio + video, ~50-100 viewers per stream.
  - New backend router `/app/backend/routes/livekit.py` with endpoints: `POST /api/livekit/token`, `POST /api/livekit/stream/start`, `POST /api/livekit/stream/stop`, `GET /api/livekit/stream/status/{slug}`, `GET /api/livekit/streams/active`
  - New frontend component `/app/frontend/src/components/LiveKitStream.jsx` — exports `LiveKitBroadcaster` (DJ side) and `LiveKitViewer` (audience side)
  - DJPanelPage `/dj` — "Go Live with Camera" now uses LiveKit with mic/cam toggles + camera flip
  - SocialWallPage Live tab — auto-detects `livekit://` URL scheme and renders LiveKitViewer
  - LinkTreeHomePage — polls `/api/livekit/streams/active` for the "DJ Live" banner
  - Env vars added: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
  - Room name = location_slug; slug sanitization consistent across all endpoints (regex `[^a-z0-9-]+`)
  - Tested: 14/14 backend tests pass (iteration_49)
- [x] **Zoom-style multi-camera stage** — viewers tap "Join with Camera" to hop on-stage with their own camera. Cap enforced server-side at **9 total publishers** (DJ + 8 guests) per room.
  - New `guest` role in `/api/livekit/token`; publisher count enforced via LiveKit RoomServiceClient
  - Frontend `StageGrid` renders 1/2/3-column adaptive video grid with per-tile name labels
  - Guest join/leave without losing stream connection (token re-fetched, `LiveKitRoom` remounted via `key` prop)
  - Tested: 26/26 backend tests pass (iteration_50; 12 new + 14 regression)
- [x] **Unified Login + Check-In flow** — replaced the old multi-step /checkin page + WelcomePopup modal + DJ Panel's two screens with **single-screen forms**. Users now see name + location + role on one screen and submit once.
  - `/login` and `/checkin` both render the unified `CheckInPage` (name + location dropdown + Guest/Staff toggle, with 5-icon staff role picker inline)
  - DJ Panel merged its "enter name" and "pick location" screens into one — tap a preset name (or type one) + tap a location and both `/api/dj/login` + `/api/dj/checkin` fire together
  - LinkTreeHomePage no longer auto-opens the legacy WelcomePopup modal
  - Tested: 10/10 frontend flows pass (iteration_51)
- [x] **DJ Unified Wall View → Universal Unified Wall** — the check-in wall is now merged across ALL locations for every user (guests + DJs). Location tags render next to every name so users always know which spot each post/message/DM came from.
  - Backend: `/api/wall/posts/all`, `/api/wall/chat/all`, `/api/wall/users/all` return items across every location. DM messages now store `from_location_slug` and `to_location_slug`; conversations pipeline projects `partner_location_slug`.
  - Frontend: `SocialWallPage` FeedTab/ChatTab/DMs always hit `/wall/*/all`; `LocationTag` renders unconditionally next to every name. Guests still POST to their currently-checked-in location.
- [x] **CheckInPage / Login / SignupForm simplification** — removed the role toggle from check-in and moved it to the user profile. Check-in and signup are now the same lightweight flow (name + email + phone + location).
- [x] **Passwordless Email Magic-Link Sign-In** — returning users can tap "Email me a sign-in link instead" on the check-in page; a real email is delivered via Hostinger SMTP with a `/auth/verify?token=…` link. Single click signs them into their profile and routes to `/dj` (staff DJ) or `/checkin` (guest). Tokens are single-use with a 30-minute TTL.
- [x] **Homepage Check-In consolidation** — removed the tiny top-right "Log In" pill and replaced the mixed "My Account / Check In !" button with a single big red **Check In** button (matches Select Location / Order Online styling). Routes to `/checkin` regardless of sign-in state. iteration_58, 5/5 pass.
- [x] **Live Check-In Counter Badge** — the homepage Check In button now shows a small live pill (`data-testid=checkin-count-badge`) with the total number of currently-checked-in guests across every location. Pill has a pulsing white dot for live-feel. Backend endpoint `GET /api/checkins/count[?location_slug=X]` returns the count after purging expired check-ins. Polls every 30s. iteration_59, 100% pass (5/5 backend, 3/3 frontend).
- [x] **Prominent "END LIVE" button** — the LiveKit PublisherControls previously had the stop control as a tiny X icon inside a 4-col grid. Refactored to a 3-col icon row (mic / cam / flip) with a full-width red "END LIVE" button below. Guests who joined the stage see the same button labeled "Leave Stage" (isHost=false). iteration_60, 100% pass.
- [x] **Confirm End Live** — DJ host taps END LIVE → an inline red-tinted mini-dialog appears with "Keep Broadcasting / End Live" so a fat-finger doesn't kill a set. Guest publishers still get one-tap Leave Stage. iteration_61, 100% pass.
- [x] **Admin DJ Control Tab** — new tab in the Admin Dashboard (`/dashboard` → "DJ Control") for staff to oversee every DJ from one place.
- [x] **Emergency Broadcast (Admin)** — admins can push a one-tap message to every location's Vibe Wall from the top of the DJ Control tab (e.g. "Free shots at Edgewood in 10 min!"). New `POST /api/admin/wall/emergency-broadcast` fan-outs the post; each entry is tagged `is_emergency=true` and renders with an amber ⚠ Emergency badge (distinct from the red Megaphone DJ broadcasts). Two-step confirm UX prevents accidental fires. iteration_63, 100% pass (backend 6/6, frontend all criteria).
- [x] **DJ Live Banner Admin Toggle** — new `dj_live_banner_enabled` app-setting (default true) with a switch on the Admin DJ Control tab. When OFF, the homepage suppresses the "DJ IS LIVE — WATCH NOW" banner even if a DJ is streaming. Frontend polls `/api/settings` every 30s so the banner hides ~within 30s of a toggle. iteration_64, 100% pass (backend 4/4 pytest, frontend all criteria).
- [x] **Homepage Modules Admin Panel** — extended the single DJ Live toggle into a 5-switch admin panel on the DJ Control tab. Each toggle maps to a public app-setting flag that gates one homepage element:
- [x] **L: On/Off Live Toggle** — replaced the conditional "Stop Live" button in the Admin DJ Control tab with a persistent per-DJ L: On/Off toggle right before the K: On/Off karaoke toggle. Red + enabled when a DJ is broadcasting (click stops the stream); grey + disabled when not live (DJs still start their own stream from the DJ Panel). iteration_66, 100% pass.

  - `dj_live_banner_enabled` — "DJ IS LIVE" banner
  - `karaoke_signup_banner_enabled` — Live Karaoke Sign-Up CTA
  - `song_request_banner_enabled` — DJ song request button
  - `marietta_coming_soon_enabled` — Orange Marietta banner
  - `featured_events_enabled` — Featured Events image grid
  - Changes go live within ~30s via polling. iteration_65, 100% pass (backend 5/5 pytest, frontend all criteria + full end-to-end verification of DOM gating).



  - Sections: **On Shift** (checked-in DJs — shows live/karaoke badges + Stop Live, Karaoke toggle, Check Out buttons) and **Off Shift** (Check In button expands to a per-location picker).
  - Force-end live calls `/api/livekit/stream/stop`. Check Out clears `current_location` (and stops any active stream first). Check In posts to `/api/dj/checkin/{id}`. Karaoke posts to `/api/karaoke/toggle/{slug}`.
  - Auto-refreshes every 15 seconds; header shows counts "X on shift · Y live · Z off shift".
  - Tested: 100% (iteration_62) — backend 7/7 pytest, frontend all criteria pass.





  - Backend: new `POST /api/auth/magic-link` (upserts profile + sends email + returns single-use token) and `POST /api/auth/magic-link/verify` (410 on reuse/expiry, 404 on invalid). Tokens stored in `magic_link_tokens` collection.
  - Frontend: new `MagicLinkVerifyPage` at `/auth/verify`; CheckInPage has an "Email me a sign-in link instead" link + status toast.
  - Tested: 16/18 pass (iteration_57) — backend 8/8 real SMTP delivery, frontend 8/10 (2 non-bug spec mismatches: disabled-button UX is cleaner than the spec said, and the auto-redirect happens faster than the assertion timing — both confirmed working).

  - `CheckInPage` (renders at both `/checkin` and `/login`): only asks name, optional email, optional phone, location. On submit, if email is provided the flow either logs the user into their existing profile or creates a new one — no password ever. Auto-routes to `/dj` if the saved profile has `staff_title === 'dj'`, otherwise to `/social/{slug}`.
  - `MyAccountPage`: new "My Role" section with 6 buttons (Guest / DJ / Bartender / Server / Cook / Manager). Selecting a staff role writes `role` + `staff_title` on the profile via `PUT /api/user/profile/{id}`.
  - `SignupForm` (email-signup mode): dropped username, password, confirm-password, show-password toggle. Now only name + email + phone. Uses the existing password-less `handleQuickSignup` path.
  - Tested: 26/26 pass (iteration_56, 100%) — backend 6/6, frontend 20/20 including role-based routing.

  - Broadcast toggle remains DJ-only.
  - Tested: iteration_53 (DJ view), iteration_55 (universal for guests) — 100%.
- [x] **Post-to-All-Locations Broadcast** — DJs can toggle "Reply to all locations" on the feed composer. A single post fans out to every active Fin & Feathers feed (currently 8 non-hibachi locations), each tagged with a red BROADCAST badge and linked by a shared `broadcast_id`.
  - Backend: `POST /api/wall/posts` accepts `broadcast_all`; validates either `dj_profiles.id` OR `user_profiles` with role/staff_title='dj'. Fans out gallery items for photo broadcasts too. 403 for non-DJs.
  - Frontend: FeedTab shows the toggle only when `isDJ`; broadcast payload uses `ff_dj_profile.id` so guest-shell IDs don't trigger a 403. Green success toast + red BROADCAST badge on broadcasted posts.
  - Tested: backend 5/5 pytest (test_wall_broadcast.py), frontend Playwright 7/7 (iteration_54, 100%).



## Backlog
- [ ] Per-Location Weekly Specials management (P2)
- [ ] WordPress Integration (P2)
- [ ] Apple Sign-In Integration (P2)
- [ ] Merchandise Store Enhancements (P2)
