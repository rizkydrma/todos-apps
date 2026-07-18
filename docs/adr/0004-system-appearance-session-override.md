# System appearance default with session-only override

**Status:** accepted  
**Date:** 2026-07-18

Theme **defaults to the OS** light/dark scheme. `ThemeToggle` sets a **session-only** override (`light` | `dark`). The override is not persisted. If the OS scheme changes while an override is active, the **override wins** until process death.

**Why:** Dark-first was an X-brand choice. HIG apps behave as system citizens. Persisted three-way appearance (`system` | `light` | `dark`) is better long-term product behavior but is a second feature; session override keeps the lesson control without storage complexity.

**Consequences:** Restart restores system appearance; no SecureStore/AsyncStorage for theme in this pass.
