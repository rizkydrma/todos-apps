# Design: Branded Full-Bleed Splash Screen

**Date:** 2026-07-20  
**Status:** Approved (design review)  
**App:** Just Todos (`apps`) — Expo SDK 57

## Problem

Cold start still shows the default Expo splash treatment: `assets/images/splash-icon.png` is the Expo chevron, and `app.json` uses a blue background (`#208AEF`). There is no branded full-screen splash, and no coordination with auth bootstrap — after the native splash auto-hides, users can briefly see the bootstrapping spinner.

## Goals

1. Replace Expo default splash with a **dark premium, full-bleed** branded image (mark + wordmark + tagline).
2. Keep the native splash visible until auth leaves `bootstrapping` so the first real screen is login or main — no intentional “spinner as splash” flash.
3. Document the wiring with clear Indonesian + technical comments for future readers.

## Non-goals

- First-launch onboarding carousel / product tour
- Changing app icon, adaptive icon, or favicon (except splash asset)
- JS-driven animated splash screen after native hide
- Per-theme dual splash art (light/dark pair) — single dark premium art for all launches

## Decisions (locked)

| Topic          | Choice                                                           |
| -------------- | ---------------------------------------------------------------- |
| Visual style   | Dark premium (black / near-black, large checkmark)               |
| Content        | Mark + “Just Todos” + tagline **“Get things done.”**             |
| Asset source   | Generate new artwork (aligned with existing `icon.png` geometry) |
| Implementation | Native splash + `preventAutoHideAsync` until auth ready          |
| Routing        | No new Expo Router screens                                       |

## Architecture

```
Cold start
  → Native splash (full-bleed dark art) shown by OS / Expo
  → JS entry: SplashScreen.preventAutoHideAsync() (module scope)
  → AuthProvider: hydrate SecureStore → refresh → status authenticated | unauthenticated
  → status !== bootstrapping → SplashScreen.hideAsync()
  → Stack.Protected shows login or main
```

Splash is **branding only**, not a security boundary. Backend still authorizes; client guards remain as today.

## Asset

| Item        | Spec                                                                               |
| ----------- | ---------------------------------------------------------------------------------- |
| Path        | `assets/images/splash.png`                                                         |
| Size        | Portrait full-bleed, e.g. **1284×2778** (or equivalent high-res portrait)          |
| Background  | `#000000`                                                                          |
| Mark        | Geometric checkmark consistent with `assets/images/icon.png` (white, subtle depth) |
| Wordmark    | “Just Todos”                                                                       |
| Tagline     | “Get things done.”                                                                 |
| Legacy file | `splash-icon.png` (Expo default) — remove from plugin config; delete if unused     |

Safe composition: important mark + text stay in a vertical center band so `resizeMode: "cover"` crop on tall/short devices does not clip tagline.

## Config (`app.json`)

Update the `expo-splash-screen` plugin:

```json
[
  "expo-splash-screen",
  {
    "backgroundColor": "#000000",
    "image": "./assets/images/splash.png",
    "resizeMode": "cover",
    "enableFullScreenImage_legacy": true,
    "imageWidth": 300
  }
]
```

### Why these keys

- `backgroundColor: #000000` — no blue letterboxing if image does not cover an edge.
- `resizeMode: cover` — fill screen; slight edge crop acceptable.
- `enableFullScreenImage_legacy: true` — iOS full-screen image path (Expo SDK 57 docs; legacy flag for transition from old splash model).
- `imageWidth` — required by plugin sizing model; with full-screen / cover, composition lives primarily in the PNG itself.

**Native rebuild required** after plugin or splash image changes (`expo prebuild` / EAS / local release build). Expo Go and some dev clients do **not** fully replicate production splash (SDK 52+).

## Code changes

### `src/app/_layout.tsx`

1. **Module scope** (outside any component; do not `await` in a way that delays registration):

   ```ts
   import * as SplashScreen from 'expo-splash-screen';

   // Keep native splash until auth bootstrap finishes (docs: call in global scope).
   SplashScreen.preventAutoHideAsync();
   SplashScreen.setOptions({ duration: 400, fade: true });
   ```

2. **Hide when ready** inside `NavigationLayout` (has `useAuth().status`):

   ```ts
   useEffect(() => {
     if (status !== 'bootstrapping') {
       void SplashScreen.hideAsync();
     }
   }, [status]);
   ```

3. **Bootstrap UI:** prefer `null` or a black full-screen view while `status === 'bootstrapping'`. Keep `ActivityIndicator` only if useful as a rare fallback when splash already hid; default path should not rely on the spinner as the brand moment.

### Comments (required)

Per `AGENTS.md`:

- File header note: splash held until auth hydrate to avoid flash.
- Next to `preventAutoHideAsync`: must be global scope, not inside `useEffect`.
- Next to `hideAsync`: when it runs; native rebuild needed after asset/plugin change.

No new feature folder required (no domain API). Optional tiny helper is YAGNI — keep logic in root layout unless it grows.

## Error / edge handling

| Case                     | Behavior                                                                        |
| ------------------------ | ------------------------------------------------------------------------------- |
| Refresh fails / no token | `status → unauthenticated` → hide splash → login                                |
| Refresh succeeds         | `status → authenticated` → hide splash → main                                   |
| `hideAsync` throws       | Log/warn; UI still progresses via Stack; black/fallback view avoids blank white |
| Slow network on refresh  | Splash stays longer (acceptable); do not add artificial minimum delay           |

## Platform caveats

- **Production / release build** is the source of truth for splash appearance.
- **Android 12+** system splash API may simplify to icon + background in some OEM skins; still configure full image via Expo plugin and verify on a real release APK.
- Testing checklist: cold start logged-out, cold start logged-in, airplane mode (refresh fail → login).

## Testing / verification

1. Generate `splash.png` and wire `app.json`.
2. Wire `_layout.tsx` prevent/hide + comments.
3. Rebuild native (not only Metro reload).
4. Cold start: branded splash → correct destination without Expo logo and without spinner flash on the happy path.
5. Typecheck / lint on touched TS files.

## Implementation outline (for plan)

1. Generate and commit splash artwork.
2. Update `app.json` plugin; clean unused Expo splash asset if safe.
3. Update `src/app/_layout.tsx` (prevent, options, hide, bootstrap UI, comments).
4. Rebuild and verify on device/simulator release-like build.
5. Optional: one-line note in `docs/auth-flow.md` that cold start splash stays until bootstrap ends (only if that doc is the team’s entry for launch sequence).

## Open questions

None — design approved in brainstorming (approach 2, dark premium, mark + tagline “Get things done.”).
