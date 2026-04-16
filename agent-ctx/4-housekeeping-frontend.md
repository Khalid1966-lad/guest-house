# Task 4: Housekeeping Frontend Page

## Status: ✅ Completed

## Work Summary

Built a comprehensive, production-ready housekeeping management page at `/src/app/(app)/app/housekeeping/page.tsx` (1621 lines). This is a complete rewrite of the previous basic room-cards-only page.

## What was built

### 1. Page Header
- Title "Ménage" with Sparkles icon in pink
- Description text
- Refresh button with spinner animation

### 2. Summary Stats Bar
- Compact pill buttons for filtering: Toutes, En départ (amber), En cours (sky), Terminé (green), Vérifié (emerald)
- Active filter with ring highlight
- Count badges per status

### 3. Search Bar
- Room number and name search
- Search icon prefix

### 4. Room Cards Grid
- Responsive: 1 col mobile → 2 col tablet → 3 col desktop → 4 col XL
- Each card shows:
  - Room number + name with pink bed icon
  - Room status badge (Disponible/Occupée)
  - Cleaning status badge with colored left border
  - Assigned person name
  - Progress bar (X/Y points vérifiés)
  - Time since task started
  - Notes preview
  - Action button: "Démarrer le ménage" or "Voir la checklist"

### 5. Task Detail Sheet (right panel)
Opens when clicking on a room with an active task:
- Room info header with number, name, priority badge, status badge
- Assigned person (clickable to reassign for full-access roles)
- Time since task started
- **Progress section**: X/Y count, percentage, progress bar, "all checked" indicator
- **Checklist items grouped by 5 categories** with colored backgrounds:
  - Vérification (amber) - 3 items
  - Linge (green) - 2 items
  - Nettoyage (sky) - 3 items
  - Salle de bain (purple) - 1 item
  - Consommables (orange) - 1 item
- Each item: large 44px+ touch-friendly checkbox, green checkmark when done, label text, checked time/who, anomaly note button (!)
- General notes textarea (auto-save on blur)
- History button

### 6. Action Buttons (bottom of sheet)
- "Marquer en cours" (pink, for pending tasks)
- "Marquer terminé" (green, for in_progress)
- "Valider / Vérifier" (emerald, for completed, gouvernante/owner only)
- "Signaler une dégradation" (red outline, opens damage dialog)

### 7. Create Task Dialog
- Room number display
- Staff assignment dropdown (from /api/users)
- Priority selector (low/normal/high)
- Notes field
- Create button

### 8. Anomaly Note Dialog
- For adding notes to checklist items
- Shows current note if exists
- Clear note option
- Save button

### 9. Damage Report Dialog
- Description textarea
- Marks task as "needs_repair"
- Warning about status change

### 10. Assign Staff Dialog
- List of staff members with avatars
- Current assignment highlighted
- "Non assigné" option to unassign
- Only available for full-access roles

### 11. History Sheet (bottom drawer)
- Cleaning history per room
- Past tasks with status, assigned person, completion date, verification info

## Technical Details

- **"use client"** at top
- Uses `useSession()` for role-based access control
- Full-access roles: owner, admin, manager, gouvernant, gouvernante, super_admin
- femmeDeMenage: can create tasks, check items, mark completed, but CANNOT verify
- All API calls via fetch() to the endpoints specified
- Loading states with Loader2 spinners
- Error handling with toast notifications (using project's `useToast` hook)
- Mobile-first responsive design
- 44px+ touch targets for all interactive elements
- date-fns with fr locale for time formatting
- shadcn/ui components: Card, Badge, Button, Dialog, Sheet, Select, Textarea, Progress, Separator, ScrollArea, Label, Input, Tabs
- Lucide icons throughout
- Pink as primary theme color
- cn() utility for class merging

## API Integration Points
- `GET /api/housekeeping` - Fetch rooms with active tasks
- `GET /api/users` - Fetch staff for assignment
- `POST /api/housekeeping/tasks` - Create new cleaning task
- `GET /api/housekeeping/tasks/[id]` - Get task detail with checklist
- `PATCH /api/housekeeping/tasks/[id]` - Update task status/notes/assignment
- `PATCH /api/housekeeping/tasks/[id]/items/[itemId]` - Toggle checklist item
- `GET /api/housekeeping/history?roomId=xxx` - Get cleaning history

## Verification
- ✅ ESLint passes with no errors
- ✅ Dev server compiles successfully
- ✅ No TypeScript errors
- ✅ Uses project-standard toast hook (useToast from @/hooks/use-toast)
