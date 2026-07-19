# Todo form floating sheet; confirm every delete

**Status:** accepted (updated 2026-07-19)  
**Date:** 2026-07-18

Create/edit todos open in a **floating sheet** (`SheetScaffold` → `BottomSheet`) mounted on the screen that opens them (Todos, Search). Not a stack push and not inline expand. **Every** delete (single todo, admin deletes) requires an explicit confirmation dialog before the mutation.

**Why:** Stay in list context (Apple secondary task). Shared chrome with filter via `SheetScaffold` (title / trailing / scroll body / footer). Discard draft on close without confirm (short form). Confirm-all-deletes kept for safety consistency.

**Consequences:** No deep-link route for edit form; each call-site owns `visible` + `todoId` state. Filter and form remount on open for clean draft state.
