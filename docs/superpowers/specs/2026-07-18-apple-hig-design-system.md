# Apple HIG Design System Redesign (Just Todos)

**Date:** 2026-07-18  
**Status:** Accepted (grilled + user confirmed)  
**Scope:** Design tokens, theme API, motion system, UI primitives, all product screens, contributor docs  
**Stack:** Expo SDK 57, React Native 0.86, Reanimated 4.5, expo-symbols, expo-haptics (to add)  
**Domain language:** [`CONTEXT.md`](../../../CONTEXT.md)  
**Related ADRs:** [`docs/adr/`](../../adr/)

---

## 1. Problem

The app has an enterprise theme foundation (tokens → hooks → primitives → screens) and an **X-like** brand (pure black/white, `#1D9BF0`, flat chrome, pill CTAs, floating labels, dark-first). That system is too thin for Apple-grade craft and the brand no longer matches the product direction.

Gaps vs Apple HIG / fluid interfaces:

| Area            | Today                                    | Needed                                                                    |
| --------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| Colors          | ~10 semantic roles, X palette            | Full iOS 18 system color set, HIG names                                   |
| Materials       | Flat solid only, no hierarchy ladder     | Solid HIG surface ladder (grouped/fill/separator)                         |
| Type            | Size + weight; title tracking only       | Size-specific tracking + leading per variant                              |
| Motion          | Ad-hoc `Animated` timings, opacity press | Tokenized springs, reduced-motion policy, fluid fidelity on real surfaces |
| Controls        | `primary` / `ghost` / `danger` pills     | HIG control variants, continuous corners                                  |
| Fields          | Floating label (X/Material cue)          | Rounded rect + placeholder                                                |
| Home            | Flat list / composer                     | Inset grouped list                                                        |
| Appearance      | Dark-first hard default                  | System default + session override                                         |
| Icons / haptics | Emoji glyphs; no haptics                 | SF Symbols chrome; commit haptics                                         |

---

## 2. Goals

1. **Single HIG visual language** across theme, primitives, and screens (X-like retired).
2. **Version-pinned full system color table** (iOS 18 reference) with light/dark resolved values.
3. **Deeper design tokens:** spacing/radius/size + typography metrics + motion presets + press feedback + materials (solid).
4. **Fluid interaction fidelity** on **existing** surfaces (press, toast, field focus, list item lifecycle) with shared helpers — not new demo chrome.
5. **Accessibility baseline:** reduced-motion fallbacks; 44pt touch targets retained.
6. **Docs + glossary** stay the source of truth (`CONTEXT.md`, styling guide, this spec, ADRs).

### Non-goals

- Translucent blur / vibrancy as the product look (solid materials only in v1)
- New gesture product surfaces (sheets, drawers, Control Center modules) invented only for springs
- Persisted appearance preference (`system` | `light` | `dark` in storage)
- Full Dynamic Type reflow of layouts
- Runtime native `UIColor` bridge
- Multi-brand / dual visual systems
- Exact pixel clone of Settings/Reminders; HIG-faithful language, not Apple asset theft

---

## 3. Decisions (from grilling)

| #   | Decision           | Choice                                                        |
| --- | ------------------ | ------------------------------------------------------------- |
| 1   | Brand              | Full Apple HIG redesign                                       |
| 2   | Palette            | Full system color set, HIG/UIColor names + app aliases        |
| 3   | Color source       | Static table pinned to **iOS 18** light/dark hex              |
| 4   | Materials v1       | Solid HIG surfaces                                            |
| 5   | Motion depth       | Full fluid fidelity on **existing** surfaces + infrastructure |
| 6   | Fluid application  | No new sheets/demo chrome                                     |
| 7   | Type scaling       | Fixed scale + size-specific tracking/leading                  |
| 8   | Appearance default | Follow **system**                                             |
| 9   | Theme toggle       | Session-only override; OS change does not clear override      |
| 10  | Buttons            | `filled` \| `tinted` \| `gray` \| `plain` \| `destructive`    |
| 11  | TextField          | Rounded + placeholder (+ optional static caption)             |
| 12  | Home               | Inset **grouped** list                                        |
| 13  | Reduced motion     | Cross-fade / opacity fallbacks                                |
| 14  | Icons              | SF Symbols via `expo-symbols` for chrome                      |
| 15  | Haptics            | Selective commit haptics (`expo-haptics`)                     |
| 16  | Delivery           | One vertical redesign slice (single plan/branch)              |

