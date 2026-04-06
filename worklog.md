---
Task ID: 1
Agent: Main
Task: Add image compression to all upload endpoints using sharp

Work Log:
- Audited all image upload endpoints in the project: logo upload (/api/upload/logo), generic image fields (menu items, rooms, expenses, user avatars)
- Found sharp v0.34.3 already installed in package.json
- Created `src/lib/image-compress.ts` - comprehensive server-side image compression utility using sharp with:
  - 6 presets: logo (512px, 90%), avatar (256px, 85%), room (1920x1080, 82%), receipt (1200px, 85%), menu (800px, 82%), general (1920px, 85%)
  - Smart quality reduction loop that auto-reduces quality to meet maxFileSize target
  - GIF to static image conversion
  - Base64 data URL conversion helpers
  - French human-readable file size formatting
- Updated `src/app/api/upload/logo/route.ts` to compress images before storing:
  - Max input size increased from 500KB to 10MB
  - Images are compressed using the "logo" preset (512px, 90% quality, WebP, max 200KB output)
  - Returns compression stats in response (original size, compressed size, ratio, dimensions)
- Created `src/app/api/upload/image/route.ts` - generic image upload endpoint supporting:
  - Avatars (target: "user")
  - Expense receipts (target: "expense")
  - Room images (target: "room", appends to JSON array, max 10 images)
  - Menu item images (target: "menuItem")
  - All uploads go through sharp compression with appropriate presets
  - Multi-tenant safety: all queries filtered by guestHouseId
- Updated `src/app/(app)/app/settings/establishment/page.tsx`:
  - Client-side limit increased to 10MB
  - Shows compression stats after upload (dimensions, format, size before/after, percentage saved)
  - Clear green text feedback showing compression results
- Updated `src/app/(app)/app/settings/profile/page.tsx`:
  - Avatar upload now fully functional (was previously disabled)
  - Uses the generic image upload endpoint with "avatar" preset
  - Shows compressed size feedback in toast
  - Delete avatar functionality
- Updated `src/app/api/settings/profile/route.ts`:
  - PUT endpoint now dynamically builds update data
  - Supports `avatar: null` to clear avatar
  - Added `avatar` to select fields

Stage Summary:
- All image uploads are now compressed server-side using sharp
- Logo: 512px max, 90% quality, WebP, max 200KB
- Avatar: 256px max, 85% quality, WebP, max 100KB
- Room images: 1920x1080 max, 82% quality, WebP, max 500KB
- Receipts: 1200px max, 85% quality, WebP, max 300KB
- Menu items: 800px max, 82% quality, WebP, max 200KB
- Client accepts up to 10MB input; server compresses to appropriate size
- GIF files are converted to static WebP images
- Lint passes with no errors
- Sharp v0.34.5 verified working in environment
