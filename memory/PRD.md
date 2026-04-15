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
- [x] Check-in Page Redesign (Client vs Staff flow) — Premium dark UI with unique colored icons per staff role (DJ/Headphones, Bartender/Wine, Server/Utensils, Cook/ChefHat, Manager/Shield), smooth step transitions, location auto-detection, mobile responsive

## Backlog
- [ ] Per-Location Weekly Specials management (P2)
- [ ] WordPress Integration (P2)
- [ ] Apple Sign-In Integration (P2)
- [ ] Merchandise Store Enhancements (P2)
