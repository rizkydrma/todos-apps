# Static iOS 18 system color table as source of truth

**Status:** accepted  
**Date:** 2026-07-18

Public `theme.colors` exposes a **full HIG/UIColor-style system set** (backgrounds, fills, labels, separators, system tints, grays, link, placeholder) plus thin app aliases (`primary`, `destructive`, `onPrimary`). Values come from a **version-pinned static table** for **iOS 18** light/dark resolved hex in-repo — not a runtime native `UIColor` bridge, and not an ever-growing hand-edited ad hoc map without a pin.

**Why:** Full system coverage needs a closed, reviewable inventory. Runtime bridging is more accurate on iOS but adds native complexity and Android skew. A pin makes updates deliberate (bump pin in a PR).

**Considered:** lean curated ladder; runtime bridge; unpinned “add keys as we go.”

**Consequences:** Android uses the same HIG-inspired table (not Material You). Pin bumps are explicit ADRs or PR notes; implementers must not invent one-off hex in screens.
