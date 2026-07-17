# X-like Visual Redesign (Just Todos)

**Date:** 2026-07-17  
**Status:** Approved direction — pending user review of this spec  
**Scope:** Theme tokens + restyle all UI primitives + full restyle of login, register, home  
**Stack:** Expo SDK 57, React Native, TypeScript, existing enterprise theme foundation  
**Approach:** Token-first full restyle (single brand; no dual-theme system)

---

## 1. Problem

The app has a solid enterprise styling foundation (semantic tokens, primitives, light/dark), but the visual language is generic iOS/slate + system blue (`#007AFF`). It does not read as **X-like**: pure black/white canvas, high contrast, X blue accents, flat chrome, denser auth and list layouts.

---

## 2. Goals

1. **Dark-first** default: app opens in pure-black dark mode; light mode remains available via toggle.
2. **X-like palette** via semantic tokens only (screens never hardcode hex).
3. **Full accent** use of X blue (`#1D9BF0`) for primary buttons, links, and active/focus affordances.
4. **Restyle primitives** (`Button`, `TextField`, `AppText`, `TextButton`, `ThemeToggle`, `Screen`) to match shape language (pill CTAs, softer inputs, flat elevation).
5. **Full restyle layouts** for login, register, and home (density, hierarchy, list/composer patterns) without cloning X product surfaces (timeline, tabs, etc.).
6. Preserve enterprise rules: tokens → hooks → primitives → screens.

### Non-goals

- Multi-brand / dual theme system (no “legacy theme” switch)
- Custom font files (system fonts only; weights adjusted)
- Exact 1:1 clone of X (For You, Communities, Grok panel, side nav)
- New UI libraries (NativeWind, Tamagui, etc.)
- Complex micro-animations
- Full a11y audit beyond keeping existing touch targets and roles

---

## 3. Decisions (from brainstorming)

| Decision                | Choice                                                        |
| ----------------------- | ------------------------------------------------------------- |
| Default mode            | **A — Dark-first** (pure black dark; light still available)   |
| Accent usage            | **A — Full accent** (primary, links, focus/active use X blue) |
| Scope                   | **C — Full restyle UI** (theme + components + screen layouts) |
| Implementation approach | **1 — Token-first full restyle**                              |

---

## 4. Architecture

No new layers. Reuse existing structure:

```
Screens (login, register, home, layout)
  → UI primitives
  → useAppTheme / useThemedStyles
  → src/theme/* (colors, tokens, typography)
```

**Change surface:**

| Path                           | Change                                                           |
| ------------------------------ | ---------------------------------------------------------------- |
| `src/theme/colors.ts`          | X palette + light/dark semantic maps                             |
| `src/theme/tokens.ts`          | Radius/elevation tuning for flat + pill CTAs; keep spacing scale |
| `src/theme/typography.ts`      | Slightly stronger title hierarchy if needed                      |
| `src/context/ThemeContext.tsx` | Default **dark** on first load (dark-first), not system-first    |
| `src/components/ui/*`          | Visual restyle of primitives                                     |
| `src/app/(auth)/login.tsx`     | Auth layout restyle                                              |
| `src/app/(auth)/register.tsx`  | Auth layout restyle                                              |
| `src/app/(main)/home.tsx`      | Composer + list restyle; replace magic numbers with tokens       |
| `src/app/_layout.tsx`          | Header/status chrome to pure bg + high-contrast text             |
| `docs/styling-guide.md`        | Note X-like brand + dark-first default                           |

---

## 5. Theme tokens

### 5.1 Semantic colors

Hex lives only in `src/theme/colors.ts`.

| Token             | Dark                                                                                                                        | Light                  | Usage                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------- |
| `background`      | `#000000`                                                                                                                   | `#FFFFFF`              | Screen root                              |
| `surface`         | `#16181C`                                                                                                                   | `#F7F9F9`              | Inputs, list rows, elevated panels       |
| `text`            | `#E7E9EA`                                                                                                                   | `#0F1419`              | Primary text                             |
| `textMuted`       | `#71767B`                                                                                                                   | `#536471`              | Subtitles, placeholders, completed todos |
| `border`          | `#2F3336`                                                                                                                   | `#EFF3F4`              | Input borders, row borders, dividers     |
| `primary`         | `#1D9BF0`                                                                                                                   | `#1D9BF0`              | CTA fill, links, focus/active            |
| `primaryDisabled` | Desaturated/faded X blue (e.g. reduced opacity or `#1D9BF0` @ ~40% on dark canvas; pick solid hex in implementation for RN) | Same strategy on light | Disabled primary                         |
| `onPrimary`       | `#FFFFFF`                                                                                                                   | `#FFFFFF`              | Label on primary fill                    |
| `error`           | `#F4212E`                                                                                                                   | `#F4212E`              | Validation, delete emphasis              |
| `shadow`          | `#000000`                                                                                                                   | `#000000`              | Rarely used; prefer flat                 |

Optional during implementation (only if needed without expanding API noise):

- Keep semantic keys stable; do **not** add unused tokens “for later.”

### 5.2 Shape & elevation

- **Inputs / list rows:** radius ≈ `md`–`lg` (12–16). Prefer one consistent input radius (recommend **16** / `radius.lg` or add a named value only if scale needs it).
- **Primary CTA:** **pill** — `borderRadius: radius.full` (or height/2), full-width on auth.
- **Icon / add button:** circular or near-circular using `radius.full`.
- **Elevation:** nearly **flat**. Primary button should not rely on heavy shadow; reduce or drop `elevation('sm')` on primary if it fights the X look.

