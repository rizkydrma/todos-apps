# Fluid motion infrastructure applied only to existing surfaces

**Status:** accepted  
**Date:** 2026-07-18

We adopt a full fluid motion kit (Reanimated springs, press-scale, reduced-motion cross-fades, helpers for rubber-band/projection) but apply **max fidelity only to interactions that already exist** (press, toast, field focus, list item lifecycle, theme toggle). We do **not** invent sheets, drawers, or Control Center–style chrome solely to exercise springs.

**Why:** “Full fluid” without a surface map becomes scope theater. Existing auth + home surfaces still benefit from interruptible press and tokenized motion; velocity handoff lands when a real gesture needs it.

**Consequences:** Motion helpers may export projection/rubber-band APIs early; product UI must not add new gesture destinations in this redesign without a separate product decision.
