# Fin & Feathers Restaurant Website - Product Requirements Document

## Original Problem Statement
Build a comprehensive restaurant PWA with Linktree-style homepage, menu, locations, admin dashboard, DJ/karaoke management, social wall, careers, events, and more.

## Architecture
- Frontend: React (CRA) + Shadcn/UI + Tailwind CSS
- Backend: FastAPI + MongoDB (motor)
- File Storage: MongoDB (base64) + local disk (/app/backend/uploads/)
- Auth: JWT-based admin auth + Google OAuth
- 3rd Party: Stripe, Hostinger SMTP, emergentintegrations (AI flyer reader)

### Backend Router Structure (Refactored March 21, 2026)
```
/app/backend/
  server.py        (~5190 lines - core, auth, admin, events, payments, users, locations)
  database.py      (shared db, push_service, get_current_admin)
  models.py        (all Pydantic models)
  routes/
    wall.py        (social wall posts, chat, DMs, notifications)
    careers.py     (job applications, admin careers management)
    dj.py          (DJ profiles, karaoke, song requests, tipping, schedules)
```

## Completed Features

### Social Wall & Chat (March 21, 2026)
- [x] Location-based Social Wall at `/social/:slug`
- [x] Feed: text, photo, song request, shoutout posts with likes/comments
- [x] Location group chat
- [x] Direct messages with unread counts
- [x] "My Account" becomes "Social Wall" link when logged in
- [x] Settings icon for profile access

### Push Notifications (March 21, 2026)
- [x] In-app notification system (wall_notifications collection)
- [x] Notifications triggered on: likes, comments, DMs (different user only)
- [x] Bell icon with unread count badge in Social Wall header
- [x] Notifications panel with read/unread states
- [x] Mark all as read functionality
- [x] API: GET/POST /api/wall/notifications/*

### Server.py Refactoring (March 21, 2026)
- [x] Reduced from 6411 to ~5190 lines
- [x] Extracted routes/wall.py (~350 lines), routes/careers.py (~180 lines), routes/dj.py (~440 lines)
- [x] Created shared database.py module
- [x] All 23 regression tests passing

### DJ Tipping System (March 21, 2026)
- [x] Stripe card tips ($3/$5/$10/$20 + custom)
- [x] DJ payment links (CashApp/Venmo/Zelle)

### Account Page Bug Fix (March 21, 2026)
- [x] Fixed .json error from missing UserProfileResponse defaults
- [x] Safe JSON parsing in all auth API functions

### Earlier Features (Pre-fork)
- [x] Careers system with admin dashboard + email notifications
- [x] Karaoke & DJ Management (DJ Panel at /dj)
- [x] User Role System (welcome popup)
- [x] Events with free entry toggle, 40+ weekly events
- [x] AI Flyer Reader for events
- [x] Full homepage, menu, locations, admin dashboard

## Upcoming Tasks
- (P1) Per-Location Weekly Specials management
- (P2) WordPress Integration
- (P2) Apple Sign-In Integration
- (P2) Merchandise Store Enhancements

## Key API Endpoints
- /api/wall/* - Social wall, chat, DMs, notifications
- /api/dj/* - DJ profiles, karaoke, tipping, schedules
- /api/careers/* - Job applications
- /api/events - Events CRUD
- /api/locations - Locations
- /api/auth/* - Authentication
- /api/admin/* - Admin management
