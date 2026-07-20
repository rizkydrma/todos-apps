# System appearance default with persisted override

**Status:** accepted (amended)  
**Date:** 2026-07-18 · **Amended:** 2026-07-20

Theme **defaults to the OS** light/dark scheme. `ThemeToggle` sets an explicit override (`light` | `dark`). The override is **persisted** in AsyncStorage (`appearance.override`) so it survives process death / app restart.

If the OS scheme changes while an override is active, the **override wins** until the user toggles again or clears the preference (API: `clearOverride` / `clearThemePreference`).

**Why (original):** Dark-first was an X-brand choice. HIG apps behave as system citizens. A three-way appearance control (`system` | `light` | `dark`) is the long-term product model.

**Why amend (2026-07-20):** Session-only override felt broken in practice — user picks dark on login, kills the app, reopens, and gets light again. Preference is non-secret, so AsyncStorage is appropriate (not SecureStore). Hydrate on `ThemeProvider` mount; splash still covers cold start until auth finishes, so flash risk is low.

**Consequences:** Restart restores the last chosen light/dark if set; otherwise system. No UI yet for “Match system” (use `clearOverride` when product needs it). Full three-way picker remains a future feature.
