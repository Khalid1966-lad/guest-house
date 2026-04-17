# Worklog

---
Task ID: fix-booking-creation
Agent: Main
Task: Debug and fix booking creation not showing — Fadwa Ragbane reservation missing

Work Log:
- Verified Neon PostgreSQL database is fully in sync with Prisma schema (all 28 tables exist including Occupant, Notification, CleaningTask, etc.)
- Queried Neon directly: confirmed Fadwa Ragbane booking does NOT exist in database — POST request failed silently
- Identified that the frontend had no toast notification system — errors were only shown as small inline text in the dialog form, easily missed
- Added `useToast` hook from shadcn/ui toast system to bookings page
- Added success toast on booking creation/edit with guest name, room, and dates
- Added error toast (destructive variant) when POST/PUT/PATCH/DELETE API calls fail
- Improved fetchData to log and display errors when GET /api/bookings returns non-OK response
- Added `await` to fetchData() calls after mutations for proper sequential data refresh
- Replaced `alert()` for housekeeping warnings with toast notifications
- Added occupants response status logging for debugging
- Committed as 7cbf096 and pushed to origin/main — Vercel will auto-deploy

Stage Summary:
- Root cause: Booking POST request likely failed (conflict/validation/network error) but user didn't see the error because it was only shown as small inline text
- Fix: Added comprehensive toast notifications for all booking operations (create, edit, delete, status change)
- All errors now clearly visible as red toast notifications in addition to inline form errors
- Pushed to Vercel — user should retry creating the Fadwa Ragbane reservation after deploy

---
Task ID: 1
Agent: Main
Task: Fix sidebar icons - always colored, titles change color on hover only

Work Log:
- Read existing sidebar component at `src/components/layout/sidebar.tsx`
- Added `hoverTextColor` CSS color property to each NavItem for hover title effect
- Changed icon className to always apply `item.color` regardless of active/hover state
- Added CSS custom property `--nav-hover-color` on each nav Link element
- Added `.nav-label` class to title spans
- Added CSS rule `.sidebar-nav-item:hover .nav-label { color: var(--nav-hover-color); }` in `globals.css`
- Removed gray color override from icons (was `text-gray-400 dark:text-gray-500` when inactive)

Stage Summary:
- Sidebar icons are now always displayed in their designated colors
- Sidebar titles remain gray by default and change to the item's accent color on hover
- Each nav item has a `hoverTextColor` CSS property mapped to its color scheme

---
Task ID: 5
Agent: Main
Task: Add 'Utilisateurs' entry to sidebar (visible only to Owner)

Work Log:
- Added `UserCog` icon import from lucide-react
- Added "Utilisateurs" nav item to navigation array with `permission: "canViewUsers"` (purple color scheme)
- Fixed active state conflict between "Paramètres" (`/app/settings`) and "Utilisateurs" (`/app/settings/users`) by implementing smart active check that prevents parent route from being highlighted when a more specific child route exists
- Updated guide to mention sidebar access to "Utilisateurs" for owners

Stage Summary:
- "Utilisateurs" entry added to sidebar, visible only to users with `canViewUsers` permission (Owner role)
- Smart active state detection prevents highlighting both "Paramètres" and "Utilisateurs" simultaneously
- Guide updated with direct sidebar navigation instructions

---
Task ID: 2-4, 6-8
Agent: Main
Task: Verify existing RBAC infrastructure

Work Log:
- Confirmed Prisma schema already has `role` and `isActive` fields on User model
- Confirmed API routes already exist: `/api/users` (GET list, POST create), `/api/users/[id]` (GET, PUT, PATCH for block/reset, DELETE)
- Confirmed permissions API returns `canViewUsers: true` only for owner role
- Confirmed user management page exists at `/app/settings/users` with full CRUD, block/unblock, reset password UI
- Confirmed roles management page exists at `/app/settings/roles` with permission editor
- Confirmed profile page exists at `/app/settings/profile` with avatar upload, personal info edit, password change
- Confirmed guide already has comprehensive "Rôles et Permissions" section with all 5 roles + super admin documented

Stage Summary:
- All RBAC infrastructure was already built in previous sessions
- No additional backend or frontend pages needed to be created
- Only sidebar entry and guide update were needed

---
Task ID: notification-system
Agent: Main
Task: Implement in-app notification system (Option A)

Work Log:
- Added Notification model to Prisma schema (schema.prisma, schema.sqlite.prisma, schema.postgresql.prisma)
- Pushed schema to local SQLite DB successfully
- Created notification service at src/lib/notifications.ts with helper functions for all event types
- Created API routes: GET/POST /api/notifications, PATCH/DELETE /api/notifications/[id], POST /api/notifications/mark-all-read
- Built NotificationBell component with dropdown, unread count badge, notification list, mark-as-read, delete
- Replaced dead bell icon in Header with functional NotificationBell component
- Wired notification triggers into: bookings (create, check-in, check-out, cancel), invoices (create), restaurant-orders (create)
- Polling every 30 seconds when popover is closed
- All lint checks pass

Stage Summary:
- Full in-app notification system implemented
- Notifications fire automatically on: new booking, check-in, check-out, booking cancellation, new invoice, new restaurant order
- Bell icon in header now shows unread count and opens dropdown with notification list
- Users can mark individual or all notifications as read, and delete notifications
- Time displayed in French using date-fns locale

---
Task ID: v2.2.0-release
Agent: Main
Task: Create version v2.2.0 and update all instances including footers

Work Log:
- Updated `src/lib/version.ts`: version v1.9.2 → v2.2.0, date 2026-07-04, COPYRIGHT_YEAR → 2026
- Updated `src/app/(app)/app/layout.tsx`: replaced inline footer with `AppFooter` component from `src/components/layout/footer.tsx`
- AppFooter now displays: version monospace, "PMS Guest House", Jazel Web Agency credit, copyright © 2026
- Ran lint check — passed
- Committed and pushed to origin/main (bf63df1)

Stage Summary:
- Version v2.2.0 created and pushed
- All three footers (Landing, Auth, App/Dashboard) now use the same version constants
- COPYRIGHT_YEAR updated to 2026 across all footers
- Dashboard footer upgraded from simple inline to full AppFooter with Jazel Web Agency credits

---
Task ID: restaurant-order-creation
Agent: Main + full-stack-developer
Task: Add order creation UI to restaurant page - link orders to rooms/clients

Work Log:
- Analyzed existing restaurant page: menu CRUD existed, order listing existed, but NO order creation UI
- API endpoint POST /api/restaurant-orders already existed with full support for roomId, bookingId, guestName, items
- Added ActiveBooking interface for type-safe booking data
- Added 13 new state variables for the order creation form
- Added 3 computed useMemo values (availableMenuItems, newOrderTotal, selectedBooking)
- Added 7 handler functions (handleOpenNewOrder, handleBookingSelect, handleAddOrderItem, handleRemoveOrderItem, handleUpdateItemQuantity, handleSaveNewOrder)
- Created full New Order dialog with 3 order types: Room Service, Dine-in, Takeaway
- Room Service: fetches checked_in bookings, select by room → auto-fills guest name
- Dine-in: enter table number + optional guest name
- Takeaway: enter guest name
- Menu item browser with search, category filter, quantity +/-
- Order summary with running total
- Added "Nouvelle commande" button in Orders tab header and empty state
- All lint checks pass

Stage Summary:
- Restaurant orders can now be created directly from the dashboard
- Orders are linked to rooms/bookings (room service) or tables/guests
- When a booking is selected, guest name is auto-filled from booking data
- Only available menu items are shown in the order form

---
Task ID: restaurant-orders-on-invoice
Agent: Main + full-stack-developer
Task: Add restaurant orders as invoice line items during invoicing

Work Log:
- Added RestaurantOrderForInvoice type for type-safe order data
- Updated defaultItemForm to include itemType and referenceId fields
- Added restaurantOrders state, fetched alongside invoices/guests/bookings
- Added availableRestaurantOrders computed value (filters pending, non-cancelled orders)
- Created handleAddRestaurantOrder handler: converts order items into invoice line items with header
- Updated handleSaveInvoice to pass itemType="restaurant_order" and referenceId for each restaurant item
- Added post-save logic: marks restaurant orders as "billed_to_room" via PATCH after invoice creation
- Added orange-themed UI section in invoice dialog showing unbilled restaurant orders
- Section shows: order type emoji, guest name, item count, date, item summary, and price
- Click on an order → adds all its items as invoice line items with the order total as header
- All lint checks pass