### 5.3 Typography

Keep variants: `title`, `subtitle`, `body`, `label`, `caption`, `link`.

- Title: bold, high contrast, slightly assertive on auth/home headers.
- Label (buttons): bold, readable on primary.
- Link: uses `primary` color via `AppText` / `TextButton`.
- System font only — no custom font loading in this work.

### 5.4 Spacing & size

Keep existing spacing scale (`xs`–`xxl`) and control heights (`touchMin` 44, `controlHeight` 48). Auth may use horizontal `spacing.md` or `lg` (16–24) for denser X-like canvas, not huge floating cards.

### 5.5 Dark-first behavior

In `ThemeContext`:

- Initial state: **`isDarkMode = true`** (dark-first), not `useColorScheme() === 'dark'`.
- Optional: still listen to system only if product later wants “system”; **out of scope** — do not reintroduce system-first default.
- Toggle continues to switch light ↔ dark.

---

## 6. UI primitives

### Button

- Variants unchanged: `primary` | `ghost` | `danger`.
- Primary: `backgroundColor: primary`, pill radius, `onPrimary` label, min height from `size.controlHeight`.
- Disabled: `primaryDisabled`, no press opacity feedback as active.
- Ghost: transparent, primary-colored label.
- Danger: error fill or error-emphasized style; white/onPrimary text if filled.
- Pressed opacity ≈ 0.85–0.9.
- Drop heavy elevation on primary.

### TextField

- `surface` background, `border` 1px, radius per tokens (~16).
- Placeholder: `textMuted`.
- Error: border `error` + caption error text.
- Focus border `primary` when easy with local focus state (recommended for X-like polish).

### AppText

- Unchanged API (`variant` + semantic `color`).
- Colors resolve to new token values automatically.

### TextButton

- Primary-colored link text; centered under forms; touch target ≥ 44.

### ThemeToggle

- Keep `text` | `icon` variants.
- Icon: monochrome chrome on `surface` + `border` (avoid playful multi-color iOS vibe). Emoji sun/moon acceptable if no icon set is added; prefer simple glyphs over decorative stickers.
- Text variant: “Light” / “Dark” with primary or high-contrast link style.

### Screen

- Root `background` pure black/white.
- Safe area, keyboard, scroll behavior unchanged.

---

## 7. Screen layouts

### Login

- Full-bleed canvas; theme toggle top-trailing, minimal.
- Centered brand block: title **Just Todos**, muted subtitle.
- Stack: email → password → full-width pill **Sign In** → register `TextButton`.
- No floating card chrome; content sits on canvas.
- Horizontal padding from tokens (`md`/`lg`).

### Register

- Same auth pattern as login for consistency.
- Title **Buat Akun**, stacked fields, pill **Daftar**, back-to-login link.
- Keep `Screen` scroll + keyboard + safe edges.

### Home

- Header: strong title, muted subtitle, icon `ThemeToggle`.
- Composer: surface input + circular primary **+** control.
- List rows: flat `surface` + thin `border` (or divider rhythm); row tap toggles complete.
- Completed: `textMuted` + strikethrough; prefer simple monochrome complete indicator over heavy emoji checkbox decoration (replace ✅/⬜ if straightforward).
- Delete: compact `error` text action, not bulky button.
- Empty state: single muted centered line.
- Replace remaining magic numbers with `theme.spacing` / tokens.

### Root layout

- Stack header: `background` or `surface` matching mode; `headerTintColor` = `text`; content background = `background`.
- Status bar: light content in dark mode, dark content in light mode (existing pattern, verify after palette change).

---

## 8. Documentation

Update `docs/styling-guide.md` briefly:

- Brand direction: X-like (pure black/white, X blue accent, flat).
- Default theme: dark-first.
- Point to this spec for palette values and layout intent.

Do not rewrite the entire guide unless sections become wrong.

---

## 9. Implementation order (for planning)

1. Update `colors.ts` (and any `primaryDisabled` solid hex choices).
2. Tune `tokens.ts` / elevation / typography as needed.
3. Dark-first default in `ThemeContext`.
4. Restyle primitives (`Button`, `TextField`, …).
5. Restyle login → register → home → `_layout`.
6. Update styling guide.
7. Manual visual pass light + dark on auth + home.

---

## 10. Success criteria

- Dark mode reads as **pure black** X-like canvas, not slate blue-gray.
- Light mode is pure white / soft surface, high contrast.
- Primary actions and links clearly use **`#1D9BF0`**.
- Auth CTAs are **pill** and full-width; home composer/list feel flat and dense.
- No screen hardcodes brand hex.
- Light toggle still works; cold start is **dark**.
- Existing form validation and navigation behavior unchanged.

---

## 11. Risks & mitigations

| Risk                                    | Mitigation                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------ |
| Disabled blue hard to see on pure black | Use explicit solid `primaryDisabled` hex; verify contrast on device                        |
| Pill + small height clipping text       | Keep `controlHeight` 48 and vertical padding consistent                                    |
| Home still has one-off styles           | Prefer tokens; extract only if a pattern repeats 3+ times                                  |
| “Too much like X branding” legally      | This is an aesthetic direction for a personal/lesson todo app, not X trademarks/logos/copy |

---

## 12. Out of scope follow-ups

- Custom icon font / SF Symbols set
- Persist theme preference (AsyncStorage) — optional later; default remains dark-first if unset
- Checkbox component primitive
- Tab navigation chrome
