# Branded Full-Bleed Splash Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the default Expo splash with a dark premium full-bleed “Just Todos” image and keep it visible until auth bootstrap finishes.

**Architecture:** Native splash is configured via the `expo-splash-screen` config plugin (`app.json` + `assets/images/splash.png`). JS calls `SplashScreen.preventAutoHideAsync()` at module scope in `src/app/_layout.tsx`, then `hideAsync()` when `useAuth().status !== 'bootstrapping'`. No new routes; bootstrap UI is a black underlay (not a branded spinner).

**Tech Stack:** Expo SDK 57, `expo-splash-screen` ~57.0.4, Expo Router, existing `AuthContext` status machine.

**Spec:** `docs/superpowers/specs/2026-07-20-splash-screen-design.md`

---

## File map

| File                                                | Responsibility                                                        |
| --------------------------------------------------- | --------------------------------------------------------------------- |
| Create: `assets/images/splash.png`                  | Full-bleed portrait splash art (mark + wordmark + tagline)            |
| Modify: `app.json`                                  | Plugin `expo-splash-screen` → black bg, cover, full-screen image path |
| Modify: `src/app/_layout.tsx`                       | prevent/hide splash, bootstrap underlay, comments                     |
| Delete (if unused): `assets/images/splash-icon.png` | Old Expo chevron — only after plugin no longer references it          |
| Optional: `docs/auth-flow.md`                       | One-line cold-start note (Task 5)                                     |

No new feature folder, hooks, or tests harness required. Verification = typecheck + manual cold start on a **native rebuild** (release-like preferred).

---

### Task 1: Generate splash artwork

**Files:**

- Create: `assets/images/splash.png`
- Reference (read only): `assets/images/icon.png`

- [ ] **Step 1: Generate the image**

Use the image generation tool (or equivalent) with `icon.png` as style/geometry reference.

**Prompt requirements (must all appear in the final PNG):**

- Portrait phone splash composition (~9:16), solid pure black background `#000000`
- Large white geometric faceted checkmark in the vertical center band (same family as app icon: sharp low-poly / crystal check, not a soft UI tick)
- Below the mark: wordmark **Just Todos** in clean white sans-serif
- Below the wordmark: tagline **Get things done.** in slightly smaller, muted light gray
- Generous vertical padding around mark + text so `resizeMode: cover` edge crop does not clip tagline
- No Expo logo, no blue brand plate, no extra UI chrome, no watermark
- Dark premium, minimal, high contrast

Aspect: prefer **9:16** (or closest portrait the generator allows). If the tool cannot hit 1284×2778 exactly, export the largest portrait available and save as `assets/images/splash.png`.

- [ ] **Step 2: Verify the file exists and looks correct**

```bash
ls -la assets/images/splash.png
file assets/images/splash.png
```

Expected: PNG exists, non-trivial size (hundreds of KB+), readable as PNG. Open in preview: black bg, checkmark, “Just Todos”, “Get things done.”

- [ ] **Step 3: Commit**

```bash
git add assets/images/splash.png
git commit -m "$(cat <<'EOF'
feat(splash): add dark premium full-bleed splash artwork

Branded Just Todos mark, wordmark, and tagline for native cold start.
EOF
)"
```

---

### Task 2: Wire `expo-splash-screen` in `app.json`

**Files:**

- Modify: `app.json` (plugins array entry for `expo-splash-screen`)
- Delete: `assets/images/splash-icon.png` (after config no longer points at it)

- [ ] **Step 1: Update the splash plugin block**

In `app.json`, replace the existing:

```json
[
  "expo-splash-screen",
  {
    "backgroundColor": "#208AEF",
    "image": "./assets/images/splash-icon.png",
    "imageWidth": 76
  }
]
```

with:

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

Leave other plugins (`expo-router`, Google Sign-In, `expo-secure-store`) unchanged. Do not change `icon` / adaptive icon paths.

- [ ] **Step 2: Confirm nothing else references `splash-icon.png`**

```bash
rg "splash-icon" -g '!node_modules' -g '!android/build' -g '!android/app/build'
```

Expected: no matches (or only historical docs). If only `splash-icon.png` itself remains:

```bash
rm assets/images/splash-icon.png
```

- [ ] **Step 3: Commit**

