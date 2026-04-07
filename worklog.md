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
