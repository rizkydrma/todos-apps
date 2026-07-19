# Form sheets for todo edit; confirm every delete

**Status:** accepted  
**Date:** 2026-07-18

Create/edit todos open in a **modal form sheet**, not a full stack push and not inline expand. **Every** delete (single todo, admin deletes) requires an explicit confirmation dialog before the mutation.

**Why:** Form sheet fits dense fields without leaving list context. Confirm-all-deletes was chosen over confirm-bulk-only for safety consistency (heavier UX; accepted trade-off).

**Consequences:** Slightly higher friction on single-row delete; implement a single shared `confirmDestructive` helper to keep copy/behavior consistent.