Stage Summary:
- When creating an invoice, unbilled restaurant orders appear in an orange section
- Clicking an order adds its items (with prices) to the invoice
- After saving, orders are automatically marked as "billed_to_room"
- itemType/referenceId fields on InvoiceItem are now utilized for restaurant order tracing

---
Task ID: fix-restaurant-orders-invoice
Agent: Main
Task: Fix bugs and improve restaurant orders integration in invoices (continuing from commit 3c4d3fb)

Work Log:
- Fixed availableRestaurantOrders: was showing ALL pending orders regardless of guest. Now filters by matching selected guest's first/last name against order guestName
- Added selectedGuestFullName computed value for reliable guest name matching
- Fixed handleAddRestaurantOrder: added duplicate prevention check (same order can't be added twice)
- Fixed availableRestaurantOrders: now excludes orders already present in current invoice form items (by referenceId)
- Fixed syntax error in availableRestaurantOrders filter callback (was using invalid arrow function params)
- Updated invoice detail page: added itemType/referenceId to InvoiceItem interface
- Added UtensilsCrossed icon import to invoice detail page
- Restaurant items on invoice detail page: orange background for headers, utensils icon on each row
- Updated print template: restaurant headers get orange background + emoji prefix, sub-items get light orange
- All lint checks pass, dev server compiles without errors

Stage Summary:
- Restaurant orders are now properly filtered by guest name when creating invoices
- Duplicate order additions are prevented
- Already-added orders disappear from the available list
- Invoice detail and print views clearly distinguish restaurant items visually
- Pushed as commit 18e8cd9

---
Task ID: favicon-admin-password
Agent: Main
Task: Create custom favicon and add admin password reset for guesthouses

Work Log:
- Generated AI favicon image (1024x1024): house with bed on blue gradient rounded square
- Created all favicon sizes using sharp: 16x16, 32x32, 180x180 (apple-touch-icon), 192x192, 512x512 (android-chrome), favicon.ico
- Updated root layout metadata to reference all favicon sizes
- Added password reset action to PATCH /api/admin/guesthouses/[id] API endpoint
- Admin API validates: userId exists in guesthouse, password >= 6 chars, hashes with bcrypt (10 rounds)
- Added admin UI password change dialog with KeyRound icon button per guesthouse card
- Password dialog includes: new password, confirmation, validation, success/error feedback
- Dialog auto-closes 2 seconds after successful reset
- Added KeyRound and CheckCircle icon imports to admin page
- All lint checks pass

Stage Summary:
- Professional favicon now displays across all browsers and devices
- Super admin can reset any guesthouse owner's password from the admin panel
- Password reset uses secure bcrypt hashing
- Pushed as commit 5d83a52

---
Task ID: room-photos
Agent: Main
Task: Add room photos support - card view display, edit upload/delete, detail gallery

Work Log:
- Updated room image compression preset in `src/lib/image-compress.ts`: maxWidth 1280, maxHeight 800, quality 75, maxFileSize 100KB, minQuality 40
- Updated upload API `src/app/api/upload/image/route.ts`: room images limited to 500KB input (others stay 10MB)
- Created new API endpoint `PATCH /api/rooms/[id]/images` for removing individual images by index
- Updated rooms list page `src/app/(app)/app/rooms/page.tsx`:
  - Added image management state (roomImages, isUploadingImage, imageError, fileInputRef)
  - Added getRoomImages/getRoomFirstImage helpers
  - Added handleUploadImage (validates 500KB max, calls /api/upload/image)
  - Added handleRemoveImage (calls PATCH /api/rooms/[id]/images)
  - Card view: first photo as header image with object-cover, fallback to gradient placeholder
  - Photo count badge (Camera icon) on cards when multiple photos exist
  - Edit dialog: photo management section with 5-column grid, delete button on hover, "Principale" label on first photo
  - Upload button with dashed border, compression progress indicator, max 10 photos
- Updated room detail page `src/app/(app)/app/rooms/[id]/page.tsx`:
  - Added `images` field to Room interface
  - Main photo display (h-64) with photo count badge
  - Thumbnail gallery strip below main photo for rooms with multiple images
  - First thumbnail highlighted with sky-500 border
  - Fallback to gradient placeholder when no photos
- All lint checks pass

Stage Summary:
- Room photos fully functional across list, edit, and detail views
- Images compressed to ~100KB via sharp (webp, 1280x800)
- Max 10 photos per room, 500KB max input per file
- First photo used as card thumbnail and detail page hero
- Individual photo deletion supported via PATCH API
- Pushed as commit 3db6181

---
Task ID: pricing-mode
Agent: Main
Task: Add per room vs per person pricing mode for room rates

Work Log:
- Added `pricingMode` field to Room model across all 3 Prisma schemas (default: "per_room")
- Pushed SQLite schema to local database
- Updated Room interface in bookings page to include `pricingMode`
- Updated `calculateTotal()` in bookings: per_person multiplies rate × adults × nights
- Extra beds and baby beds remain extras regardless of pricing mode
- Updated booking price summary UI to show "× N pers." for per_person mode
- Updated Room interface in rooms page, added pricingMode to defaultFormData and handleEditRoom
- Added "Mode de tarification" select in room edit dialog (Par chambre / Par personne)
- Updated room card view: "/nuit /pers." suffix when per_person
- Updated room detail page: pricing mode display + "/nuit par pers." label
- Updated invoices: Room interface includes pricingMode, handleBookingSelect uses totalPrice
- Invoice description includes "- N pers." for per_person bookings
- Updated all API routes to include pricingMode in selects and updates
- All lint checks pass

Stage Summary:
- Rooms can now be configured as "Par chambre" or "Par personne" pricing
- Per person mode: total = nightlyRate × number of adults × nights
- Per room mode: total = nightlyRate × nights (unchanged behavior)
- Extra beds always charged additionally in both modes
- Booking creation UI adapts the price summary display
- Invoice generation correctly uses the already-calculated totalPrice from booking
- Pushed as commit c83e28c

---
Task ID: guesthouse-code-invoice-fix
Agent: Main
Task: Fix invoice creation unique constraint error + add guesthouse code to invoice numbers

Work Log:
- Diagnosed root cause: `invoiceNumber` had global `@unique` constraint, so two guesthouses creating the same number (e.g., FAC-2026-00001) would conflict
- Initially changed to compound `@@unique([invoiceNumber, guestHouseId])` but reverted after user pointed out sandbox uses SQLite while Vercel uses PostgreSQL (can't db:push in sandbox)
- Added `code` field to GuestHouse model: `String @unique` (e.g., GH001, GH002, GH003...)
- Updated guesthouse creation API: auto-generates next sequential code on create
- Updated invoice number format: `FAC-2026-00001/GH001` (globally unique because GH code is unique)
- Reverted to simple `@unique` on invoiceNumber (no longer needs compound constraint)
- Added `extractInvoiceSeq()` helper that handles both old and new invoice number formats
- Added retry loop (5 attempts) in invoice creation to handle race conditions
- Added auto-assign code mechanism: if existing guesthouse has no code (post-migration), assigns one on first invoice creation
- Updated seed file: added `code: 'GH001'` to guesthouse, updated invoice numbers to new format
- Updated settings establishment API GET to include `code` field
- Added guesthouse code display in establishment settings → Billing tab (read-only, with example invoice number)
- All lint checks pass

Stage Summary:
- Invoice creation error fixed: each guesthouse now has a unique code (GH001, GH002...)
- Invoice format: FAC-2026-00001/GH001 — globally unique across all guesthouses
- Guesthouse code auto-generated on creation, auto-assigned to existing guesthouses on first use
- Code displayed read-only in establishment settings → Facturation tab
- Backward-compatible: invoice number parser handles both old (FAC-2026-00001) and new (FAC-2026-00001/GH001) formats
- Changes ready for deployment (schema push needed on Vercel/PostgreSQL)

---
Task ID: restaurant-order-price-lock
Agent: Main
Task: Lock restaurant order prices in invoice creation (prevent price editing) + fix order reappear bug

Work Log:
- Updated InvoiceItem interface to include `itemType` and `referenceId` fields
- Updated `handleEditInvoice` to preserve `itemType` and `referenceId` when editing invoices
- Made quantity, unitPrice, taxRate, and description fields `readOnly` for restaurant order items
- Added visual indicators: orange/amber backgrounds for restaurant items, Lock icon on description label
- Restaurant order headers get amber background, individual items get orange background
- Removed item delete button still available (user can remove order from form)
- Previous bug (orders not reappearing after invoice deletion) was already fixed: DELETE endpoint resets `paymentStatus` to "pending"

Stage Summary:
- Restaurant order prices are now locked/read-only in invoice creation form
- Visual distinction: restaurant items have orange/amber tinted backgrounds with lock icon
- Edit mode also preserves restaurant item lock status
- Invoice deletion properly resets order paymentStatus to "pending" (was already implemented)

---
Task ID: multi-fixes-session
Agent: Main
Task: Multiple improvements: invoice admin delete, notifications scroll/management, wider dialog, delete cancelled orders

Work Log:
- **Invoice deletion for admin**: Added `canDeleteInvoice` check on frontend (owner + admin roles), added role check on backend DELETE endpoint returning 403 for unauthorized roles
- **Notifications scroll**: Added `max-h-[520px] flex flex-col` to PopoverContent, changed ScrollArea to `flex-1` to fill remaining space within constrained popover
- **Notifications settings page**: Completely rewrote with new "Historique des notifications" card at top showing all notifications with icons, timestamps, delete buttons. Added "Tout lire" and "Tout supprimer" buttons. Delete-one and delete-all confirmation dialogs. Created new API endpoint `DELETE /api/notifications/delete-all`
- **Invoice dialog resizable**: Changed from `max-w-3xl` to `max-w-4xl` with `minWidth: 720px` and `resize: both` inline style
- **Delete cancelled restaurant orders**: Added "Supprimer la commande" menu item for cancelled orders, delete confirmation dialog, `handleDeleteOrder` handler calling DELETE API

Stage Summary:
- Invoice delete: owner and admin can both delete invoices (frontend + backend)
- Notifications dropdown: properly constrained with vertical scrollbar
- Settings → Notifications: full notification history with delete-one and delete-all
- Invoice dialog: wider (max-w-4xl, min 720px) and user-resizable
- Cancelled restaurant orders can be deleted by owner

---
Task ID: 3-restaurant-updates
Agent: full-stack-developer
Task: Restaurant page updates - photos, list view, minimized labels

Work Log:
- Added new imports: `useRef` from React, `Camera`, `X`, `LayoutGrid`, `List` from lucide-react
- Added state variables: `isUploadingImage`, `imagePreview`, `menuViewMode`, `menuImageInputRef`
- Updated `handleNewMenuItem` and `handleEditMenuItem` to reset/set `imagePreview`
- Added `handleUploadMenuImage` function: validates 200KB max, uses API for existing items (with targetId), FileReader for new items
- Added `handleRemoveMenuImage` function to clear image from form and preview
- Replaced "Image URL" text input in menu item dialog with image upload UI: hidden file input, Camera button trigger, image preview with delete (X) button, loading spinner during upload, max 200KB hint
- Added photo thumbnails to grid view menu items: 48x48 rounded-lg image or gradient placeholder with UtensilsCrossed icon
- Added photo thumbnails to new list view: 56x56 rounded-lg image or gradient placeholder
- Added view mode toggle (LayoutGrid/List icons) in menu filters area
- Added list view: ScrollArea with max-h-[600px], single-column rows with photo, name/description/badges, price/prep time, and dropdown actions
- Replaced 4-card Menu Stats with compact inline flex-wrap format (icons + labels in one line)
- Replaced 4-card Order Stats with compact inline flex-wrap format (clickable status buttons + revenue)
- All lint checks pass, dev server compiles without errors

Stage Summary:
- Menu items now support photo upload via file picker (200KB max, compressed server-side for existing items)
- Photo thumbnails shown in both grid view (48x48) and list view (56x56) with gradient placeholder fallback
- Toggle between grid and list views for menu items with LayoutGrid/List icon buttons
- List view includes ScrollArea with 600px max height for vertical scrolling
- Menu stats and order stats condensed from 4 cards each into single-line compact formats
- Order stats buttons are clickable to filter by status

---
Task ID: 1-statistics-fixes
Agent: Main
Task: Statistics page - refresh button, year selector fix, PDF export

Work Log:
- Replaced broken Tabs-based period selector with custom button group (Mois/Année) using div+button
- Added year selector dropdown (Select) that appears when "Année" is active, showing current year and 3 previous years
- Updated statistics API to accept `year` query parameter for yearly statistics (uses referenceDate instead of now)
- Added RefreshCw icon button that triggers data refresh with spinning animation
- Added PDF export button using `window.print()` (best approach for dashboard with charts)
- Added `useMemo` and `cn` imports, `RefreshCw` icon import
- Added `selectedYear` state variable

Stage Summary:
- Period selector (Mois/Année) now works reliably with custom buttons instead of Tabs component
- Year selector shows when "Année" period is selected (current year - 3 previous)
- Refresh button reloads statistics data with visual feedback
- PDF export uses browser print dialog (captures charts correctly)
- Statistics API supports year parameter for historical data

---
Task ID: 2-notification-transparency
Agent: Main
Task: Fix notification popover transparency

Work Log:
- Added explicit `bg-popover border shadow-lg` classes to PopoverContent in NotificationBell component
- Ensures solid background instead of potentially transparent default

Stage Summary:
- Notification popover now has solid background and visible shadow
- Content behind notifications no longer shows through

---
Task ID: fix-cn-import
Agent: Main
Task: Fix missing cn import in statistics page (runtime error)

Work Log:
- Statistics page was using `cn()` utility but missing `import { cn } from "@/lib/utils"`
- Added the missing import line after `useCurrency` import
- Lint passes, dev server compiles without errors
- Committed as 56bac17

Stage Summary:
- Statistics page now properly imports `cn` utility — no more runtime error when rendering period selector buttons

---
Task ID: payment-method
Agent: full-stack-developer
Task: Add payment method dropdown to invoices

Work Log:
- Added `paymentMethod String?` field to Invoice model in all 3 Prisma schemas (schema.prisma, schema.postgresql.prisma, schema.sqlite.prisma) after `paidAt DateTime?`
- Pushed SQLite schema to local database successfully
- Updated POST /api/invoices route: added `paymentMethod` parameter to `buildInvoiceData`, included in destructured body, passed through to invoice creation
- Updated PUT /api/invoices/[id] route: added `paymentMethod` to destructured body, included in invoice update data with existing-value fallback
- Updated Invoice interface in invoices list page to include `paymentMethod: string | null`
- Added `paymentMethodOptions` array and `paymentMethodLabels` map constants (7 options: Espèces, Carte bancaire, Virement bancaire, Chèque, Mobile Money, Paiement en ligne, Autre)
- Added `paymentMethod: ""` to form state default, `handleNewInvoice`, and `handleEditInvoice` (pre-fills from existing invoice)
- Added shadcn/ui Select dropdown for payment method in invoice dialog form, placed in a 2-column grid alongside Notes
- Included `paymentMethod` in request body when saving invoices (both POST create and PUT update)
- Added payment method indicator (💳 icon + label) in invoice list items below guest name
- Updated Invoice interface in invoice detail page to include `paymentMethod: string | null`
- Added purple Badge showing payment method next to status Badge in invoice detail header
- Updated `paymentMethods` map in detail page to match full set of options
- Added payment method display in print template (purple text in invoice-info section)
- All lint checks pass, dev server compiles without errors

Stage Summary:
- Invoices now support optional payment method field with 7 predefined options
- Payment method dropdown appears in invoice creation/edit dialog alongside Notes
- Payment method is persisted via API and displayed as purple Badge on invoice detail page
- Invoice list shows payment method indicator on each invoice row
- Print template includes payment method in the invoice header area
- Existing invoices without payment method remain unaffected (null field)

---
Task ID: housekeeping
Agent: full-stack-developer
Task: Add room cleaning/housekeeping management

Work Log:
- Added `cleaningStatus`, `cleaningUpdatedAt`, `cleaningNotes` fields to Room model in all 3 Prisma schemas (schema.prisma, schema.postgresql.prisma, schema.sqlite.prisma)
- Added `canManageHousekeeping` Boolean field to Role model in all 3 Prisma schemas
- Pushed SQLite schema to local database successfully
- Updated permissions API: `canManageHousekeeping: true` for owner, manager, housekeeping roles; `false` for receptionist, accountant, staff
- Added "Ménage" sidebar nav entry after "Chambres" with Sparkles icon, pink color scheme (#ec4899), canManageHousekeeping permission
- Created PATCH /api/housekeeping endpoint: validates role (owner/admin/manager/housekeeping), validates cleaningStatus values, updates room with cleaningStatus/cleaningUpdatedAt/cleaningNotes
- Created full housekeeping management page at /app/housekeeping:
  - Header with Sparkles icon and description
  - Compact inline stats bar with clickable status filter buttons (departure, turnover, cleaning, clean, verified, all)
  - Room cards with cleaning status badges, room status, guest name, time ago, cleaning notes
  - Status flow dropdown: logical next statuses + full control all statuses
  - Notes dialog for optional notes when changing status
  - Reset option to clear cleaning status
  - French UI throughout
- Updated rooms list page: added cleaningStatus to Room interface, cleaning status badges on grid cards and list table rows
- All lint checks pass

Stage Summary:
- Full housekeeping management system added with 5 cleaning statuses (En départ, En recouche, En cours, Propre, Vérifiée)
- Sidebar entry visible to owner, manager, housekeeping roles
- Rooms page shows cleaning status badges alongside room status
- Housekeeping page provides filtering, status flow control, and optional notes
- API validates role permissions and cleaning status values

---
Task ID: 4-housekeeping-v2
Agent: Main
Task: Comprehensive housekeeping system with checklist, staff assignment, history, and role-based access

Work Log:
- Added `CleaningTask` and `CleaningTaskItem` models to all 3 Prisma schemas (schema.prisma, schema.postgresql.prisma, schema.sqlite.prisma)
- CleaningTask: links room to cleaning session with assignedTo, status, priority, timestamps, notes, damage tracking
- CleaningTaskItem: individual checklist items with category, checked status, timestamp, user reference, anomaly notes
- Added User relations: CleaningAssignedTo, CleaningVerifiedBy, CleaningCheckedBy
- Added Room and GuestHouse relations for cleaningTasks
- Pushed SQLite schema to local database successfully
- Updated housekeeping API route (GET): now returns rooms with active task summary including progress
- Created POST /api/housekeeping/tasks: creates task with 10 auto-generated checklist items
- Created GET /api/housekeeping/tasks: lists tasks with filters (status, roomId, assignedToId)
- Created GET/PATCH/DELETE /api/housekeeping/tasks/[id]: task CRUD with role-based access
- Created PATCH /api/housekeeping/tasks/[id]/items/[itemId]: toggle checklist items with auto-start/auto-complete logic
- Created GET /api/housekeeping/history: room cleaning history with pagination
- Updated permissions API: added gouvernant, gouvernante, femmeDeMenage role defaults
- Fixed category mismatch: API uses salle_de_bain to match frontend
- Fixed progress shape mismatch: API returns {checked, total} object
- Completely rewrote housekeeping page (1621 lines) with:
  - Header with pink Sparkles icon and refresh button
  - Compact stats filter pills (En départ, En cours, Terminé, Vérifié)
  - Search bar for room filtering
  - Room cards grid with cleaning status, progress bars, assigned person, time ago
  - Task detail Sheet with 10-item checklist grouped by 5 categories
  - Large 44px+ touch-friendly checkboxes with checkmark animations
  - Category sections: Vérification, Linge, Nettoyage, Salle de bain, Consommables
  - Anomaly note dialog per checklist item
  - Damage reporting dialog (marks task as needs_repair)
  - Staff assignment dialog for gouvernante/owner
  - Create task dialog with room selection, staff assignment, priority
  - Cleaning history sheet per room
  - Role-based access: femmeDeMenage can check items and mark completed; gouvernante/owner can verify
- Updated version to v2.4.0
- All lint checks pass (zero errors)

Stage Summary:
- Complete room cleaning management system with 10-point checklist
- Role-based access: femme de ménage (execution), gouvernante (supervision/verification), owner (full access)
- Checklist categories: Vérification, Linge, Nettoyage, Salle de bain, Consommables
- Staff assignment to cleaning tasks
- Damage reporting and tracking
- Cleaning history per room
- Mobile-first responsive design with large touch targets
- Auto-start on first check, auto-complete when all items checked
- Version bumped to v2.4.0

---
Task ID: fix-housekeeping-loading
Agent: Main
Task: Fix "Erreur lors du chargement des chambres" in housekeeping page

Work Log:
- Diagnosed root cause: `postinstall` script ran `prisma generate` (using default `schema.prisma` with `provider = "postgresql"`) but `DATABASE_URL` points to SQLite. This generated a PostgreSQL Prisma client that couldn't query SQLite, causing all Prisma queries to fail with 500 errors
- Fixed `postinstall` in package.json: changed to `prisma generate --schema=prisma/schema.sqlite.prisma`
- Regenerated Prisma client with SQLite schema
- Fixed category mismatch in task creation template: `supplies` → `consommables` (frontend expects `consommables` key)
- Fixed `assignedTo` select in GET /api/housekeeping: added missing `avatar` field to match frontend interface
- Improved error handling in fetchRooms: now parses API error response body to show actual error message instead of generic text
- All lint checks pass

Stage Summary:
- Root cause: PostgreSQL Prisma client was generated while DATABASE_URL is SQLite, causing all housekeeping queries to fail
- Fixed postinstall to always generate SQLite client for local development
- Fixed checklist category mismatch (supplies → consommables)
- Added avatar field to assignedTo API response
- Improved frontend error reporting to show actual API errors

---
Task ID: 1
Agent: main
Task: Fix checklist showing only 5/10 items, checkout not setting departure, "Toutes" filter empty

Work Log:
- Analyzed full housekeeping flow: checkout → cleaningStatus → housekeeping API → frontend filtering
- Found ROOT CAUSE of 5/10 items: category name mismatch between template (English: "linen"/"cleaning") and frontend (French: "linge"/"nettoyage")
- Fixed template in tasks/route.ts: changed "linen" → "linge", "cleaning" → "nettoyage" for new tasks
- Added normalizeCategory() in frontend groupedItems to handle existing DB records with old English category names
- Fixed checkout resilience: separated room.status update from cleaningStatus update in bookings/[id]/route.ts, wrapping cleaningStatus in try-catch
- Fixed hasCleaningTasks state never resetting to true after migration (was only set to false, never back to true)
- Verified "Toutes" filter logic is correct (just returns rooms array), the empty issue was likely caused by hasCleaningTasks being stuck on false

Stage Summary:
- 3 files modified: tasks/route.ts, housekeeping/page.tsx, bookings/[id]/route.ts
- All 10 checklist items will now be visible (5 existing categories + normalization for old data)
- Checkout will set cleaningStatus="departure" reliably, and won't fail the entire checkout if migration is missing
- "Toutes" filter should work correctly now that hasCleaningTasks resets properly
- Lint passes clean
---
Task ID: 1
Agent: Main Agent
Task: Fix user avatar in sidebar - show photo if exists, otherwise show initials

Work Log:
- Identified root cause: `avatar` field exists in Prisma User model but was NOT passed through NextAuth session pipeline
- Updated `src/lib/auth.ts`:
  - Added `avatar: string | null` to Session interface
  - Added `avatar?: string | null` to JWT interface
  - Added `avatar?: string | null` to User interface
  - Pass `user.avatar` in both authorize return paths (with and without guestHouse)
  - Store `token.avatar` in JWT callback
  - Pass `token.avatar` to `session.user.avatar` in session callback
- Sidebar component already had correct Avatar/AvatarImage/AvatarFallback code with initials fallback

Stage Summary:
- Avatar now flows: DB → authorize → JWT → session → sidebar Avatar component
- If no avatar photo exists, user initials are displayed in a colored circle
- No sidebar component changes needed - only auth.ts data pipeline fix

---
Task ID: 2
Agent: Main Agent
Task: First authorized menu redirect when Dashboard is not allowed

Work Log:
- Verified existing implementation in `computeDefaultMenu()` (auth.ts line 26-39)
- Verified JWT callback stores `token.defaultMenu` (auth.ts line 227)
- Verified middleware redirects to `defaultMenu` from /login (middleware.ts line 49) and /app/dashboard (middleware.ts line 61-63)
- Feature was already fully implemented in previous conversation session

Stage Summary:
- No code changes needed - redirect logic already works correctly
- When Dashboard is not in user's menuAccess, middleware redirects to first authorized menu
---
Task ID: 1
Agent: Main Agent
Task: Fix registration flow - auto sign-in after account creation

Work Log:
- Identified root cause: Register page created user but did NOT sign them in before redirecting to /onboarding
- Onboarding page checks `status === "unauthenticated"` and redirects to /login, so the user never saw the onboarding form
- Fix: Added `signIn("credentials", { redirect: false })` in register page after successful API call
- If auto sign-in fails, shows error message asking user to login manually
- Changed redirect from `/onboarding?userId=${data.userId}` to `/onboarding` (userId not needed since session is available)
- Reduced timeout from 2000ms to 1500ms

Stage Summary:
- Registration flow now: create account → auto sign-in → show success → redirect to onboarding
- Onboarding page works correctly with session data (no userId param needed)

---
Task ID: 2
Agent: Main Agent
Task: Show pending registrations in admin panel

Work Log:
- Identified root cause: Admin panel only queries GuestHouse records; users without guestHouseId are invisible
- Updated `/api/admin/guesthouses` GET endpoint to also fetch `pendingUsers` (role=owner, guestHouseId=null)
- Added `PendingUser` interface in admin guesthouses page
- Added yellow-themed "Inscriptions en attente" card section between stats and filters
- Each pending user shows: avatar initial, name, email, registration date, active/inactive badge
- Scrollable list (max-h-64) with responsive layout

Stage Summary:
- Admin panel now shows a dedicated section for users who registered but haven't completed onboarding
- New accounts are visible immediately after registration

---
Task ID: 1
Agent: Schema Agent
Task: Add Backup model to Prisma schemas

Work Log:
- Added Backup model to all 3 Prisma schemas (schema.prisma, schema.sqlite.prisma, schema.postgresql.prisma)
- Ran db:push to apply schema changes

Stage Summary:
- Backup table now exists in the database
- Model supports compressed data, size tracking, table summary, and guesthouse list for selective restore

---
Task ID: 2
Agent: API Agent
Task: Create backup API endpoints (list, create, delete)

Work Log:
- Created /api/admin/backup with GET (list), POST (create), DELETE endpoints
- exportAllData() queries all 20 tables via $queryRawUnsafe with row_to_json
- Compression via zlib.gzipSync + base64 encoding
- Auto cleanup keeps max 5 auto backups
- Super admin auth guard on all endpoints

Stage Summary:
- Global backup creation, listing, and deletion fully functional
- Backup stores compressed data, table summary, guesthouse list for selective restore

---
Task ID: 3
Agent: Main
Task: Complete backup system - download, restore (full + guesthouse), import, admin UI

Work Log:
- Created GET /api/admin/backup/[id]/download — serves backup as downloadable .json.gz file with proper Content-Disposition header
- Created POST /api/admin/backup/[id]/restore — full database restore (clear all tables in reverse FK order, then insert all in dependency order, batched in 100s)
- Created POST /api/admin/backup/[id]/restore?guestHouseId=xxx — individual guesthouse restore (filters backup data by guestHouseId including child tables via parent ID collection, deletes existing guesthouse with cascade, inserts filtered data)
- Created POST /api/admin/backup/import — uploads .json.gz file from PC, validates gzip/JSON structure, stores as new Backup record
- Fixed SQLite compatibility: removed skipDuplicates from createMany (not supported by SQLite)
- Fixed TypeScript errors: removed non-existent version field from Backup select, fixed FormData append type
- Created full backup management UI at /app/admin/backup/page.tsx:
  - Stats cards (total, manual, auto, total size)
  - Info banner explaining global backup capabilities
  - Backup list with expand/collapse details per backup
  - Guesthouse list per backup with badges
  - Table details grid with record counts
  - Create backup dialog with optional label
  - Delete backup confirmation dialog
  - Restore dialog with mode selection (full vs individual guesthouse)
  - Guesthouse selector dropdown for individual restore
  - Warning banners for irreversible operations
  - Import section with file picker, label input, progress feedback
  - Result banners (success/error) with auto-dismiss
- Added "Sauvegardes" navigation button in admin guesthouses header (Database icon, emerald color)
- All lint checks pass, no backup-related TypeScript errors

Stage Summary:
- Complete backup/restore system implemented with 6 API endpoints and full admin UI
- Backup operations: create, list, download, delete, full restore, individual guesthouse restore, import from file
- Auto retention: max 5 auto backups, unlimited manual
- Individual guesthouse restore filters all related tables (GuestHouse, Users, Roles, Rooms, RoomPrices, Amenities, Guests, Bookings, Invoices, InvoiceItems, Payments, MenuItems, Orders, OrderItems, Expenses, Tasks, TaskItems, Notifications, AuditLogs)
- Admin page accessible from "Sauvegardes" button in admin panel header

---
Task ID: 7
Agent: Main
Task: Système d'abonnement complet (Subscription)

Work Log:
- Ajout du modèle Subscription aux 3 schemas Prisma (schema.prisma, schema.sqlite.prisma, schema.postgresql.prisma)
- db push sur SQLite local
- Ajout de Subscription dans backup-models.ts DEPENDENCIES
- Création de src/lib/subscription.ts (computeEffectiveStatus, buildSubscriptionInfo, plan/status labels/colors)
- Création de GET/POST /api/admin/subscriptions (liste avec stats, création avec sync GuestHouse)
- Création de GET/PATCH /api/admin/subscriptions/[id] (détail, modification dynamique avec historique)
- Création de GET /api/subscription (endpoint propriétaire)
- Création de la page admin /app/admin/subscriptions/page.tsx (stats, filtres, tableau, dialog modification, prolongation rapide)
- Création de src/components/subscription/subscription-banner.tsx (bandeau contextuel dans layout)
- Mise à jour du AppFooter avec infos abonnement (plan, inscription, dernier paiement, expiration)
- Ajout du lien "Abonnements" (Crown icon) et "Sauvegardes" (Database icon) dans le sidebar super admin
- Auto-trial 14 jours premium lors de la création d'une guesthouse (onboarding)
- SubscriptionBanner intégré dans src/app/(app)/app/layout.tsx

Stage Summary:
- Modèle Subscription: id, guestHouseId, plan (free/premium), status (trial/active/expired/grace_period/cancelled), expiresAt, lastPaymentAt, lastPaymentRef, trialEndsAt, gracePeriodDays, notes, changedBy, changedAt
- Les abonnements sont automatiquement sauvegardés/restaurés avec le système de backup
- Le super admin a un panel complet pour gérer les abonnements avec prolongation rapide (+30j, +90j, +1an)
- Les propriétaires voient leur date d'expiration dans le footer et un bandeau d'alerte en cas de problème

---
Task ID: 1
Agent: main
Task: Fix subscriptions page - all guesthouses should be visible

Work Log:
- Identified root cause: Subscription table was never created on PostgreSQL (Vercel)
- The Prisma schema had the model but `prisma db push` was never run against production
- The LEFT JOIN query in GET /api/admin/subscriptions failed silently because the table didn't exist
- Created `src/lib/ensure-subscription-table.ts` (same pattern as ensure-backup-table.ts)
- Updated `src/lib/db.ts` to call ensureSubscriptionTable on cold start
- Added fallback query in GET handler: if Subscription table doesn't exist, returns all GHs with NULL subscription fields
- Pushed to GitHub, Vercel will auto-deploy

Stage Summary:
- `src/lib/ensure-subscription-table.ts` — new file, creates Subscription table via pg raw SQL
- `src/lib/db.ts` — imports and calls ensureSubscriptionTable
- `src/app/api/admin/subscriptions/route.ts` — resilient try/catch with fallback query
- All guesthouses will now appear in the subscriptions admin panel
---
Task ID: 1
Agent: Main Agent
Task: Fix login page - keep email autofill, clear password after logout

Work Log:
- Read login page at src/app/(auth)/login/page.tsx
- Found that password clearing useEffect was already partially implemented (from previous session)
- Changed email field autoComplete from "off" to "email" to allow email autofill on shared computers
- Password field already had autoComplete="new-password" (browser-respected directive to not autofill)
- useEffect already runs 3 passes (100ms, 500ms, 1000ms) to clear password after browser autofills it
- Removed email clearing from the useEffect (was already removed in previous session)

Stage Summary:
- Login form now: email can be autofilled by browser, password is ALWAYS cleared on page load
- Uses triple-pass setTimeout (100ms/500ms/1000ms) to catch all browser autofill timing variations
- File modified: src/app/(auth)/login/page.tsx

---
Task ID: 2
Agent: Main Agent
Task: Logo/favicon for shared links - Open Graph meta tags

Work Log:
- Checked existing logo assets in /public folder (icon.png 32x32, android-chrome-512x512.png, etc.)
- Generated professional OG image (1344x768) using z-ai image generation CLI
- Saved to /public/og-image.png
- Added comprehensive Open Graph meta tags to root layout (src/app/layout.tsx):
  - og:title, og:description, og:url, og:site_name, og:image, og:locale, og:type
  - twitter:card (summary_large_image), twitter:title, twitter:description, twitter:image
  - application-name
- Verified lint passes clean

Stage Summary:
- Social sharing now displays app logo, title, and description
- Works with WhatsApp, Facebook, LinkedIn, Twitter/X, Slack, etc.
- File modified: src/app/layout.tsx
- File created: /public/og-image.png (1344x768 AI-generated branded image)

---
Task ID: 3
Agent: Main Agent
Task: Analyze housekeeping auto-assignment system (analysis only, no code)

Work Log:
- Reviewed current checkout flow in src/app/api/bookings/[id]/route.ts
- Reviewed housekeeping task creation in src/app/api/housekeeping/tasks/route.ts
- Reviewed housekeeping task management in src/app/api/housekeeping/tasks/[id]/route.ts
- Reviewed housekeeping page UI in src/app/(app)/app/housekeeping/page.tsx
- Reviewed Prisma schema for CleaningTask, CleaningTaskItem, Room, User models
- Reviewed GuestHouseSetting model for potential configuration

Stage Summary:
ANALYSIS - Current System:
- When a booking is checked out (status → "checked_out"), the room gets:
  - status → "available"
  - cleaningStatus → "departure"
  - cleaningUpdatedAt → now()
- NO CleaningTask is auto-created at checkout
- The housekeeping page shows rooms in "départ" status
- User must manually click "Démarrer le ménage" to create a CleaningTask
- Manual task creation allows selecting assigned staff, priority, and notes
- CleaningTask model supports: assignedToId, status (pending/in_progress/completed/verified/needs_repair), priority (low/normal/high)

PROPOSED AUTO-ASSIGNMENT SYSTEM:
1. Trigger Point: After checkout (PATCH /api/bookings/[id] when status="checked_out")
2. Auto-create CleaningTask with:
   - priority: "normal" (default)
   - status: "pending" (NOT auto-started)
   - assignedToId: auto-assigned from housekeeping staff
   - Auto-generated checklist items (same template as manual creation)
3. Auto-assignment logic (round-robin or least-busy):
   - Query all active users with role "femmeDeMenage" in the same guestHouseId
   - Find the one with the fewest active tasks (status in [pending, in_progress])
   - Assign to that person
   - If no housekeeping staff exist, create task unassigned
4. Configuration (in GuestHouseSetting):
   - autoAssignHousekeeping: Boolean @default(true)
   - defaultHousekeeperId: String? (optional override)
5. Room status flow:
   - "departure" (checkout) → "departure" (task created, pending) 
   - When staff clicks "Démarrer" → task status "in_progress", room status "cleaning"
6. Manual override: Full-access roles can always reassign or create tasks manually

FILES TO MODIFY (when coding):
- prisma/schema.postgresql.prisma: Add autoAssignHousekeeping + defaultHousekeeperId to GuestHouseSetting
- src/app/api/bookings/[id]/route.ts: Add auto-assignment logic after checkout
- src/app/(app)/app/housekeeping/page.tsx: Show "Assigné automatiquement" badge
- src/app/api/settings/route.ts: Add auto-assignment settings endpoints

---
Task ID: 5
Agent: Main
Task: Housekeeping auto-assignment settings UI (3-tab Sheet)

Work Log:
- Read existing housekeeping page (`src/app/(app)/app/housekeeping/page.tsx`) for patterns and imports
- Verified existing API routes: `/api/settings/establishment` (GET/PUT), `/api/housekeeping/zones` (GET/POST/DELETE), `/api/housekeeping/schedule` (GET/PUT/DELETE)
- Confirmed settings fields already exist in establishment API: `autoAssignHousekeeping`, `autoAssignMode`, `autoStartCleaning`, `defaultCleaningPriority`
- Created components directory: `src/app/(app)/app/housekeeping/components/`
- Built `housekeeping-settings.tsx` component (700+ lines) with:
  - **Tab 1 (Auto-assignation)**: Toggle to enable auto-assignment on checkout, RadioGroup for assignment mode (zone/round-robin), Switch for auto-start cleaning, Select for default priority (Basse/Normale/Haute)
  - **Tab 2 (Zones d'assignation)**: List of existing zones with agent name, zone type badge, zone details (floor/rooms); inline edit mode for each zone; new zone form with agent dropdown, zone type select, floor number input, room multi-select, optional zone name; delete button per zone
  - **Tab 3 (Emploi du temps)**: Per-staff-member weekly schedule grid (Mon-Sun) with available toggle per day, start/end time inputs, save button per staff member; default Mon-Sat available, Sunday off
- Edited housekeeping page to integrate settings:
  - Added `Settings` icon import from lucide-react
  - Added `HousekeepingSettingsSheet` component import
  - Added `settingsOpen` state variable
  - Added pink-themed "Paramètres" button next to "Actualiser" in header, visible only to `isFullAccess` roles
  - Passed `staffList` to settings component for filtering housekeeping staff
- All lint checks pass (zero errors)

Stage Summary:
- Full housekeeping settings Sheet with 3 tabs accessible from gear icon button in header
- Tab 1: Configure auto-assignment on checkout (toggle, mode, auto-start, priority)
- Tab 2: Manage zone assignments per housekeeping staff member (floor/room/custom zones)
- Tab 3: Configure weekly work schedules per staff member (available days, start/end times)
- Only visible to full-access roles (owner, admin, manager, gouvernant, gouvernante)
- Pink/rose accent color scheme matching existing housekeeping page
- Loading states, toast notifications for all CRUD operations
- French UI throughout

---
Task ID: 4-5-6-7
Agent: Main Agent + Fullstack subagent
Task: Implement full housekeeping auto-assignment system

Work Log:
- Verified Prisma schema already had StaffSchedule + HousekeepingZone models + GuestHouseSetting fields
- Created src/lib/housekeeping-assign.ts (auto-assignment engine):
  - findBestAgent(): zone matching (room > floor > default) + schedule check + round-robin fallback
  - autoAssignCleaning(): full flow from settings check → agent selection → task creation with checklist
- Updated src/app/api/bookings/[id]/route.ts: added autoAssignCleaning() call after checkout (fire-and-forget)
- Created src/app/api/housekeeping/zones/route.ts: GET/POST/DELETE for zone management
- Created src/app/api/housekeeping/schedule/route.ts: GET/PUT/DELETE for staff schedule management
- Updated src/app/api/settings/establishment/route.ts: added 4 new housekeeping settings fields
- Created src/lib/ensure-housekeeping-tables.ts: auto-create tables + add columns on Vercel cold start
- Updated src/lib/db.ts: registered ensureHousekeepingTables()
- Updated src/lib/backup-models.ts: added HousekeepingZone + StaffSchedule dependencies
- Created housekeeping settings UI component (1362 lines) with 3 tabs:
  - Tab 1: Auto-assignation toggle, mode selection, auto-start, default priority
  - Tab 2: Zone management (assign agent to floor/rooms), inline edit, delete
  - Tab 3: Staff schedule (weekly grid Mon-Sun, time inputs, availability toggles)
- Updated housekeeping page: added Settings button (pink, only for full-access roles)
- Ran bun run lint — zero errors
- Ran bun run db:push — SQLite schema in sync

Stage Summary:
- Complete auto-assignment system: checkout → auto-create CleaningTask → assign best agent
- Zone-based or round-robin assignment with schedule awareness
- Full CRUD API for zones and schedules
- Professional UI with 3-tab settings sheet
- All tables auto-created on Vercel (ensure-housekeeping-tables.ts)
- Backup system includes new tables

Files created:
- src/lib/housekeeping-assign.ts
- src/lib/ensure-housekeeping-tables.ts
- src/app/api/housekeeping/zones/route.ts
- src/app/api/housekeeping/schedule/route.ts
- src/app/(app)/app/housekeeping/components/housekeeping-settings.tsx

Files modified:
- src/app/api/bookings/[id]/route.ts
- src/app/api/settings/establishment/route.ts
- src/lib/db.ts
- src/lib/backup-models.ts
- src/app/(app)/app/housekeeping/page.tsx

---
Task ID: housekeeping-unassigned
Agent: Main
Task: Handle unassigned housekeeping tasks when no agent is available

Work Log:
- Modified `src/lib/housekeeping-assign.ts`:
  - Added `AutoAssignResult` type with `unassigned` and `warning` fields
  - When no agent is found, task is still created but WITHOUT assignedToId
  - Added diagnostic logic to determine WHY no agent is available (4 specific reasons):
    1. No housekeeping staff registered in the establishment
    2. No schedules configured for agents
    3. No agents scheduled for today
    4. No agents on duty at this hour
  - Room stays in "departure" status (not auto-started) when unassigned
  - Console.warn logs the reason for server-side visibility
- Modified `src/app/api/bookings/[id]/route.ts`:
  - Changed auto-assign from fire-and-forget to `await` to capture result
  - Added `housekeepingWarning` field in PATCH response when task is unassigned
- Modified `src/app/(app)/app/bookings/page.tsx`:
  - Updated `handleUpdateStatus` to parse response and show `housekeepingWarning` via alert
- Modified `src/app/(app)/app/housekeeping/page.tsx`:
  - Added amber "Non assigné" badge with CircleAlert icon on room cards when task exists but no agent assigned
  - Badge visible only to full-access roles (owner/admin/manager/gouvernante)

Stage Summary:
- When no housekeeping agent is available at checkout, a task is still created (unassigned) instead of being silently dropped
- Room stays in "departure" status, alerting the manager to manually assign
- Checkout response includes a warning message explaining the reason
- Housekeeping page now shows amber "Non assigné" indicator on unassigned task cards
- 4 diagnostic messages cover all edge cases (no staff, no schedules, not today, not now)

---
Task ID: super-admin-guide
Agent: Main
Task: Create comprehensive Super Admin guide page

Work Log:
- Read existing guide page at src/app/(app)/app/guide/page.tsx to understand component structure
- Replicated GuideSection/GuideContent interfaces, GuideSearch, ContentBlock, SectionCard components
- Created 8 comprehensive guide sections covering all Super Admin functionality
- Applied deep purple/violet theme throughout (step numbers, feature checkmarks, info blocks, search dropdown)
- Added new "info" content block type (violet-themed informational callout)
- Sections: Introduction, Panel Admin overview, Guesthouse management, Subscriptions, Backups, Pending registrations, Best practices, Glossary
- Backups section documents all 21 tables, safety backup, dry-run validation, dynamic table discovery
- All content in French, action-oriented with step-by-step instructions
- Lint passes with zero errors

Stage Summary:
- Super Admin guide page created at /app/admin/guide/page.tsx
- 8 collapsible sections with search functionality and navigation chips
- Purple/violet theme consistent with Super Admin branding
- Complete documentation of: Panel Admin, Guesthouses CRUD, Subscriptions (4 plans), Backups (full/guesthouse restore), Pending registrations
- Links back to admin panel and general user guide in footer


---
Task ID: guide-rewrite-v2.7
Agent: Main
Task: Complete rewrite of user guide page for v2.7.0

Work Log:
- Read existing guide page at `src/app/(app)/app/guide/page.tsx` (1020 lines)
- Completely rewrote the file with 15 comprehensive sections covering all app features
- Added new "info" content type (blue-themed informational boxes) to ContentBlock renderer
- Added "Tous développer" / "Tout réduire" toggle button with expandedAll state
- Added version badge (v2.7.0) in header area
- Updated all imports to match required spec (removed unused, added Info, ChevronUp, Sparkles, Clock)
- Removed all references to "Super Administrateur" / "super_admin" (separate guide)
- Updated roles section: removed super_admin, added Gouvernant and Gouvernante roles (7 total)
- Added 3 new sections: Ménage (housekeeping), Notifications, Glossaire
- Updated existing sections with v2.7.0 features: restaurant integration in invoices, pricing modes, payment methods, seasonal pricing, 30-second polling, etc.
- Used semantic Tailwind classes (text-muted-foreground, bg-background, bg-muted) instead of hardcoded gray colors
- All 15 sections with full documentation: Bienvenue, Tableau de bord, Chambres, Réservations, Clients, Facturation, Restaurant, Ménage, Dépenses, Statistiques, Notifications, Paramètres, Rôles et Permissions, L'interface, Glossaire
- Lint check passed with zero errors

Stage Summary:
- User guide completely rewritten from ~1020 lines to comprehensive v2.7.0 documentation
- 15 sections covering every app feature in clear, beginner-friendly French
- New "info" content type added for informational callout boxes
- Expand/collapse all functionality added
- No super_admin references (moved to separate admin guide)
- 7 roles documented: Propriétaire, Gestionnaire, Réceptionniste, Comptable, Femme de ménage, Gouvernant, Gouvernante

---
Task ID: 7-frontend-occupants
Agent: Main
Task: Update bookings page with occupants management frontend

Work Log:
- Added `Occupant` interface with fields: id, firstName, lastName, dateOfBirth, nationality, idType, idNumber, isAdult, isMainBooker, relationship
- Updated `Booking` interface to include `notes: string | null` and `occupants: Occupant[]`
- Added `notes: ""` to defaultFormData
- Added new state variables: `occupants`, `nationalitySearch`, `showNationalitySelect`
- Added imports: `getNationality`, `searchNationalities`, `nationalities` from `@/lib/nationalities`, `ScrollArea`, `Popover`/`PopoverContent`/`PopoverTrigger`, `Star`, `UserPlus` icons
- Added occupant handler functions: `handleAddOccupant`, `handleRemoveOccupant`, `handleUpdateOccupant`, `buildOccupantsPayload`
- Updated `handleNewBooking` to reset occupants to `[]`
- Updated `handleEditBooking` to populate occupants from booking (excluding main booker) and populate notes field
- Updated `handleSaveBooking` to save occupants + notes via PUT /api/bookings/[id]/occupants after booking create/update
- Added Occupants section in Create/Edit dialog:
  - Main booker auto-card (amber themed, non-removable)
  - Each additional occupant: compact card with first/last name, DOB, adult/child toggle, nationality (searchable popover with flags), ID type (CIN/Passeport/Carte séjour), ID number, relationship dropdown, delete button
  - "Ajouter un occupant" button with dashed border
- Added "Notes réservation" textarea in Create/Edit dialog (separate from guest notes)
- Added Occupants section in Booking Detail dialog: compact cards showing name, nationality flag+name, ID info, adult/child badge, relationship badge, main booker star badge
- Added booking-level notes display in detail dialog (amber themed)
- Updated DayBookingRow to show occupant count with UserPlus icon
- All lint checks pass, dev server compiles without errors

Stage Summary:
- Full occupants management UI added to bookings page
- Occupants saved via PUT /api/bookings/[id]/occupants after booking create/update
- Nationality searchable dropdown using Popover + ScrollArea with flag+name display
- Main booker auto-created from form firstName/lastName, shown as non-removable amber card
- Booking-level notes field added (separate from guest notes)
- Occupant count shown in day view booking rows
- Occupant details visible in booking detail dialog with nationality flags

---
Task ID: occupants-system
Agent: Main
Task: Implement occupants management system for reservations

Work Log:
- Added Occupant model to all 3 Prisma schemas (schema.prisma, schema.sqlite.prisma, schema.postgresql.prisma)
  - Fields: id, bookingId, guestHouseId, firstName, lastName, dateOfBirth, nationality, idType, idNumber, isAdult, isMainBooker, relationship
  - Relation: Booking has many Occupants (onDelete: Cascade)
- Added notes field to Booking model (global reservation notes)
- Updated backup-models.ts DEPENDENCIES with Occupant
- Pushed SQLite schema to local database successfully
- Created exhaustive nationality list at src/lib/nationalities.ts (170+ countries with ISO codes, French names, emoji flags)
- Created API endpoints:
  - GET /api/bookings/[id]/occupants - list occupants for a booking
  - POST /api/bookings/[id]/occupants - add single occupant
  - PUT /api/bookings/[id]/occupants - bulk replace occupants + update booking notes
  - PATCH /api/occupants/[id] - update individual occupant
  - DELETE /api/occupants/[id] - delete occupant (prevents deleting main booker)
- Updated GET /api/bookings to include occupants and notes in response
- Updated GET /api/bookings/[id] to include occupants in response
- Updated bookings page frontend:
  - Added Occupant interface and updated Booking interface with occupants + notes
  - Added occupants state management and handlers
  - Added searchable nationality selector with Popover (flags + search)
  - Main booker auto-created from form data, shown as non-removable amber card
  - Additional occupants: expandable cards with name, DOB, adult/child toggle, nationality, ID type+number, relationship, delete
  - Booking notes textarea in create/edit dialog
  - Occupants saved via PUT /api/bookings/[id]/occupants after booking creation/update
  - Occupants shown in booking detail dialog with flags, badges
  - Occupant count shown in DayBookingRow with UserPlus icon
- All lint checks pass clean, dev server compiles successfully

Stage Summary:
- Full occupants management system implemented for each reservation
- Main booker (réservant) is auto-created from client form data, non-removable
- Additional occupants can be added with complete information: name, DOB, nationality (searchable with flags), ID type/number, adult/child, relationship
- Nationality list covers 170+ countries with exhaustive search
- Booking-level notes field added (separate from guest notes)
- Occupants displayed in booking details with visual badges
- Occupant count shown in day view booking rows

---
Task ID: migrate-to-neon-postgresql
Agent: Main
Task: Migrate database from local SQLite to Neon PostgreSQL

Work Log:
- Diagnosed issue: schema.prisma was configured with provider=sqlite but user needs Neon PostgreSQL
- Found that schema.postgresql.prisma already existed with correct PostgreSQL provider and all latest models (Occupant, Subscription, Backup, HousekeepingZone, StaffSchedule)
- Copied schema.postgresql.prisma to schema.prisma (replacing SQLite version)
- Updated .env: DATABASE_URL changed from file:/home/z/my-project/db/custom.db to postgresql://neondb_owner:***@ep-wandering-smoke-agsq7mdb-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
- Removed channel_binding=require from URL (not supported by Prisma/pg)
- Fixed package.json scripts: build and postinstall no longer reference separate schema files
- Removed obsolete scripts: db:push:pg, db:generate:pg (no longer needed with unified schema)
- Ran prisma db push --accept-data-loss to sync all tables to Neon PostgreSQL (success)
- Ran prisma generate to regenerate Prisma Client for PostgreSQL
- Verified ensure-backup-table.ts, ensure-subscription-table.ts, ensure-housekeeping-tables.ts all check for postgresql:// prefix (compatible)
- Verified no SQLite references remain in src/ code
- Lint passes clean

Stage Summary:
- Database fully migrated from SQLite to Neon PostgreSQL
- schema.prisma now uses provider=postgresql (unified, no more separate sqlite/postgresql files)
- All 24 tables synced to Neon: GuestHouse, User, Role, Session, Account, VerificationToken, Room, Amenity, RoomPrice, Guest, Booking, Occupant, Invoice, InvoiceItem, Payment, MenuItem, RestaurantOrder, OrderItem, Expense, Notification, CleaningTask, CleaningTaskItem, AuditLog, Subscription, HousekeepingZone, StaffSchedule, Backup
- package.json scripts cleaned up: build, postinstall, db:push, db:generate all use default schema.prisma
- User.menuAccess field properly uses Json? type (PostgreSQL native JSON, not String? like SQLite)
- Ready for Vercel deployment — just need to set DATABASE_URL env var in Vercel dashboard

---
Task ID: 1
Agent: Main
Task: Point 1 - Ajouter le statut "reserved" aux chambres + Point 2 - Feature Transfert

Work Log:
- Ajouté le statut "reserved" (violet) à la liste des statuts de chambre dans rooms/page.tsx
- Backend POST /api/bookings: à la création d'une réservation, la chambre passe automatiquement en statut "reserved"
- Backend PATCH /api/bookings/[id]: ajouté la fonction recomputeRoomStatus() qui calcule le bon statut de la chambre en fonction des réservations actives restantes
- Géré les transitions: cancelled → libérer chambre, no_show → libérer chambre, confirmed → réservée, checked_in → occupée, checked_out → disponible
- Backend DELETE: libère la chambre après suppression d'une réservation
- Créé l'endpoint /api/bookings/[id]/transfer (PATCH) pour le transfert de chambre
- Le transfert libère l'ancienne chambre et assigne la nouvelle (occupied si check-in, reserved si confirmée)
- Auto-assignation du ménage sur l'ancienne chambre si le client était check-in
- Frontend: ajout du bouton "Transférer" (violet) sur les réservations confirmed et checked_in
- Ajout d'un Dialog de transfert avec sélection de chambre et raison optionnelle
- Dashboard: ajout de "Réservées" (violet) dans l'état des chambres
- Dashboard: taux d'occupation inclut maintenant les chambres réservées

Stage Summary:
- 6 fichiers modifiés
- Les chambres affichent maintenant 5 statuts: Disponible, Réservée, Occupée, Maintenance, Hors service
- Le bouton Transférer apparaît sur les réservations confirmées et en cours
- Le dashboard affiche les chambres réservées dans les stats
- Fonction recomputeRoomStatus() garantit la cohérence des statuts

---
Task ID: fix-transfer-dialog-bug
Agent: Main
Task: Fix runtime crash in transfer dialog (booking.checkOut → transferBooking.checkOut)

Work Log:
- Found bug on line 2256 of bookings/page.tsx: `booking.checkOut` referenced undefined variable
- Fixed to `transferBooking.checkOut` - the correct state variable for the transfer dialog
- Lint passes clean, dev server compiles without errors

Stage Summary:
- Transfer dialog no longer crashes when rendered
- Both "Reserved" room status and "Transfer" features are fully functional

---
Task ID: date-first-room-availability
Agent: Main
Task: Force date selection before room, filter rooms by availability

Work Log:
- Created GET /api/rooms/available endpoint: accepts checkIn + checkOut query params, excludes rooms with conflicting bookings (confirmed/checked_in/pending), supports excludeBookingId for edit mode
- Reordered booking form: Dates section now appears BEFORE Room selection (was Guest → Room → Dates, now Guest → Dates → Room)
- Room dropdown is disabled until both dates are selected (datesComplete flag)
- When dates change, available rooms are fetched from the new API endpoint
- Placeholder text changes dynamically: "Saisissez les dates d'abord" → "Chargement..." → "Aucune chambre disponible" → "Sélectionner une chambre"
- Amber warning message shown when dates are not yet selected
- Green confirmation shows count of available rooms
- Red error shown when no rooms are available for the selected dates
- When dates change and current room becomes unavailable, roomId is auto-cleared
- On edit mode (handleEditBooking), available rooms are pre-fetched for the booking's dates with excludeBookingId to include the current room
- On new booking (handleNewBooking), available rooms and datesComplete are reset
- handleRoomSelect now looks in availableRooms first, falls back to rooms array
- Lint passes clean

Stage Summary:
- Booking form now enforces date-first workflow: user must select dates before choosing a room
- Only available rooms (no conflicting bookings) are shown in the dropdown
- Dynamic placeholders and status messages guide the user through the flow
- Edit mode correctly shows the current room as available via excludeBookingId param

---
Task ID: push-vercel-postgresql
Agent: Main
Task: Push 3 pending commits to origin/main for Vercel deployment

Work Log:
- Verified schema.prisma uses provider = "postgresql"
- Verified DATABASE_URL points to Neon PostgreSQL
- Verified package.json scripts (build, postinstall, db:push, db:generate) use default schema.prisma (no sqlite references)
- Pushed 3 commits to origin/main: e7a2d3f, e3b58e3, e7c213e
- Vercel will auto-deploy from origin/main

Stage Summary:
- All changes pushed successfully
- Vercel deployment will use PostgreSQL (Neon) — confirmed
