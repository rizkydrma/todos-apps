# Cold start: single native splash hold until destination

**Status:** superseded (simplified 2026-07-20)  
**Date:** 2026-07-20

Originally accepted a destination-gated native splash hold (auth bootstrap + pathname Login/todos, 15s timeout, no index hop). That over-scoped a simple branding request and caused flaky double-splash / white-flash behavior during iteration.

**Current decision:** splash is **asset + config only** — `app.json` `expo-splash-screen` points at branded `assets/images/splash.png` with black background. OS auto-hides when JS is ready. Auth bootstrap stays the previous simple spinner path; no `preventAutoHideAsync` / JS splash cover / destination-gated hide.

**Why simplify:** User only needed non-Expo-default splash art. Complex hold logic is optional polish, not required for brand.
