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
- [x] **Unified button colors** - All buttons now use consistent red styling (Feb 2026)
- [x] **"Latest from Our Feed" repositioned** - Now between Gallery and Merch Shop buttons

#### Menu Page (MenuPage.jsx)
- [x] Category filters for all menu sections
- [x] Card and line-item layouts based on category type
- [x] Menu images for Starters, Seafood & Grits, Sandwiches, Salads, Brunch, Entrees (Feb 2026)
- [x] **Admin inline editing** - Edit menu items directly from the page when logged in as admin (Feb 2026)
- [x] Admin bar with Edit Menu, Add Item, Dashboard, Logout buttons
- [x] Edit modal for modifying item name, description, price, category, image
- [x] **Image lightbox** - Click on any menu item image to view enlarged (Feb 2026)
- [x] **Direct image upload** - Upload and crop images to square in admin edit modal (Feb 2026)

#### Locations Page (LocationsPage.jsx)
- [x] All restaurant locations with images and details
- [x] Geolocation sorting by proximity
- [x] **Admin inline editing** - Edit location details directly from the page when logged in as admin (Feb 2026)
- [x] Admin bar with Edit Locations, Add Location, Dashboard, Logout buttons
- [x] Edit modal for modifying location name, address, phone, image
- [x] **Image lightbox** - Click on any location image to view enlarged (Feb 2026)
- [x] **Direct image upload** - Upload and crop images to square in admin edit modal (Feb 2026)

#### Location Detail Page (LocationDetailPage.jsx)
- [x] Full location details with check-in system
- [x] Social wall, DJ tips, drinks sending features
- [x] **Admin inline editing** - Edit location details from the detail page when logged in as admin (Feb 2026)
- [x] Inline edit panel with form fields for name, address, phone, reservation phone, online ordering URL, image URL
- [x] **Selfie Check-In** (NEW Feb 23, 2026) - Users can take a selfie using device camera during check-in
  - [x] Camera capture UI with live video preview
  - [x] Square crop and auto-upload to server
  - [x] Selfie displayed in "Who's Here" list and social features
  - [x] Fallback to emoji avatar if no selfie taken

#### New Reusable Components (Feb 2026)
- [x] **ImageUploader** - Drag-drop image upload with square cropping, canvas-based processing
- [x] **ImageLightbox** - Full-screen image viewer with name, description, price, keyboard ESC support

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

#### Admin Dashboard (AdminPage.jsx) - UPDATED February 23, 2026
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
- [x] **Events Management Tab** (NEW Feb 23, 2026) - Full CRUD for events displayed on /events page
  - [x] View all events with images, dates, times, locations
  - [x] Add new events with form (name, description, date, time, location, image, packages)
  - [x] Edit existing events
  - [x] Mark events as Featured (highlighted on events page)
  - [x] Hide/Show events (toggle visibility)
  - [x] Delete events
  - [x] Manage ticket packages (General $25, VIP $75, Table $200)
- [x] **Gallery Submissions Tab** (NEW Feb 23, 2026) - Moderate user-submitted photos
  - [x] View all user photo submissions with user name, caption, date
  - [x] Lightbox preview for full-size viewing
  - [x] Delete inappropriate submissions (removes from gallery)

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
2. **Email Receipts for Free Tickets**: Pending Gmail API credentials (emails not sent yet)

## Bug Fixes & Completed Features (February 2026)
- **FIXED**: Deployment blocker - `AttributeError: module 'bcrypt' has no attribute '__about__'` resolved by downgrading bcrypt to 3.2.2
- **VERIFIED**: Location detail pages working correctly (blank page issue not reproducible)
- **COMPLETED**: Location data migration from mockData.js to MongoDB backend
- **COMPLETED**: WooCommerce merchandise store integration (Feb 18, 2026)
- **COMPLETED**: Promo video management via admin panel (Feb 18, 2026)
- **COMPLETED**: MenuPage already connected to backend API (97 items in DB)
- **COMPLETED**: Unified WooCommerce payment system for tokens and merchandise (Feb 19, 2026)
  - Token purchases now create WooCommerce orders instead of Stripe
  - Cart checkout for merchandise creates WooCommerce orders
  - Webhook handler processes order completions and credits tokens
  - Fixed MyAccountPage sessionId bug (was using wrong variable name)
  - Fixed BaseModel import for CartItem/CartCheckoutRequest in server.py
