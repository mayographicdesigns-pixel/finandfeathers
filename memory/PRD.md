# Fin & Feathers Restaurant Website - Product Requirements Document

## Original Problem Statement
Build a pixel-perfect clone of a restaurant website with the following features:
1. Linktree-style homepage with daily promotional video carousel
2. Menu page based on PDF content with specific layouts per category
3. Locations page listing all restaurants with detail pages
4. Admin dashboard with authentication and content management
5. PWA support with push notifications
6. Black background with red accent styling

## User Personas
- **Restaurant Owner/Admin**: Needs to manage menu items, view loyalty signups, send notifications
- **Customer**: Wants to browse menu, find locations, sign up for loyalty program, socialize
- **Job Applicant**: Wants to apply for positions at the restaurant

## Core Requirements

### Completed Features

#### Social Wall & Chat System - NEW (March 21, 2026)
- [x] Location-based Social Wall at `/social/:slug`
- [x] Feed tab: text posts, photo posts, song requests, shoutouts with likes and comments
- [x] Image upload for posts (up to 5MB)
- [x] Location group chat for real-time messaging
- [x] Direct messages between users with unread counts
- [x] DM conversations list with partner info and last message
- [x] New DM creation from list of active users at location
- [x] "My Account" button on homepage becomes "Social Wall" link when logged in
- [x] Settings icon on social wall navigates to /account for profile management
- [x] User location saved in localStorage during welcome popup
- [x] Backend APIs: /api/wall/posts, /api/wall/chat, /api/wall/dm, /api/wall/users
- [x] 30/30 backend tests passing

#### DJ Tipping System (March 21, 2026)
- [x] Tipping option after "Request a Song" flow
- [x] Preset Stripe amounts ($3, $5, $10, $20) + custom
- [x] DJ personal payment links (CashApp, Venmo, Zelle) shown if configured
- [x] DJs manage payment links from DJ Panel dashboard
- [x] Backend APIs: POST /api/dj/tip/stripe-checkout, POST /api/dj/tip/record

#### Account Page Bug Fix (March 21, 2026)
- [x] Fixed .json error on My Account page after welcome popup registration
- [x] Root cause: UserProfileResponse model missing `updated_at` default
- [x] Safe JSON parsing for all auth API error responses
- [x] Welcome popup saves profile ID to localStorage
- [x] Email case-insensitive lookup

#### DJ Schedule System (March 2026)
- [x] 22 schedule entries across 4 locations
- [x] 13 DJs profiled with login buttons

#### Karaoke System (March 2026)
- [x] DJ Panel at /dj with karaoke toggle and queue management
- [x] Dynamic homepage/check-in buttons based on karaoke/DJ status

#### User Role System (March 2026)
- [x] Welcome popup role selector: Customer, Server, Bartender, Manager, DJ

#### Careers Page (March 2026)
- [x] Multi-step job application form with admin dashboard and email notifications

#### Events & Tickets System
- [x] Free Entry toggle, reservation flow, 40+ weekly events

#### Homepage (LinkTreeHomePage.jsx)
- [x] Full Linktree-style homepage with all features

### Upcoming Tasks
- (P1) Per-Location Weekly Specials management
- (P2) WordPress Integration
- (P2) Apple Sign-In Integration
- (P2) Merchandise Store Enhancements

### Refactoring Needed
- server.py is 6400+ lines — should be split into feature-specific routers

## Architecture
- Frontend: React (CRA) with Shadcn/UI, Tailwind CSS
- Backend: FastAPI with MongoDB (motor)
- File Storage: MongoDB (base64) + local disk (/app/backend/uploads/)
- Auth: JWT-based admin auth
- 3rd Party: Stripe, Hostinger SMTP, emergentintegrations (AI flyer reader)

## Key API Endpoints
- POST /api/wall/posts - Create social wall post
- GET /api/wall/posts/{slug} - Get posts for location
- POST /api/wall/chat/{slug} - Send group chat message
- GET /api/wall/chat/{slug} - Get group chat messages
- POST /api/wall/dm - Send direct message
- GET /api/wall/dm/conversations/{user_id} - Get DM conversations
- GET /api/wall/dm/thread/{user_id}/{partner_id} - Get DM thread
- POST /api/dj/tip/stripe-checkout - Stripe tip checkout
- POST /api/dj/tip/record - Record external tip
- GET /api/dj/at-location/{slug} - Get DJ + payment links
- POST /api/careers/apply - Submit job application
- GET /api/user/profile/{id} - Get user profile
