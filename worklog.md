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

---
Task ID: 2
Agent: Main
Task: Invoice layout changes - enlarge logo, remove header contact info, add legal footer fields

Work Log:
- Fixed ICE input in establishment settings: 15 digits only, no spaces, validation with red border
- Enlarged logo in invoice detail page: 64px → 96px on screen, 80px → 120px in print template
- Removed address, phone, email from invoice footer (both screen view and print template)
- Added print-only footer with legal info (ICE, IF, CNSS) for direct Ctrl+P printing
- Legal info styling improved in print template

Stage Summary:
- ICE field: auto-strips spaces/non-digits, maxLength 15, red border if != 15 digits
- Invoice logo: enlarged to 96px (screen) / 120px (print)
- Invoice footer: only shows guesthouse name + ICE/IF/CNSS (no more address/phone/email)
- Both print template (new window) and direct print (Ctrl+P) updated

---
Task ID: 3
Agent: Main
Task: Collapsible sidebar + comprehensive user guide

Work Log:
- Created zustand sidebar store (`src/stores/sidebar-store.ts`) for shared collapsed state
- Rewrote sidebar component with collapsible functionality:
  - Toggle button (chevron) on the sidebar edge to collapse/expand
  - When collapsed: shows only icons with tooltips on hover
  - Smooth CSS transitions (300ms) for width animation
  - User menu adapts: avatar-only in collapsed, full info when expanded
- Updated app layout to use dynamic padding based on collapsed state
- Added "Guide" entry to sidebar navigation with HelpCircle icon
- Created comprehensive user guide page (`/app/guide/page.tsx`) with:
  - 11 sections covering all app features
  - Modern accordion design with color-coded section icons
  - Full-text search across all guide content
  - Quick navigation chips at the top
  - Step-by-step instructions for key workflows
  - Tips, warnings, and feature lists
  - Glossary of technical terms
  - Written in clear, beginner-friendly French

Stage Summary:
- Sidebar collapses to 68px icons-only mode with tooltips
- Toggle via floating chevron button on sidebar edge
- Layout smoothly adapts main content area
- User guide covers: Bienvenue, Dashboard, Chambres, Réservations, Clients, Facturation, Restaurant, Dépenses, Statistiques, Paramètres, Interface, Glossaire
- Lint passes with no errors

---
## Task ID: 3 - Rewrite users management page
### Work Task
Comprehensive rewrite of `/home/z/my-project/src/app/(app)/app/settings/users/page.tsx` with a modern user management interface for the Guest House PMS application.

### Work Summary
- Rewrote the entire users management page with the following features:
  - **Owner-only access guard**: Non-owner users see a locked warning card with Shield icon explaining only the owner can manage users
  - **5 Roles with colors and icons**: owner (Crown/purple), manager (Briefcase/blue), receptionist (Headset/emerald), accountant (Calculator/amber), housekeeping (Sparkles/rose)
  - **Stats summary cards**: Total users, active (green), blocked (red) counts with role breakdown badges
  - **User cards** in responsive grid (1 col mobile, 2 col desktop) with: avatar circle colored by role, full name + email, role badge with icon, status badge (Actif/Bloqué), French creation date, "Vous" badge for current user
  - **Actions dropdown menu**: Edit (disabled for self), Block/Unblock toggle, Reset Password, Delete (disabled for self and last owner)
  - **Add/Edit user dialog**: First/last name, email (disabled on edit), password (create only, min 6 chars), role select with all 5 roles
  - **Reset Password dialog**: Shows user info, new password + confirm fields, password strength indicator (weak/medium/strong), validation for match and min length
  - **Delete confirmation dialog**: Uses AlertDialog component (not browser confirm()), shows user info, warning about permanent deletion, disabled when can't delete
  - **Dark mode support** throughout all components
  - **French date formatting** (e.g., "15 mars 2026")
  - **Loading states** with Loader2 spinner
  - All API calls handle errors gracefully with toast notifications
  - Blocked users get visual opacity reduction
  - Uses shadcn/ui components (Card, Dialog, AlertDialog, DropdownMenu, Badge, Select, Input, Label, Progress, Button)
  - Uses emerald as primary color (no blue/indigo)
  - Lint passes with 0 errors and 0 warnings
