# Solid HIG materials in v1 (no blur chrome)

**Status:** accepted  
**Date:** 2026-07-18

Hierarchy is expressed with **opaque** system backgrounds, grouped backgrounds, fills, and separators — not translucent toolbars/sheets. Blur/vibrancy may be tokenized later but is **not** the v1 product look.

**Why:** Full redesign + full color table + fluid motion is already large. Blur is platform-uneven and costly; solid HIG surfaces deliver most of the “iOS app” read with less risk.

**Consequences:** Prefer separator + fill over heavy shadows; do not block the redesign on `BlurView` / `expo-glass-effect` adoption.
