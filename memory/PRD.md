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

## Core Requirements

### Completed Features (December 2025 - February 2026)

#### Homepage (LinkTreeHomePage.jsx)
- [x] Official Fin & Feathers logo
- [x] Daily video carousel for weekly specials
- [x] Navigation buttons: View Full Menu, Find a Location, Order Online, Gallery, Leave a Review
- [x] Contact information section
- [x] Loyalty program signup form
- [x] Social media links (Instagram, Facebook, Twitter)
- [x] Social feed grid with lightbox view (now using actual F&F images)
- [x] **Admin inline editing** - Edit tagline, contact info, and social feed images directly on homepage
- [x] **Drag-and-drop reordering** for social feed images in edit mode

#### Gallery Page (GalleryPage.jsx) - Added February 2026
- [x] Photo and video gallery with category filters (All, Photos, Videos, Food, Ambiance, Drinks)
- [x] Responsive 4-column grid layout
- [x] Lightbox modal for full-screen viewing
- [x] Video playback in lightbox with controls
- [x] Navigation back to homepage
- [x] Updated with actual Fin & Feathers restaurant images
- [x] **Admin-managed gallery** - Fetches from API with fallback to default images

#### Admin Panel - Gallery Management (Added February 2026)
- [x] Gallery tab in admin navigation
- [x] Add Image form with title, category, image URL fields
- [x] Image upload support (5MB max, JPG/PNG/GIF/WEBP)
- [x] Edit existing gallery items
- [x] Toggle visibility (show/hide from public gallery)
- [x] Delete gallery items with confirmation
- [x] **Drag-and-drop reordering** with @dnd-kit library
- [x] Auto-save order on drag end

#### Location Ordering (Updated February 2026)
- [x] Locations now sorted by distance from user when geolocation is enabled
- [x] **Migrated locations to backend database** - All location data now stored in MongoDB
- [x] Admin can manage locations via Admin Panel > Locations tab
- [x] CRUD operations: Create, Read, Update, Delete locations
- [x] Toggle location visibility (show/hide from public)
- [x] Each location includes: name, slug, address, phone, hours, coordinates, image, specials, social links
- [x] All 8 locations have **ToastTab Order Online URLs**:
  - Edgewood: https://order.toasttab.com/online/fin-feathers-edgewood-2nd-location-345-edgewood-ave-se
  - Midtown: https://www.toasttab.com/local/order/fin-feathers-midtown-1136-crescent-ave-ne
  - Douglasville: https://order.toasttab.com/online/fins-feathers-douglasville-7430-douglas-blvd-zmrgr
  - Riverdale: https://www.toasttab.com/local/order/fin-feathers-riverdale-6340-ga-85
  - Valdosta: https://www.toasttab.com/local/order/fin-feathers-valdosta-1700-norman-drive
  - Albany: https://www.toasttab.com/local/order/fin-and-feathers-albany-llc
  - Stone Mountain: https://www.toasttab.com/local/order/fin-feathers-stone-mountain-5469-memorial-drive
  - Las Vegas: https://www.toasttab.com/local/order/fin-feathers-las-vegas-1229-s-casino-center-blvd

