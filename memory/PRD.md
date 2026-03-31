# Fin & Feathers Restaurant PWA — Product Requirements Document

## Latest Changes (2026-03-31)
- **Local Image Migration (2026-03-31):** Exported all 81 food images from MongoDB `media_files` collection to local filesystem at `/images/menu/{category}/`. Updated 747 menu items to use local paths. Deleted 183 MongoDB media entries. Admin badge logic updated to show "LOCAL" for `/images/` paths. Zero broken images across all pages.
- **Menu Image Consistency (2026-03-31):** Cocktails category style changed from circular (`style_two`) to rectangular cards (`default`), matching admin dashboard display.
- **Cocktails Update (2026-03-31):** 11 signature cocktails updated with new descriptions + uploaded images. 5 Happy Hour Favorites added.
- **DJ Schedule Bulk Import + Auto-Publisher (2026-03-31):** Paste-and-parse bulk import with auto-post to Social Wall.
- **PWA Cache Refresh (2026-03-31):** Installed app shows Refresh button to clear caches.

## Image Storage
All menu images now stored as LOCAL files:
- Food: `/app/frontend/public/images/menu/{category}/{name}.jpg`  
- Cocktails: `/app/frontend/public/images/cocktails/{name}.jpg`
- MongoDB `media_files` collection: EMPTY (deleted)
- No external image URLs in use

## Architecture
- **Frontend:** React (CRA) + TailwindCSS + ShadCN/UI
- **Backend:** FastAPI + Motor (async MongoDB)
- **Database:** MongoDB
- **Payments:** Stripe + WooCommerce
- **AI:** OpenAI GPT-4o via emergentintegrations

## Upcoming Tasks
- (P1) Code quality: localStorage security, api.js dead code cleanup
- (P2) Continue `server.py` refactoring (3839 lines remaining)
- (P2) Per-Location Weekly Specials management
- (P3) WordPress Integration
- (P3) Apple Sign-In Integration
- (P3) Merchandise Store Enhancements
