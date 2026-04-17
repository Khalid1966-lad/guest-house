# Worklog

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
