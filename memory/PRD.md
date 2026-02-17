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

#### Location Detail Pages (LocationDetailPage.jsx)
- [x] Individual pages for each location
- [x] Contact info and social media
- [x] Weekly specials display
- [x] Embedded map placeholder

#### Admin Dashboard (AdminPage.jsx) - COMPLETED December 15, 2025
- [x] JWT-based authentication (username: admin, password: admin)
- [x] Protected routes with Bearer token
- [x] Dashboard with statistics overview
- [x] **Post Special** - Create promotions that auto-send push notifications to all app users
- [x] **Social Media Links** - Manage Instagram, Facebook, TikTok links
- [x] **Instagram Feed** - Add posts to display on homepage
- [x] Loyalty Members management (view, delete)
- [x] Contact form submissions (view, update status)
- [x] Menu Items CRUD (create, read, update, delete)
- [x] **Image Upload for menu items** (JPG, PNG, GIF, WebP up to 5MB)
- [x] Push Notifications (send to all subscribers, view history)
- [x] Logout functionality

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

#### Public Gallery Endpoint
- `GET /api/gallery` - Get active gallery items (is_active=true only)

## Tech Stack
- **Frontend**: React, React Router, TailwindCSS, Shadcn UI
- **Backend**: FastAPI, MongoDB (Motor), Pydantic
- **Auth**: JWT (python-jose), bcrypt (passlib)
- **PWA**: Service Workers, Web Push API (pywebpush)

## Database Schema
- `loyalty_members`: id, name, email, phone, marketing_consent, push_subscription, created_at
- `contact_forms`: id, name, email, phone, message, status, created_at
- `menu_items`: id, name, description, price, category, image, badges
- `push_notifications`: id, title, body, icon, image, url, sent_to, sent_at
- `gallery_items`: id, title, image_url, category, is_active, display_order, created_at

## Known Limitations / Mocked Data
1. **Menu Page uses Mock Data**: The public menu page (`MenuPage.jsx`) displays items from `mockData.js`, not from the database. Admin can manage items in MongoDB but they won't appear on the public menu.
2. **Video files**: Daily promotional videos in `/public/videos/` don't exist - carousel shows empty frames
3. **PWA Icons**: Not optimized for all device sizes

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Admin dashboard with authentication

### P1 (High Priority)
- [ ] Migrate locations data from mockData.js to backend/admin panel
- [ ] Connect MenuPage.jsx to backend API (replace mockData.js)
- [ ] Upload and manage promo videos via admin panel

### P2 (Medium Priority)
- [ ] Geolocation for sorting locations by proximity
- [ ] Location-specific weekly specials management
- [ ] PWA icon optimization

### P3 (Low Priority)
- [ ] Email notifications for new loyalty signups
- [ ] Analytics dashboard for admin
- [ ] Multi-admin user support

## Credentials
- **Admin Login**: username=`admin`, password=`admin`

## Preview URL
https://resto-portal-12.preview.emergentagent.com
