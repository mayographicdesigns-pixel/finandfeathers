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

#### Karaoke System - NEW (March 2026)
- [x] DJ Panel page at /dj with login, location select, karaoke toggle, and queue management
- [x] DJ can toggle Karaoke Mode on/off per location
- [x] Guests submit name + song to join the karaoke queue
- [x] DJ sees live queue with position numbers, can mark songs as played/skipped
- [x] Recently sung songs shown below the queue
- [x] Homepage shows "Karaoke Live at [Location]!" button when karaoke is active
- [x] Check-in page shows "Request a Song" form when karaoke is active at nearest location
- [x] Public karaoke queue endpoint for location chat boards
- [x] Backend APIs: /api/dj/login, /api/karaoke/toggle, /api/karaoke/status, /api/karaoke/queue

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

### Pending/Future Tasks
- (P1) Per-Location Weekly Specials management
- (P1) Email/SMS for Free Tickets (needs 3rd-party credentials)
- (P1) Email notifications for job applications (needs email service: SendGrid/Resend)
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
