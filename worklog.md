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