```bash
git add app.json assets/images/splash-icon.png
git commit -m "$(cat <<'EOF'
feat(splash): point expo-splash-screen at full-bleed brand art

Black background, cover resize, iOS full-screen legacy flag; drop Expo chevron asset.
EOF
)"
```

Note: `git add` on a deleted file stages the deletion. If the file was already gone, only stage `app.json`.

---

### Task 3: Hold native splash until auth bootstrap (`_layout.tsx`)

**Files:**

- Modify: `src/app/_layout.tsx`

- [ ] **Step 1: Replace the file content with the following**

Keep provider tree and `Stack.Protected` structure identical; only splash + bootstrap underlay + comments change.

```tsx
/**
 * Root layout Expo Router — provider tree + auth via Stack.Protected.
 *
 * Urutan provider (luar → dalam):
 * QueryProvider → SafeArea → Theme → Auth → NavigationLayout
 *
 * Auth routing (Expo Router 57 idiomatic):
 * 1. status === bootstrapping → underlay hitam (native splash masih di atas)
 * 2. Stack.Protected guard={authenticated} → (main) + index
 * 3. Stack.Protected guard={!authenticated} → login + register
 *
 * Splash (native):
 * - preventAutoHideAsync di module scope agar splash tetap tampil
 *   sampai AuthContext selesai hydrate SecureStore + refresh.
 * - hideAsync saat status !== bootstrapping → user langsung ke login/main,
 *   bukan spinner sebagai “ganti splash”.
 * - Setelah ganti asset/plugin di app.json: rebuild native (bukan hanya Metro).
 *
 * Docs: https://docs.expo.dev/router/advanced/authentication/
 *       https://docs.expo.dev/router/advanced/protected/
 *       https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/
 */
import { ThemeInkOverlay } from '@/components/theme/ThemeInkOverlay';
import { ConfirmDialogHost, ToastHost } from '@/components/ui';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Harus di global scope (bukan di dalam useEffect) — kalau terlambat, splash sudah auto-hide.
// Docs Expo: preventAutoHideAsync recommended at module level without awaiting registration.
SplashScreen.preventAutoHideAsync();

// Fade out native splash (fade berlaku di iOS). Duration pendek agar tidak terasa “nunggu animasi”.
SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

/**
 * Stack navigator: theme chrome + protected route groups.
 * Harus di dalam ThemeProvider + AuthProvider.
 */
function NavigationLayout() {
  const { theme, statusBarIsDark } = useAppTheme();
  const { status, isAuthenticated } = useAuth();

  // Sembunyikan splash native setelah session resolve (login atau main siap digambar).
  // void: fire-and-forget; kegagalan hide tidak boleh memblokir navigasi.
  useEffect(() => {
    if (status === 'bootstrapping') return;

    void SplashScreen.hideAsync().catch(() => {
      // Best-effort: UI tetap lanjut lewat Stack; underlay hitam mencegah flash putih.
    });
  }, [status]);

  // Native splash masih menutupi layer ini; hitam = aman jika hide race / dev client aneh.
  // Jangan ActivityIndicator mencolok — itu yang diganti splash branded.
  if (status === 'bootstrapping') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.systemBackground }}>
      {/* Freeze style selama ink (frozenDark) — status bar tidak di screenshot */}
      <StatusBar
        barStyle={statusBarIsDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.systemBackground}
      />

      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.systemBackground },
          headerTintColor: theme.colors.label,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: theme.colors.systemBackground },
        }}
      >
        {/* Area privat: hanya setelah login / session valid */}
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(main)" options={{ headerShown: false }} />
        </Stack.Protected>

        {/* Area publik auth: hanya saat belum login */}
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
          <Stack.Screen
            name="(auth)/register"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(auth)/verify-email"
            options={{ headerShown: false }}
          />
        </Stack.Protected>
      </Stack>
    </View>
  );
}

/** Entry layout file-based routing. */
export default function RootLayout() {
  return (
    <QueryProvider>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            {/* Wrapper flex-1 supaya absoluteFill ink/toast relative ke full screen */}
            <View style={{ flex: 1 }}>
              <NavigationLayout />
              {/* Toast di atas stack; butuh Theme + SafeArea di parent */}
              <ToastHost />
              {/* Confirm delete/dialog — imperative confirmDestructive */}
              <ConfirmDialogHost />
              {/* Ink reveal canvas — full screen di atas konten saat animasi */}
              <ThemeInkOverlay />
            </View>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryProvider>
  );
}
```

