# Full HIG visual redesign (retire X-like brand)

**Status:** accepted  
**Date:** 2026-07-18

The product previously shipped an X-like brand (pure black/white canvas, `#1D9BF0`, pill CTAs, floating labels, dark-first). We decided to **replace that brand entirely** with an Apple HIG–faithful visual language across tokens, primitives, and screens — not “keep X and improve tokens only.”

**Why:** The goal of the design-system work is Apple-grade craft and familiarity. Keeping X blue/pills while adding HIG surfaces produces a confused hybrid. A full redesign costs more once, but gives one coherent language.

**Considered:** (A) craft-under-X tokens only, (B) soft Apple lean with custom accent, (C) full HIG redesign — chose C.

**Consequences:** `docs/styling-guide.md` and X-like specs become historical; all color/control/list patterns must migrate in one vertical slice to avoid mixed UI on `main`.
