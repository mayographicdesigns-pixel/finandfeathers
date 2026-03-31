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
database.py (171 lines) — Shared DB connection, helpers (download_image, create_woocommerce_order)
routes/
  auth.py (687 lines) — Authentication, admin login, Google OAuth
  admin.py (430 lines) — Settings, stats, loyalty, contacts, people, notifications, moderation
  menu.py (482 lines) — Menu items CRUD, category styles, bulk ops, uploads
  content.py (430 lines) — Homepage, page content, daily specials, weekly videos, specials, social links, Instagram
  social.py (377 lines) — Check-in, social wall posts, DMs, gallery
  user.py (866 lines) — User profiles, tokens, transfers, cashout, staff, history, gallery submissions
  locations.py (480 lines) — Locations CRUD, seed, promo videos
  merchandise.py (226 lines) — WooCommerce products, cart checkout
  dj.py (732 lines) — DJ profiles, karaoke, song requests, tipping
  events.py (280 lines) — Events CRUD, AI flyer reader
  careers.py (178 lines) — Job applications
  payments.py (333 lines) — Stripe payments
  wall.py (388 lines) — Social wall v2, chat, DMs
  stream.py (172 lines) — Live streaming
```

## Implemented Features
- Multi-location restaurant directory with geolocation
- Full menu system with local image storage (all images in frontend/public/images/)
- DJ/Karaoke management with live check-in status
- Social Wall with group chat and DMs
- Push notifications
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

## Completed Tasks (Latest Session — March 2026)
- [x] Complete server.py refactoring: 3839 → 199 lines (14 feature routers)
- [x] Fixed api.js token auth bugs (verifyAdminToken, adminHeaders recursion)
- [x] All 25 API endpoint regression tests passing
- [x] Frontend loads correctly after refactoring

## Backlog
- [ ] Per-Location Weekly Specials management (P2)
- [ ] WordPress Integration (P2)
- [ ] Apple Sign-In Integration (P2)
- [ ] Merchandise Store Enhancements (P2)
