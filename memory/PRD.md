# Fin & Feathers Restaurant PWA — Product Requirements Document

## Latest Changes (2026-03-31)
- **Display Style Sync Fix (2026-03-31):** Fixed $5 Daily Specials and Cocktails to display as card layout (not horizontal/circular). Updated DB `menu_settings` for `daily-specials` and `cocktails` to `default` (cards). Set `layout: 'card'` for 36 daily specials with images. Admin Display Styles panel now reflects and controls the public menu rendering for both desktop and mobile.
- **Local Image Migration (2026-03-31):** Exported all 81 food images from MongoDB to `/images/menu/{category}/`. Deleted 183 media_files entries. Admin badge shows "LOCAL" for all images.
- **Cocktails Update (2026-03-31):** 11 signature cocktails with new descriptions + images. 5 Happy Hour Favorites added.
- **DJ Schedule Bulk Import + Auto-Publisher (2026-03-31):** Paste-and-parse bulk import with auto-post to Social Wall.
- **PWA Cache Refresh (2026-03-31):** Installed app shows Refresh button.

## Image Storage
All menu images stored as LOCAL files:
- Food: `/app/frontend/public/images/menu/{category}/{name}.jpg`
- Cocktails: `/app/frontend/public/images/cocktails/{name}.jpg`
- MongoDB `media_files` collection: EMPTY

## Display Styles (DB: menu_settings)
- daily-specials: default (cards)
- cocktails: default (cards)
- signature-cocktails: default (cards)
- starters: default (cards)
- entrees: default (cards)
- sides: compact
- salads: compact
- beer-wine: compact

## Upcoming Tasks
- (P1) Code quality: localStorage security, api.js dead code cleanup
- (P2) Continue `server.py` refactoring (3839 lines remaining)
- (P2) Per-Location Weekly Specials management
- (P3) WordPress Integration, Apple Sign-In, Merchandise Store