---

## 4. Architecture

No new app layers. Deepen `src/theme` and rewire consumers.

```
Screens (auth, home, layouts)
  → UI primitives (+ symbols, haptics at commit sites)
  → useAppTheme / useThemedStyles / motion helpers
  → src/theme/*
       colors (aliases) ← systemColors.ios18 (pinned table)
       tokens (spacing, radius, size, elevation)
       typography (variants with tracking/leading)
       motion (springs, durations, press, reduced)
       index (Theme assembly)
```

### Layer rules

| Layer                  | May reference                     | Must not                               |
| ---------------------- | --------------------------------- | -------------------------------------- |
| `theme/systemColors.*` | nothing app-specific              | screens, primitives                    |
| `theme/colors.ts`      | system color table                | screens                                |
| `theme/motion.ts`      | tokens only as needed             | business logic                         |
| `components/ui/*`      | theme, hooks, reanimated, symbols | hardcoded hex / magic durations        |
| `app/*` screens        | primitives, hooks, feature hooks  | hex, raw spacing inventing scale steps |

**Rule:** Screens use semantic theme keys only. Hex lives only under `src/theme/`.

---

## 5. Theme API

### 5.1 System color table

**File:** `src/theme/systemColors.ios18.ts` (or `.json` + typed import)

- Complete inventory of iOS 18 **system** colors used as the public set, each with `light` and `dark` resolved hex (and notes if elevated/dark variants are intentionally collapsed).
- Updated only by deliberate PR when the pin changes (see ADR-0002).
- Includes at minimum the standard adaptive groups:
  - **Backgrounds:** `systemBackground`, `secondarySystemBackground`, `tertiarySystemBackground`, `systemGroupedBackground`, `secondarySystemGroupedBackground`, `tertiarySystemGroupedBackground`
  - **Fills:** `systemFill`, `secondarySystemFill`, `tertiarySystemFill`, `quaternarySystemFill`
  - **Labels:** `label`, `secondaryLabel`, `tertiaryLabel`, `quaternaryLabel`
  - **Separators:** `separator`, `opaqueSeparator`
  - **Links / placeholder:** `link`, `placeholderText`
  - **System tints:** `systemBlue`, `systemRed`, `systemGreen`, `systemOrange`, `systemYellow`, `systemPink`, `systemPurple`, `systemTeal`, `systemIndigo`, `systemBrown`, `systemMint`, `systemCyan`
  - **Grays:** `systemGray`, `systemGray2` … `systemGray6`
- **App-only (not UIColor names):** `overlay` (scrim for toast/modal) defined beside the table with light/dark values.

Public `theme.colors` exposes these names directly (camelCase matching above).

### 5.2 App aliases

Thin aliases for primitives (map onto system colors):

| Alias             | Maps to (typical)                                                           |
| ----------------- | --------------------------------------------------------------------------- |
| `primary`         | `systemBlue`                                                                |
| `primaryDisabled` | derived solid (blue @ reduced presence; **solid hex**, not RN opacity-only) |
| `onPrimary`       | white / high-contrast on blue                                               |
| `destructive`     | `systemRed`                                                                 |

Deprecated semantic names from X era (`background`, `surface`, `text`, `textMuted`, `border`, `error`, `shadow`) are **removed** from the public API after migration — do not leave dual names indefinitely.

### 5.3 Tokens (`tokens.ts`)

Keep 4pt-based spacing; tune radius for continuous controls:

```ts
spacing: none | xs | sm | md | lg | xl | xxl  // 0,4,8,16,24,32,40
radius: sm | md | lg | xl | full               // e.g. 8, 10, 12, 16, 9999 — continuous controls prefer lg/xl, not full pills for primary buttons
size: touchMin 44 | controlHeight 50 | iconButton 44  // align control height with iOS comfort; touchMin stays ≥44
```

Elevation: retain platform `getElevation`; prefer **hairline separators + fill hierarchy** over heavy shadows (HIG solid materials).

### 5.4 Typography (`typography.ts`)

Variants (adjust names only if needed; prefer keep for less churn):

| Variant    | Role                           | Metrics discipline                                     |
| ---------- | ------------------------------ | ------------------------------------------------------ |
| `title`    | Large title / brand            | Tight leading (~1.1–1.2), negative tracking            |
| `subtitle` | Secondary under title          | Regular weight, secondaryLabel color at call site      |
| `headline` | Section headers (optional add) | Semibold, slightly tight tracking                      |
| `body`     | Reading / form text            | Comfortable leading (~1.35–1.45), tracking ~0          |
| `label`    | Control labels                 | Semibold/bold, tracking ~0                             |
| `caption`  | Footnotes / errors             | Slightly positive tracking if needed at small size     |
| `link`     | Text actions                   | Medium/semibold; color `link` / `primary` at call site |