- **FIXED**: Welcome popup persistent reappear bug (Feb 23, 2026)
  - Changed from localStorage to sessionStorage for session-based popup control
  - Popup now shows once per browser session (closes permanently within session)
  - Prevents popup from blocking UI during testing or normal use
- **COMPLETED**: All-inclusive Admin Dashboard (Feb 23, 2026)
  - Added Events Management tab for managing /events page content
  - Added Gallery Submissions tab for moderating user photo uploads
  - Events now dynamic from MongoDB instead of hardcoded
- **COMPLETED**: Admin Posts/Comments Management (Feb 23, 2026)
  - View all social posts across all locations
  - Delete individual posts
  - Cleanup old posts (24hr+ without images)
  - Filter by location and search
- **COMPLETED**: Admin User Deletion (Feb 23, 2026)
  - Delete users and all their associated data
  - Cannot delete admin users (protected)
- **COMPLETED**: Selfie Display in Social Wall (Feb 23, 2026)
  - Posts now show author's selfie as avatar if available
  - Fallback to emoji for users without selfies
- **COMPLETED**: Social Login (Google OAuth) & Password-Based Auth (Feb 24, 2026)
  - Google OAuth via Emergent Auth integration
  - Email/Password registration with bcrypt hashing
  - Email/Password login with session cookies
  - Session-based authentication with httpOnly cookies
  - Logout functionality
  - Auth provider tracking (google vs email)
  - All auth endpoints tested and verified working
- **COMPLETED**: Admin Location Feature Toggles (Feb 24, 2026)
  - Admin can enable/disable features per location via toggle buttons:
    - Check-In (green toggle)
    - Social Wall (green toggle)
    - Tip Staff (amber toggle)
    - DJ Tips (purple toggle)
  - Location detail pages dynamically show/hide tabs based on enabled features
  - All 8 locations displayed as cards in admin panel
  - Settings persist in MongoDB
- **COMPLETED**: Enhanced PWA Features v2.1.0 (Feb 24, 2026)
  - Version changelog popup showing what's new in each release
  - Critical update force-refresh (auto-refresh for security updates)
  - Background sync for offline posts (queues posts when offline, syncs when back online)
  - Offline indicator banner showing network status
  - Offline fallback page with retry functionality
  - IndexedDB storage for pending posts
- **COMPLETED**: Forgot Password Flow (Feb 24, 2026)
  - "Forgot Password?" link on login form
  - Request reset via username or email
  - Reset token generation with 1-hour expiry
  - Dedicated /reset-password page with token verification
  - Password reset with confirmation
  - Security: clears all existing sessions after reset
  - Debug mode shows reset link (remove for production)
- **COMPLETED**: Enhanced Admin Login via /account (Feb 25, 2026)
  - Admins can sign in from the main user login page with username/email + password
  - Redirects directly to /admin without creating a user session
- **COMPLETED**: Free Event Ticketing + Reservation SMS (Feb 25, 2026)
  - Admins can set ticket package prices to $0
  - Free reservations skip checkout and redirect to the location's SMS reservation link
  - Added per-event package pricing + location slug mapping for free tickets
- **COMPLETED**: Global ALL CAPS styling for headings, titles, and buttons (Feb 25, 2026)
  - Applies to headings, section titles, tabs, and button labels across the site
- **COMPLETED**: Order Online Location Selection Flow (Feb 25, 2026)
  - Homepage Order Online CTA routes to /locations?order=1
  - Locations page highlights the closest restaurant and adds a selection banner
  - Suite placeholders added to all location addresses ("Suite TBD")
- **COMPLETED**: PWA Icon Optimization (Feb 25, 2026)
  - Added multiple icon sizes (48-512) + maskable icons
  - Updated manifest and Apple touch icon metadata
- **COMPLETED**: Admin & Account Refactor (Feb 25, 2026)
  - Admin tab components moved into /components/admin
  - Account auth components moved into /components/account
- **COMPLETED**: Soft delete for contact submissions (Feb 25, 2026)
  - Delete button in Admin > Contacts (soft delete)
  - Deleted contacts removed from list and stats
- **FIXED**: Auth page logo asset on /account (Feb 25, 2026)
- **FIXED**: Legacy admin passcode sync (Feb 25, 2026)
  - Updated legacy admin password handling and DB resync on login
- **UPDATED**: Menu specials hours copy (Feb 25, 2026)
  - MON-FRI 12PM-8PM • SATURDAY 5PM-8PM • SUNDAY 6PM-CLOSE