- [ ] **Step 2: Typecheck / lint the touched file**

```bash
npx tsc --noEmit
bun run lint -- src/app/_layout.tsx
```

Expected: no new errors in `_layout.tsx`. (Repo-wide pre-existing lint noise is out of scope.)

- [ ] **Step 3: Commit**

```bash
git add src/app/_layout.tsx
git commit -m "$(cat <<'EOF'
feat(splash): hold native splash until auth bootstrap completes

Prevent auto-hide at module scope; hide when status leaves bootstrapping;
black underlay and comments for future readers.
EOF
)"
```

---

### Task 4: Native rebuild + manual verification

**Files:** none (ops)

- [ ] **Step 1: Rebuild native so the plugin + image bake in**

Dev client / release-like (pick what the machine has). Examples:

```bash
# iOS simulator (if Mac + pods OK)
npx expo run:ios

# Android
npx expo run:android
```

**Do not** claim splash art is verified from Metro-only reload after `app.json` change.

Expected: build succeeds; app installs.

- [ ] **Step 2: Cold-start checklist**

| Scenario                                | Expected                                                |
| --------------------------------------- | ------------------------------------------------------- |
| Logged out, kill app, reopen            | Branded black splash (no Expo chevron) → login          |
| Logged in (valid session), kill, reopen | Same splash → todos (or main), no long spinner as brand |
| Airplane mode with stale refresh        | Splash until refresh fails → login                      |

Notes from Expo docs (SDK 52+): Expo Go / some dev builds may not fully match production splash. Prefer release build if visual mismatch is reported.

- [ ] **Step 3: Commit only if rebuild produced intentional project changes**

If `ios/` / `android/` native projects in-repo picked up splash resources and those folders are tracked:

```bash
git status
# stage only splash-related native diffs if project policy tracks them
git add android/app/src/main/res app.json   # example — use actual paths from status
git commit -m "$(cat <<'EOF'
chore(splash): sync native splash resources after prebuild
EOF
)"
```

If native dirs are gitignored or unchanged after `expo run`, skip this commit.

---

### Task 5 (optional): Auth-flow doc one-liner

**Files:**

- Modify: `docs/auth-flow.md` (section “Ringkasan 30 detik” or cold-start bullet)

- [ ] **Step 1: Add one factual row/bullet**

In the summary table (near “Restart app?”), ensure cold start mentions splash:

| Restart app? | Hydrate SecureStore → `POST /auth/refresh` jika ada refresh; **native splash tetap tampil sampai status lepas `bootstrapping`** |

Or add under architecture:

> Cold start: native splash (`expo-splash-screen`) di-hold via `preventAutoHideAsync` di `src/app/_layout.tsx` sampai auth bootstrap selesai.

Do not rewrite the whole doc.

- [ ] **Step 2: Commit**

```bash
git add docs/auth-flow.md
git commit -m "$(cat <<'EOF'
docs(auth): note splash held until bootstrap on cold start
EOF
)"
```

---

## Spec coverage checklist (plan self-review)

| Spec requirement                                                          | Task                                  |
| ------------------------------------------------------------------------- | ------------------------------------- |
| Full-bleed dark art, mark + Just Todos + tagline                          | Task 1                                |
| `assets/images/splash.png`, drop Expo `splash-icon`                       | Task 1–2                              |
| `app.json` plugin keys (black, cover, legacy full-screen, imageWidth 300) | Task 2                                |
| `preventAutoHideAsync` module scope                                       | Task 3                                |
| `hideAsync` when not bootstrapping                                        | Task 3                                |
| Bootstrap underlay not spinner-as-brand                                   | Task 3                                |
| Comments for future readers                                               | Task 3                                |
| Native rebuild + cold start verify                                        | Task 4                                |
| Optional auth-flow note                                                   | Task 5                                |
| No onboarding routes / no JS animated splash                              | (explicit non-goals; not in any task) |

## Execution notes for implementers

- Package already includes `expo-splash-screen` — do **not** reinstall unless missing.
- Hardcoded `#000000` on bootstrap underlay is intentional (match splash plate while theme may still be resolving); do not switch to `theme.colors.systemBackground` for that underlay.
- Do not add artificial minimum splash delay.
- Do not log tokens or session payloads near splash code.