System font only (RN default / San Francisco on iOS). No custom font files in this work.

`AppText` color prop accepts semantic roles from the new color API (at least: `label`, `secondaryLabel`, `tertiaryLabel`, `primary`/`link`, `destructive`, `onPrimary`).

### 5.5 Motion (`motion.ts`)

Named presets (Apple mental model: damping ratio + response):

| Preset     | Use                                | Default params (starting point) |
| ---------- | ---------------------------------- | ------------------------------- |
| `snappy`   | Press release, small UI            | damping 1.0, response ~0.25–0.3 |
| `default`  | Most UI settle                     | damping 1.0, response ~0.35–0.4 |
| `gentle`   | Large soft settles                 | damping 1.0, response ~0.5      |
| `momentum` | Only if a gesture carried velocity | damping ~0.8, response ~0.3–0.4 |

Also tokenized:

- `press.scale` ≈ `0.97` (instant on press-in)
- `press.opacity` optional companion
- `duration.instant` / `fast` / `ui` for reduced-motion opacity paths (~0 / 120–200ms)
- `rubberBand.constant` ≈ `0.55` (helper, for list overscroll if used)
- `decelerationRate` ≈ `0.998` (projection helper; available even if unused until a gesture needs it)

**Reduced motion:** each consumer reads a shared `useReducedMotion()` (or theme flag hydrated from `AccessibilityInfo`). When reduced: no spring overshoot, no large translates; opacity/color cross-fades only.

**Library:** `react-native-reanimated` for interruptible springs; migrate off one-off `Animated.timing` in primitives where springs/press apply.

### 5.6 Theme object

```ts
type Theme = {
  mode: 'light' | 'dark';
  colors: SystemColors & AppColorAliases;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  size: typeof size;
  typography: TypographyStyles;
  motion: MotionTokens;
  elevation: typeof getElevation;
};
```

### 5.7 ThemeProvider behavior

1. Read OS scheme via `useColorScheme()` (or equivalent).
2. State: `override: 'light' | 'dark' | null` (null = follow system).
3. `theme.mode` = override ?? system ?? `'light'` fallback.
4. `toggleTheme` cycles or flips between light/dark **as session override** (sets override, does not persist).
5. If OS scheme changes while override is non-null, **keep override** until process death.
6. Default is **not** dark-first.

---

## 6. UI primitives

| Primitive     | Change                                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AppText`     | New color roles; typography includes lineHeight + letterSpacing                                                                                                           |
| `Button`      | Variants: `filled` \| `tinted` \| `gray` \| `plain` \| `destructive`; press scale on press-in via Reanimated; min height `size.controlHeight`; radius continuous not pill |
| `TextButton`  | Prefer collapse into `Button variant="plain"` **or** keep as thin wrapper over plain                                                                                      |
| `TextField`   | No float label; placeholder + optional caption; fill/border from system fills/separator; focus border `systemBlue`                                                        |
| `Screen`      | Background from `systemBackground` or prop for `systemGroupedBackground` (home)                                                                                           |
| `ThemeToggle` | SF Symbol sun/moon; session override                                                                                                                                      |
| `ToastHost`   | System materials (solid), motion presets, scrim/`overlay` as needed                                                                                                       |
| `OtpInput`    | Restyle to HIG fields (same tokens as TextField cells)                                                                                                                    |

Accessibility: keep `accessibilityRole`, disabled states, hitSlop on small chrome; touch targets ≥ 44.

### Haptics

Add `expo-haptics`. Fire only on:

- Todo complete toggle (light/medium impact)
- Destructive delete (warning/medium)
- Optional: successful primary auth submit (success notification — only if not noisy)

Never on every `Pressable` or keystroke.

### Symbols

`expo-symbols` for: theme toggle, add todo, checkmark/complete affordances. Text remains for primary verbal actions.

---

## 7. Screen migration

| Screen                | Direction                                                                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_layout.tsx`         | Stack chrome: system backgrounds, label colors, status bar adaptive                                                                                            |
| `(auth)/login`        | Screen + HIG fields/buttons; system background; plain/filled actions                                                                                           |
| `(auth)/register`     | Same                                                                                                                                                           |
| `(auth)/verify-email` | OTP cells restyled; same control language                                                                                                                      |
| `(main)/home`         | `systemGroupedBackground`; inset grouped todo section; composer as grouped section or bottom control cluster; SF Symbol add; commit haptics on complete/delete |
| `(main)/_layout`      | Match system chrome                                                                                                                                            |