- **UPDATED**: Tagline capitalization (Feb 25, 2026)
  - "ELEVATED DINING MEETS SOUTHERN SOUL. EVERY DISH CRAFTED WITH FRESH INGREDIENTS AND GENUINE HOSPITALITY."
- **FIXED**: Admin login response parsing error (Feb 25, 2026)
  - Removed double-read of response body to prevent "body stream already read" errors

## Prioritized Backlog

### P0 (Critical) - ALL DONE
- [x] Admin dashboard with authentication
- [x] Deployment dependency issue (bcrypt/passlib)
- [x] Migrate locations data from mockData.js to backend/admin panel
- [x] Connect MenuPage.jsx to backend API (already done - 97 items from DB)
- [x] Promo video management via admin panel
- [x] WooCommerce merchandise store integration
- [x] Unified WooCommerce payment system (removed Stripe, all payments via WooCommerce)

### P1 (High Priority) - All Done!
- [x] Video upload and management via admin panel
- [x] Merchandise page with WooCommerce integration
- [x] Cart system with slide-out drawer for merchandise
- [x] Token purchase via WooCommerce checkout

### P2 (Medium Priority)
- [x] Geolocation for sorting locations by proximity (implemented)
- [x] Social Login (Google OAuth) via Emergent Auth (Feb 24, 2026)
- [x] Password-Based Login system (Feb 24, 2026)
- [ ] Gmail receipt emails for free event reservations (requires Google API credentials)
- [ ] Location-specific weekly specials management (per-location from admin)
- [x] PWA icon optimization
- [x] Refactor AdminPage.jsx into smaller components (now under /components/admin)
- [x] Refactor MyAccountPage.jsx into smaller components (auth forms split out)
- [ ] Apple Sign-In integration (optional)

### P3 (Low Priority)
- [ ] Email notifications for new loyalty signups
- [ ] Analytics dashboard for admin
- [ ] Multi-admin user support

## New API Endpoints (Feb 18-23, 2026)
- `GET /api/merchandise` - Fetch products from WooCommerce
- `GET /api/merchandise/{id}` - Fetch single product
- `GET /api/promo-videos` - Get all active promo videos
- `GET /api/promo-videos/by-day/{day}` - Get videos for specific day (0-6)
- `GET /api/admin/promo-videos` - Admin: Get all videos
- `POST /api/admin/promo-videos` - Admin: Create video
- `PUT /api/admin/promo-videos/{id}` - Admin: Update video
- `DELETE /api/admin/promo-videos/{id}` - Admin: Delete video
- `GET /api/tokens/packages` - Get available token packages
- `POST /api/tokens/checkout` - Create WooCommerce order for token purchase
- `GET /api/tokens/checkout/status/{transaction_id}` - Check token checkout status
- `POST /api/cart/checkout` - Create WooCommerce order for cart items
- `GET /api/cart/order/{order_id}` - Get cart order status
- `POST /api/webhook/woocommerce` - Handle WooCommerce order webhooks
- `GET /api/events` - Get all active events (public)
- `POST /api/events/free-reserve` - Reserve free event tickets and return SMS reservation link
- `GET /api/admin/events` - Admin: Get all events including inactive
- `POST /api/admin/events` - Admin: Create new event
- `PUT /api/admin/events/{event_id}` - Admin: Update event
- `DELETE /api/admin/events/{event_id}` - Admin: Delete event
- `GET /api/admin/gallery-submissions` - Admin: Get all user photo submissions
- `DELETE /api/admin/gallery-submissions/{submission_id}` - Admin: Delete submission

## User Authentication Endpoints (Feb 24, 2026)
- `POST /api/auth/google/session` - Process Google OAuth session_id and create user session
- `GET /api/auth/user/me` - Get current authenticated user info (from session cookie)
- `POST /api/auth/user/logout` - Logout user and clear session
- `POST /api/auth/user/register` - Register new user with email/password
- `POST /api/auth/user/login` - Login user with email/password

## 3rd Party Integrations
- **WooCommerce**: Live product feed AND all payment processing via finandfeathersrestaurants.com store
  - Merchandise products (8 items)
  - Token purchases (5 packages: $1-$50)
  - Webhook handler for order completion

## Token Packages
| Package | Price | Tokens |
|---------|-------|--------|
| Small   | $1    | 10     |
| Medium  | $5    | 50     |
| Large   | $10   | 100    |
| XL      | $25   | 250    |
| XXL     | $50   | 500    |

## Credentials
- **Admin Login**: username=`admin`, password=`admin`

## Preview URL
https://restaurant-admin-hub.preview.emergentagent.com
