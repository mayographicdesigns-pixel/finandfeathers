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

#### DJ Schedule System - NEW (March 2026)
- [x] 22 schedule entries across 4 locations (Stone Mountain, Douglasville, Valdosta, Midtown)
- [x] 13 DJs profiled: DJ Ron, DJ Tay, DJ Relevant, DJ PJO, DJ Flexxrated, DJ Yobz, DJ Venom, DJ Evrsince, DJ Aha, DJ Lavish, DJ 2Times, DJ DB, DJ RELLEDOTCOM
- [x] DJ login shows all scheduled DJ names as selectable buttons
- [x] After login, DJ sees personal weekly schedule summary
- [x] "Your Locations" section highlights scheduled locations with day/time
- [x] After check-in, full location schedule shown with DJ's own slot highlighted in red
- [x] Backend APIs: /api/dj/weekly-schedule, /api/dj/weekly-schedule/{slug}, /api/dj/weekly-schedule/names/all

#### Karaoke System - NEW (March 2026)
- [x] DJ Panel page at /dj with login, location select, karaoke toggle, and queue management
- [x] DJ can toggle Karaoke Mode on/off per location
- [x] Guests submit name + song to join the karaoke queue
- [x] DJ sees live queue with position numbers, can mark songs as played/skipped
- [x] Recently sung songs shown below the queue
- [x] Homepage shows "Karaoke Sign Up" button when karaoke is active
- [x] Homepage shows "Request a Song" button when DJ is present (no karaoke)
- [x] Check-in page shows "Karaoke Sign Up" / "Request a Song" contextually
- [x] Public karaoke queue endpoint for location chat boards
- [x] Backend APIs: /api/dj/login, /api/karaoke/toggle, /api/karaoke/status, /api/karaoke/queue

#### User Role System - NEW (March 2026)
- [x] Welcome popup includes "I am a..." role selector: Customer, Server, Bartender, Manager, DJ
- [x] Roles saved to user_profiles via POST /api/user/register
- [x] DJ role redirects to /dj panel after signup
- [x] Admin can see user roles for access control

#### Careers Page (CareersPage.jsx) - NEW (March 2026)
- [x] Multi-step job application form (3 steps)
- [x] Step 1: Candidate Information (Name, Email, Phone, Social Media)
- [x] Step 2: Role Selection (Location dropdown, Position with FOH/BOH categories, Availability grid)
- [x] Step 3: Document Uploads (Resume required, Headshot conditional on position)
- [x] Backend API: POST /api/careers/apply with file upload to MongoDB
- [x] Backend API: GET /api/admin/careers/applications (admin only)
- [x] Backend API: PATCH /api/admin/careers/applications/{id} (status update)
- [x] Backend API: DELETE /api/admin/careers/applications/{id} (delete)
- [x] Admin Dashboard "Careers" tab with application list, status filters, expandable details
- [x] Status workflow: new → reviewed → interviewed → hired/rejected
- [x] "We're Hiring - Apply Now" button on homepage under loyalty section
- [x] /careers route in App.js
- [x] Thank you page after successful submission
- [x] Location emails stored for future email notifications
- [x] Email notifications to info@, careers@, and location emails via Hostinger SMTP

#### Homepage (LinkTreeHomePage.jsx)
- [x] Official Fin & Feathers logo
- [x] Daily video carousel for weekly specials
- [x] Navigation buttons: View Full Menu, Find a Location, Order Online, Gallery, Leave a Review
- [x] Contact information section
- [x] Loyalty program signup form
- [x] Social media links (Instagram, Facebook, Twitter)
- [x] Social feed grid with lightbox view
- [x] Admin inline editing with drag-and-drop reordering
- [x] Events images grid (4 images)
- [x] Careers button under loyalty section

#### Events & Tickets System
- [x] Free Entry toggle in admin dashboard for events
- [x] Free events show "Reserve" button instead of "Get Tickets"
- [x] Free events show "FREE ENTRY" label on event cards
- [x] Reservation modal shows location's phone number + "Text to Reserve" SMS link
- [x] Pre-filled SMS message with event name, date, and time
- [x] "All Locations" events show all location phone numbers to choose from
- [x] Paid events still show normal ticket purchase flow via Stripe
- (P2) WordPress Integration
- (P2) Apple Sign-In Integration
- (P2) Merchandise Store Enhancements

## Location Emails (for future email notifications)
- Stone Mountain: stonemountain@finandfeathersrestaurants.com
- Midtown: midtown@finandfeathersrestaurants.com
- Edgewood: edgewood@finandfeathersrestaurants.com
- Douglasville: douglasville@finandfeathersrestaurants.com
- Valdosta: valdosta@finandfeathersrestaurants.com
- Albany: albany@finandfeathersrestaurants.com
- Riverdale: riverdale@finandfeathersrestaurants.com
- Las Vegas: lasvegas@finandfeathersrestaurants.com

## Architecture
- Frontend: React (CRA) with Shadcn/UI, Tailwind CSS
- Backend: FastAPI with MongoDB (motor)
- File Storage: MongoDB (base64) + local disk
- Auth: JWT-based admin auth
- Package Manager: npm (frontend), pip (backend)

## Key API Endpoints
- POST /api/careers/apply - Submit job application (multipart/form-data)
- GET /api/admin/careers/applications - List all applications (admin)
- GET /api/locations - Public locations list
- POST /api/loyalty/signup - Loyalty program signup
- GET /api/menu - Public menu items
