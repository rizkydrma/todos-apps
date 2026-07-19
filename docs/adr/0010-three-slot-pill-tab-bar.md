# Three-slot pill: Home | + create | Profile

**Status:** accepted  
**Date:** 2026-07-19

Member tab shell is **Home**, a center **create action** (not a route), and **Profile**. Categories, Tags, and Search tab screens are removed from the shell.

**Why:** Minimize chrome; one primary create path always available; Search covered by Home filters. Center + is a filled primary control without selection indicator (action, not tab).

**Consequences:** Create form is hosted by `TodoCreateProvider` on `(tabs)/_layout`. No in-app screens to manage category/tag catalogs until reintroduced (e.g. from Profile). Assigning existing categories/tags on todo form remains via API list hooks.

**Stacking:** Center + is a sibling above the pill (`zIndex` / Android `elevation` higher than the capsule). Do not remount the pill on theme toggle (`key={isDark…}`) — remount resets native draw order and can bury the + behind the bar.
