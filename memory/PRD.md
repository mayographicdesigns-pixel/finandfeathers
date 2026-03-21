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
- **Customer**: Wants to browse menu, find locations, sign up for loyalty program
- **Job Applicant**: Wants to apply for positions at the restaurant

## Core Requirements

### Completed Features

#### DJ Tipping System - NEW (March 21, 2026)
- [x] Tipping option added to "Request a Song" flow
- [x] After song submission, tipping step appears with preset Stripe amounts ($3, $5, $10, $20) + custom
- [x] DJ personal payment links (CashApp, Venmo, Zelle) shown if configured
- [x] DJs can manage their payment links from the DJ Panel dashboard
- [x] "Skip" tipping option available
- [x] Backend APIs: POST /api/dj/tip/stripe-checkout, POST /api/dj/tip/record
- [x] Stripe webhook extended for dj_tip type
- [x] GET /api/dj/at-location now returns payment link fields

#### Account Page Bug Fix (March 21, 2026)
- [x] Fixed .json error on My Account page after welcome popup registration
- [x] Root cause: UserProfileResponse model missing `updated_at` default for quick-register profiles
- [x] Added safe JSON parsing (try/catch) for all auth API error responses
- [x] Welcome popup now saves profile ID to localStorage for seamless account access
- [x] Email case-insensitive lookup for profile by email
- [x] Better error messages for users without password (not just "use Google login")

#### DJ Schedule System (March 2026)
- [x] 22 schedule entries across 4 locations (Stone Mountain, Douglasville, Valdosta, Midtown)
- [x] 13 DJs profiled with login buttons
- [x] DJ weekly schedule summary and location check-in

#### Karaoke System (March 2026)
- [x] DJ Panel page at /dj with login, location select, karaoke toggle, and queue management
- [x] Homepage shows "Karaoke Sign Up" / "Request a Song" contextually
- [x] Check-in page shows same contextual buttons

#### User Role System (March 2026)
- [x] Welcome popup role selector: Customer, Server, Bartender, Manager, DJ
- [x] Roles saved to user_profiles

#### Careers Page (March 2026)
- [x] Multi-step job application form with admin dashboard
- [x] Email notifications via Hostinger SMTP

#### Events & Tickets System
- [x] Free Entry toggle, reservation flow, 40+ weekly events across 4 locations

#### Homepage (LinkTreeHomePage.jsx)
- [x] Full Linktree-style homepage with all features

### Upcoming Tasks
- (P1) Per-Location Weekly Specials management
- (P2) WordPress Integration
- (P2) Apple Sign-In Integration
- (P2) Merchandise Store Enhancements

### Refactoring Needed
- server.py is 6000+ lines — should be split into feature-specific routers

## Architecture
- Frontend: React (CRA) with Shadcn/UI, Tailwind CSS
- Backend: FastAPI with MongoDB (motor)
- File Storage: MongoDB (base64) + local disk
- Auth: JWT-based admin auth
- 3rd Party: Stripe, Hostinger SMTP, emergentintegrations (AI flyer reader)

## Key API Endpoints
- POST /api/careers/apply - Submit job application
- POST /api/dj/tip/stripe-checkout - Create Stripe tip checkout
- POST /api/dj/tip/record - Record external tip
- GET /api/dj/at-location/{slug} - Get DJ + payment links at location
- POST /api/dj/login - DJ login
- POST /api/karaoke/toggle - Toggle karaoke mode
- GET /api/user/profile/{id} - Get user profile
- GET /api/user/profile/by-email/{email} - Get profile by email