#### Menu Page (MenuPage.jsx) - Updated February 2026
- [x] Category-based filtering
- [x] Multiple layout types per category (large cards, compact cards, line items)
- [x] **Actual Fin & Feathers images** from finandfeathersrestaurants.com
- [x] Line items for items without images (Daily Specials, Sides, Cocktails, Brunch Sides)
- [x] Market price (MKT) display for Lobster items
- [x] Badge system (Spicy, Vegetarian, Chef's Special)

#### Locations Page (LocationsPage.jsx)
- [x] 7 restaurant locations displayed
- [x] Hours, phone, address for each
- [x] Order online and reservation buttons
- [x] Navigation to detail pages

#### Location Detail Pages (LocationDetailPage.jsx) - Updated February 2026
- [x] Individual pages for each location
- [x] Contact info and social media
- [x] Weekly specials display
- [x] Embedded Google Maps with directions
- [x] **Social Check-In System:**
  - [x] Check-in with display name, emoji avatar, mood selection
  - [x] "Who's Here" section showing checked-in users
  - [x] Check-out functionality
- [x] **Social Wall:**
  - [x] Post messages and pictures to other guests
  - [x] Like/unlike posts
  - [x] Delete own posts
  - [x] Real-time refresh every 15 seconds
- [x] **Direct Messages (DMs):**
  - [x] Tap on a user to open DM conversation
  - [x] Full chat thread with read receipts
  - [x] Unread message count badge
  - [x] Conversation list
- [x] **DJ Tipping:**
  - [x] "Tonight's DJ Tips" total display
  - [x] Quick tip amounts ($1, $3, $5, $10, $20) or custom
  - [x] Add message and song request to tip
  - [x] Recent tips feed

#### Admin Dashboard (AdminPage.jsx) - COMPLETED December 15, 2025
- [x] JWT-based authentication (username: admin, password: admin)
- [x] Protected routes with Bearer token
- [x] Dashboard with statistics overview
- [x] **Post Special** - Create promotions that auto-send push notifications to all app users
- [x] **Location-based Specials** - Filter and assign specials to specific locations
- [x] **Edit Specials** - Update existing specials with title, description, location, image
- [x] **Image Lightbox** - Click to view special images large
- [x] **Specials by Location Summary** - Overview showing counts per location
- [x] **Social Media Links** - Manage Instagram, Facebook, TikTok links
- [x] **Instagram Feed** - Add posts to display on homepage
- [x] Loyalty Members management (view, delete)
- [x] Contact form submissions (view, update status)
- [x] Menu Items CRUD (create, read, update, delete)
- [x] **Image Upload for menu items** (JPG, PNG, GIF, WebP up to 5MB)
- [x] Push Notifications (send to all subscribers, view history)
- [x] Logout functionality
- [x] **Users Tab** - View all user profiles with token balances
- [x] **Gift Tokens** - Admin can gift F&F tokens to any user with optional message
- [x] **Role Management** - Admin can change user roles (customer/staff/management)
- [x] **Cashout Processing** - View and approve/reject staff cashout requests
- [x] **Role Filter** - Filter users by role type

#### My Account Feature (MyAccountPage.jsx) - COMPLETED February 2026
- [x] **Profile Management:**
  - [x] View/edit name, phone, email
  - [x] **Profile photo/selfie upload** (JPG, PNG, GIF, WebP up to 5MB)
  - [x] Avatar emoji picker (12 options - fallback if no photo)
  - [x] Birthdate and anniversary date fields
  - [x] Special dates (add/remove with name + date)
  - [x] Social media handles (Instagram, Facebook, Twitter, TikTok)
- [x] **Role-Based Access System:**
  - [x] Admin - Full access
  - [x] Management - Can gift tokens, view users, no system settings
  - [x] Staff - Collect tips, cash out at 80% after $20 min, transfer tips to personal
  - [x] Customer - Loyalty account, gift drink tokens, tip staff
  - [x] Role badges display in profile and admin panel
  - [x] Tokens work across all locations
- [x] **F&F Tokens System ($1 = 10 tokens):**
  - [x] Token balance display in header
  - [x] Quick purchase buttons ($1, $5, $10, $20)
  - [x] Custom amount input
  - [x] Token purchase history
  - [x] Used for DJ tipping and sending drinks
  - [x] Token transfers between users
- [x] **Staff Earnings Tab (staff role only):**
  - [x] Tips earned display (cashout_balance)
  - [x] Total lifetime earnings tracking
  - [x] Cash out at 80% rate (minimum $20)
  - [x] Transfer tips to personal token balance
  - [x] Cashout history
- [x] **Tip Staff Tab (all users):**
  - [x] Browse and select staff to tip
  - [x] Quick tip amounts (10, 20, 50, 100 tokens)
  - [x] Custom tip with message
  - [x] Transfer history
- [x] **Photos Tab:**
  - [x] Submit photos to gallery (auto-approved)
  - [x] View own submissions
- [x] **History Tab:**
  - [x] Visit/check-in count
  - [x] Post count
  - [x] Photo submission count
- [x] "My Account" button on homepage (amber gradient)

#### PWA Features
- [x] Service worker registered
- [x] Manifest.json configured
- [x] Install prompt component
- [x] Push notification subscription

### Backend API Endpoints

#### Public Endpoints
- `POST /api/loyalty/signup` - Sign up for loyalty program
- `POST /api/contact` - Submit contact form
- `GET /api/push/public-key` - Get VAPID public key

#### Admin Endpoints (Protected)
- `POST /api/auth/login` - Admin login (returns JWT)
- `GET /api/auth/me` - Get current admin info
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/loyalty-members` - List loyalty members
- `DELETE /api/admin/loyalty-members/{id}` - Delete member
- `GET /api/admin/contacts` - List contact submissions
- `PATCH /api/admin/contacts/{id}` - Update contact status
- `GET /api/admin/menu-items` - List menu items (from DB)
- `POST /api/admin/menu-items` - Create menu item
- `PUT /api/admin/menu-items/{id}` - Update menu item
- `DELETE /api/admin/menu-items/{id}` - Delete menu item
- `POST /api/admin/upload` - Upload image file (returns URL)
- `GET /api/admin/uploads` - List uploaded files
- `DELETE /api/admin/uploads/{filename}` - Delete uploaded file
- `POST /api/admin/notifications/send` - Send push notification
- `GET /api/admin/notifications/history` - Notification history
- `GET /api/admin/specials` - List all specials
- `POST /api/admin/specials` - Create special + auto send notification
- `PUT /api/admin/specials/{id}` - Update special
- `DELETE /api/admin/specials/{id}` - Delete special
- `POST /api/admin/specials/{id}/notify` - Resend notification
- `GET /api/admin/social-links` - List social links
- `POST /api/admin/social-links` - Add social link
- `PUT /api/admin/social-links/{id}` - Update social link
- `DELETE /api/admin/social-links/{id}` - Delete social link
- `GET /api/admin/instagram-posts` - List Instagram feed posts
- `POST /api/admin/instagram-posts` - Add Instagram post
- `PUT /api/admin/instagram-posts/{id}` - Update Instagram post
- `DELETE /api/admin/instagram-posts/{id}` - Delete Instagram post
- `GET /api/admin/gallery` - List all gallery items (including hidden)
- `POST /api/admin/gallery` - Add gallery item
- `PUT /api/admin/gallery/{id}` - Update gallery item
- `DELETE /api/admin/gallery/{id}` - Delete gallery item
- `GET /api/admin/users` - List all user profiles
- `POST /api/admin/tokens/gift` - Gift tokens to a user

#### User Profile Endpoints (February 2026)
- `POST /api/user/profile` - Create user profile
- `GET /api/user/profile/{id}` - Get user profile by ID
- `GET /api/user/profile/by-email/{email}` - Get user profile by email
- `PUT /api/user/profile/{id}` - Update user profile
- `POST /api/user/profile/{id}/photo` - Upload profile photo/selfie
- `POST /api/user/tokens/purchase/{id}` - Purchase tokens ($1 = 10 tokens)
- `GET /api/user/tokens/balance/{id}` - Get token balance
- `GET /api/user/tokens/history/{id}` - Get token purchase/gift history
- `POST /api/user/tokens/spend/{id}` - Spend tokens (tips/drinks)
- `POST /api/user/tokens/transfer/{id}` - Transfer tokens to another user
- `GET /api/user/tokens/transfers/{id}` - Get transfer history
- `POST /api/user/gallery/submit/{id}` - Submit photo to gallery
- `GET /api/user/gallery/submissions/{id}` - Get user's gallery submissions
- `GET /api/user/history/visits/{id}` - Get visit history
- `GET /api/user/history/posts/{id}` - Get post history

#### Staff Endpoints (February 2026)
- `GET /api/staff/list` - Get list of staff for tipping
- `POST /api/staff/cashout/{id}` - Request cashout (min $20, 80% rate)
- `GET /api/staff/cashout/history/{id}` - Get cashout history
- `POST /api/staff/transfer-to-personal/{id}` - Transfer tips to token balance

#### Admin Role Management (February 2026)
- `POST /api/admin/users/role` - Update user role
- `GET /api/admin/cashouts` - View all cashout requests
- `PUT /api/admin/cashouts/{id}` - Process cashout request

#### Location Endpoints (February 2026)
- `GET /api/locations` - Get all active locations (public)
- `GET /api/locations/{slug}` - Get single location by slug (public)
- `GET /api/admin/locations` - Get all locations including inactive (admin)
- `POST /api/admin/locations` - Create new location (admin)
- `PUT /api/admin/locations/{id}` - Update location (admin)
- `DELETE /api/admin/locations/{id}` - Delete location (admin)
- `POST /api/admin/locations/reorder` - Reorder locations (admin)
- `POST /api/admin/locations/seed` - Seed initial location data (admin, one-time)

#### Public Gallery Endpoint
- `GET /api/gallery` - Get active gallery items (is_active=true only)

## Tech Stack
- **Frontend**: React, React Router, TailwindCSS, Shadcn UI
- **Backend**: FastAPI, MongoDB (Motor), Pydantic
- **Auth**: JWT (python-jose), bcrypt 3.2.2 (passlib 1.7.4) - **FIXED Feb 2026**: Downgraded bcrypt to 3.2.2 to fix passlib compatibility issue
- **PWA**: Service Workers, Web Push API (pywebpush)

## Database Schema
- `loyalty_members`: id, name, email, phone, marketing_consent, push_subscription, created_at
- `contact_forms`: id, name, email, phone, message, status, created_at
- `menu_items`: id, name, description, price, category, image, badges
- `push_notifications`: id, title, body, icon, image, url, sent_to, sent_at
- `gallery_items`: id, title, image_url, category, is_active, display_order, created_at, submitted_by_user
- `user_profiles`: id, name, phone, email, avatar_emoji, birthdate, anniversary, special_dates[], social_handles, token_balance, total_visits, total_posts, total_photos, created_at, updated_at
- `token_purchases`: id, user_id, amount_usd, tokens_purchased, payment_method (card/stripe/gift), stripe_session_id, gifted_by, message, created_at
- `user_gallery_submissions`: id, user_id, user_name, image_url, caption, location_slug, created_at
- `payment_transactions`: id, session_id, user_id, amount, currency, tokens, package_id, payment_status (pending/paid/expired), created_at, updated_at

## Known Limitations / Mocked Data
1. **PWA Icons**: Not optimized for all device sizes
2. **Photo Gallery Submissions**: Auto-approved without moderation

## Bug Fixes & Completed Features (February 2026)
- **FIXED**: Deployment blocker - `AttributeError: module 'bcrypt' has no attribute '__about__'` resolved by downgrading bcrypt to 3.2.2
- **VERIFIED**: Location detail pages working correctly (blank page issue not reproducible)
- **COMPLETED**: Location data migration from mockData.js to MongoDB backend
- **COMPLETED**: Stripe payment integration for token purchases (Feb 18, 2026)
- **COMPLETED**: WooCommerce merchandise store integration (Feb 18, 2026)
- **COMPLETED**: Promo video management via admin panel (Feb 18, 2026)
- **COMPLETED**: MenuPage already connected to backend API (97 items in DB)

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Admin dashboard with authentication
- [x] Deployment dependency issue (bcrypt/passlib)
- [x] Migrate locations data from mockData.js to backend/admin panel
- [x] Stripe payment integration for token purchases
- [x] Connect MenuPage.jsx to backend API (already done - 97 items from DB)
- [x] Promo video management via admin panel
- [x] WooCommerce merchandise store integration

### P1 (High Priority) - All Done!
- [x] Video upload and management via admin panel
- [x] Merchandise page with WooCommerce integration

### P2 (Medium Priority)
- [x] Geolocation for sorting locations by proximity (implemented)
- [ ] Location-specific weekly specials management (per-location from admin)
- [ ] PWA icon optimization

### P3 (Low Priority)
- [ ] Email notifications for new loyalty signups
- [ ] Analytics dashboard for admin
- [ ] Multi-admin user support

## New API Endpoints (Feb 18, 2026)
- `GET /api/merchandise` - Fetch products from WooCommerce
- `GET /api/merchandise/{id}` - Fetch single product
- `GET /api/promo-videos` - Get all active promo videos
- `GET /api/promo-videos/by-day/{day}` - Get videos for specific day (0-6)
- `GET /api/admin/promo-videos` - Admin: Get all videos
- `POST /api/admin/promo-videos` - Admin: Create video
- `PUT /api/admin/promo-videos/{id}` - Admin: Update video
- `DELETE /api/admin/promo-videos/{id}` - Admin: Delete video

## 3rd Party Integrations
- **Stripe**: Token purchases with real payment processing
- **WooCommerce**: Live product feed from finandfeathersrestaurants.com

## Credentials
- **Admin Login**: username=`admin`, password=`admin`

## Preview URL
https://dine-connect-51.preview.emergentagent.com