Visual target: reads as a **native iOS utility app**, not X, not generic Bootstrap-blue.

---

## 8. Motion application map (existing surfaces only)

| Surface              | Behavior                                                                       |
| -------------------- | ------------------------------------------------------------------------------ |
| Button / icon press  | Scale to `press.scale` on press-in; spring back on release; interruptible      |
| TextField focus      | Border/color transition via snappy/default; no float                           |
| Toast enter/exit     | Spring or reduced opacity; dismissible without locking input                   |
| List item add/remove | Insert/remove with default spring or reduced fade; no new swipe sheet required |
| Theme toggle         | Instant symbol/color update; optional short fade                               |

Infrastructure exported for later gestures (projection, rubber-band) but **not** productized into new chrome in this pass.

---

## 9. Documentation deliverables

| Doc                       | Action                                                   |
| ------------------------- | -------------------------------------------------------- |
| `CONTEXT.md`              | Already updated (glossary + decisions)                   |
| `docs/adr/*`              | ADRs for hard-to-reverse choices                         |
| `docs/styling-guide.md`   | Rewrite: HIG brand, new color/motion APIs, do/don’t      |
| X-like + enterprise specs | Leave historical; mark superseded in styling guide intro |
| This spec                 | Implementation authority for the redesign                |

---

## 10. Implementation order (single vertical slice)

1. Add `systemColors.ios18` table + `colors` aliases + expand `Theme` types
2. Typography metrics + motion module + reduced-motion hook
3. ThemeProvider system default + session override
4. Restyle primitives (Button → TextField → AppText → Toast → OTP → ThemeToggle → Screen)
5. Migrate layouts + auth screens + home grouped list
6. Symbols + haptics at commit sites
7. Rewrite `docs/styling-guide.md`
8. Typecheck, lint, manual light/dark/system + reduced-motion smoke

Do not merge intermediate states that leave X pills on HIG colors to `main` if avoidable; use one branch with ordered commits.

---

## 11. Testing & verification

No new test framework required. Verify:

1. `npx tsc --noEmit`
2. `npm run lint`
3. Manual: system light/dark launch; session toggle; OS change while overridden keeps override
4. Auth flows (login, register, verify) with new fields
5. Home add / complete (haptic) / delete (haptic) / empty state
6. Reduced motion on: no springy large motion; feedback still visible
7. No hex outside `src/theme/` in app/components

---

## 12. Risks & mitigations

| Risk                           | Mitigation                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------- |
| Full color table maintenance   | Pin iOS 18; single table file; ADR for pin bumps                              |
| Scope explosion (“full fluid”) | Explicit application map; no new sheets                                       |
| Visual inconsistency mid-PR    | One vertical branch                                                           |
| Reanimated migration bugs      | Port primitive-by-primitive; keep press feedback simple first                 |
| Android parity of “iOS colors” | Accept HIG-inspired solid table on both platforms (not Material3 dual system) |
| Alias/name churn               | Migrate call sites in same slice; delete old names                            |

---

## 13. Success criteria

- [ ] Public theme colors are HIG/system names (+ aliases); X palette gone
- [ ] System appearance default; session override works as specified
- [ ] Typography variants include size-specific tracking/leading
- [ ] Motion tokens exist; Button press + toast + list item use them; reduced-motion respected
- [ ] Button variants match HIG set; no X pill primary
- [ ] TextField has no floating label
- [ ] Home is inset grouped on grouped background
- [ ] SF Symbols on chrome; commit haptics on complete/delete
- [ ] `docs/styling-guide.md` + ADRs + this spec consistent with `CONTEXT.md`
- [ ] Lint + typecheck pass

---

## 14. Open implementation details (non-blocking)

Resolved at implement time without reopening product direction:

- Exact hex values in the iOS 18 table (from a trusted reference table; document source link in the color module header)
- Whether `TextButton` remains a file or becomes `Button plain`
- Exact SF Symbol names per platform fallback on Android
- Precise spring numbers if tuning on device (stay within critically damped defaults unless momentum gesture exists)
