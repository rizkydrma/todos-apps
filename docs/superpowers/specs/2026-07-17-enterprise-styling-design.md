# Enterprise Styling System (React Native / Expo)

**Date:** 2026-07-17  
**Status:** Approved direction (scope 3) — pending final spec review  
**Scope:** Full app styling foundation + refactor all screens + team docs  
**Stack:** Expo SDK 57, React Native 0.86, TypeScript strict, Expo Router

---

## 1. Problem

The app already has a basic light/dark theme (`themes.ts` + `ThemeContext`), but styling is not enterprise-grade:

- Magic numbers (`24`, `32`, `top: 60`) scattered across screens
- Duplicated button / link / auth layout styles in `login` and `register`
- Theme colors mixed ad hoc via inline style arrays
- No shared spacing / radius / typography scale
- No documented styling contract for future contributors
- Safe area handled inconsistently (hardcoded offsets)

---

## 2. Goals

1. **Single source of truth** for colors, spacing, radius, type, elevation
2. **Semantic tokens** only at the screen layer (`theme.colors.primary`, not `#007AFF`)
3. **Reusable UI primitives** for repeated patterns (Button, Text, Screen, etc.)
4. **Type-safe** theme and styles (`as const` + derived types)
5. **Predictable performance** (`StyleSheet.create` + memoized themed styles)
6. **Team docs** so the pattern survives beyond the first author

### Non-goals

- NativeWind / Tamagui / Restyle
- Multi-brand theming or remote theme config
- Storybook / Chromatic
- Full accessibility audit (baseline a11y on primitives only)
- Visual redesign (keep current look; systematize structure)

---

## 3. Architecture

```
┌─────────────────────────────────────────────┐
│  Screens (login, register, home, layout)    │
│  composition + screen-specific layout only  │
└────────────────────┬────────────────────────┘
                     │ uses
┌────────────────────▼────────────────────────┐
│  UI primitives (Button, AppText, Screen…)   │
└────────────────────┬────────────────────────┘
                     │ uses
┌────────────────────▼────────────────────────┐
│  hooks: useAppTheme, useThemedStyles        │
└────────────────────┬────────────────────────┘
                     │ reads
┌────────────────────▼────────────────────────┐
│  theme: tokens + colors + typography        │
└─────────────────────────────────────────────┘
```

### Layers

| Layer             | Responsibility                     | May reference         |
| ----------------- | ---------------------------------- | --------------------- |
| `theme/*`         | Primitive + semantic design values | nothing app-specific  |
| `hooks/*`         | Theme access + memoized styles     | `theme`, React Native |
| `components/ui/*` | Shared visual building blocks      | theme, hooks          |
| `app/*` screens   | Product UI, forms, navigation      | ui primitives, hooks  |

**Rule:** Screens must not hardcode hex colors or raw spacing numbers that exist in tokens.

---

## 4. File structure

```
src/
  theme/
    tokens.ts          # spacing, radius, fontSize, fontWeight, size, elevation
    colors.ts          # palette + light/dark semantic color maps
    typography.ts      # text style variants (title, body, caption…)
    index.ts           # Theme type, lightTheme, darkTheme
  hooks/
    useThemedStyles.ts
  context/
    ThemeContext.tsx   # thin provider over light/dark theme
  components/
    ui/
      Button.tsx
      AppText.tsx
      TextButton.tsx
      Screen.tsx
      ThemeToggle.tsx
      TextField.tsx   # migrated from CustomInputField
      index.ts         # barrel exports
    # CustomInputField.tsx removed after migration (re-export or delete)
  app/
    _layout.tsx
    (auth)/login.tsx
    (auth)/register.tsx
    (main)/home.tsx

docs/
  superpowers/specs/2026-07-17-enterprise-styling-design.md  # this file
  styling-guide.md   # contributor-facing “How we style”
```

---

## 5. Theme API

### 5.1 Tokens (`tokens.ts`)

Primitive scales (unitless RN numbers):

```ts
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const size = {
  touchMin: 44,      // minimum touch target
  controlHeight: 48, // primary control height baseline
  iconButton: 50,
} as const;

// Platform-aware elevation helpers used by Button etc.
export const elevation = { ... } as const;
```

Exact numeric values may be tuned during implementation to match current UI (visual parity).

### 5.2 Colors (`colors.ts`)

- Internal **palette** (raw hex) — not exported to screens
- Public **semantic** maps for light and dark:

| Token             | Usage                             |
| ----------------- | --------------------------------- |
| `background`      | Screen root                       |
| `surface`         | Cards, inputs, elevated panels    |
| `text`            | Primary text                      |
| `textMuted`       | Secondary / placeholder           |
| `border`          | Dividers, input borders           |
| `primary`         | Brand actions                     |
| `primaryDisabled` | Disabled primary                  |
| `onPrimary`       | Text/icon on primary fills        |
| `error`           | Validation / destructive emphasis |
| `shadow`          | iOS shadow color baseline         |

### 5.3 Typography (`typography.ts`)

Named text styles built from tokens:

| Variant    | Role                               |
| ---------- | ---------------------------------- |
| `title`    | Screen brand / major heading       |
| `subtitle` | Supporting line under title        |
| `body`     | Default reading text               |
| `label`    | Emphasized UI labels / buttons     |
| `caption`  | Small helper / error-adjacent text |
| `link`     | Inline navigation affordance       |

### 5.4 Theme object (`index.ts`)

```ts
export type Theme = {
  mode: 'light' | 'dark';
  colors: SemanticColors;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  size: typeof size;
  elevation: typeof elevation;
  typography: TypographyStyles;
};

export const lightTheme: Theme;
export const darkTheme: Theme;
```

`ThemeContext` exposes:

```ts
{
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}
```

Deprecate / remove flat `LightTheme` / `DarkTheme` exports from `constants/themes.ts` after migration (delete file if unused).

---

## 6. Hooks

### `useAppTheme()` (existing, updated)

Returns full `Theme` object. Throw if used outside provider (keep current guard).

### `useThemedStyles(factory)`

```ts
function useThemedStyles<
  T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>,
>(factory: (theme: Theme) => T): T;
```

- `useMemo` deps: `[theme, factory]` — **prefer stable factory** via inline only when needed; document that factories re-run on theme change
- Implementation note: callers typically pass inline arrow; memo depends on `theme` primarily. Use `theme` as sole dependency and accept factory identity, OR document that style recreation on each render of parent is OK only if factory is cheap — enterprise pattern: **depend on `theme` only** and call `factory(theme)` inside `useMemo`.

```ts
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const { theme } = useAppTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}
```

For stable performance without forcing `useCallback` everywhere, implementation may use:

```ts
return useMemo(() => StyleSheet.create(factory(theme) as any), [theme]);
// eslint: factory intentionally omitted — recreated when theme changes
```

**Decision:** Memoize on `theme` only; document that factories must be pure functions of `theme`.

---

## 7. UI primitives

### 7.1 `AppText`

Props:

- `variant?: 'title' | 'subtitle' | 'body' | 'label' | 'caption' | 'link'`
- `color?: 'text' | 'textMuted' | 'primary' | 'error' | 'onPrimary'` (semantic)
- standard `Text` props

Maps variant → `theme.typography[variant]` + color role.

### 7.2 `Button`

Props:

- `title: string`
- `onPress`
- `variant?: 'primary' | 'ghost' | 'danger'`
- `disabled?: boolean`
- `loading?: boolean` (optional v1: prop accepted, shows disabled + non-interactive)
- accessibility: `accessibilityRole="button"`, disabled state

Uses tokens for padding/radius/elevation; colors from semantic theme.

### 7.3 `TextButton`

Link-style control used under forms (“Belum punya akun?”).  
Uses `AppText` link variant + primary color + hitSlop.

### 7.4 `Screen`

Responsibilities:

- `flex: 1` + `theme.colors.background`
- optional `KeyboardAvoidingView` (prop `keyboard?: boolean`)
- optional dismiss keyboard on outside press
- safe area via `useSafeAreaInsets` / `SafeAreaView` (prefer edges control)
- `ScrollView` mode via prop `scroll?: boolean` for register-like forms

API sketch:

```ts
type ScreenProps = {
  children: React.ReactNode;
  keyboard?: boolean;
  scroll?: boolean;
  dismissKeyboardOnPress?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: Edge[]; // if using safe-area-context
};
```

### 7.5 `ThemeToggle`

Two presentation modes if needed:

- `variant="text"` — auth screens (“Light” / “Dark”)
- `variant="icon"` — home (☀️ / 🌙)

Positioning left to parent; component owns colors/border from theme.

### 7.6 `TextField` (from `CustomInputField`)

- Keep react-hook-form `Controller` integration
- Styles from tokens + theme colors
- Error text via `AppText` caption + error color
- Re-export path: update all imports; remove old file after cutover

---

## 8. Screen migration plan

| Screen         | Changes                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `_layout.tsx`  | Use `theme.colors.*` for Stack options                                                                                               |
| `login.tsx`    | `Screen` + `AppText` + `Button` + `TextButton` + `ThemeToggle` + `TextField`; remove local button styles                             |
| `register.tsx` | Same primitives; **fix bug**: confirm password field currently uses `name="password"` (duplicate) — must be `name="confirmPassword"` |
| `home.tsx`     | Tokens + `AppText` + `Button`/`ThemeToggle` as appropriate; list item styles via `useThemedStyles`                                   |

Visual parity: retain current spacing/feel unless a token forces a 1–2px snap to scale (acceptable).

---

## 9. Styling contract (enforced by docs + review)

Contributors **must**:

1. Put new colors only in `theme/colors.ts`
2. Use spacing/radius/type from `theme` tokens
3. Prefer UI primitives before inventing new one-off controls
4. Use `StyleSheet.create` (via `useThemedStyles` when theme-dependent layout)
5. Avoid creating `StyleSheet` inside render without memoization

Contributors **must not**:

1. Hardcode hex in screens/components outside `theme/`
2. Duplicate primary button styles
3. Use raw `top: 60` instead of safe-area insets

---

## 10. Documentation deliverable

`docs/styling-guide.md` — short contributor guide covering:

- Token map overview
- How to use `useThemedStyles`
- How to add a new primitive
- Do / Don’t examples from this codebase
- Link to this design spec

---

## 11. Testing & verification

No new test framework in scope. Verification:

1. Typecheck: `npx tsc --noEmit` (or project equivalent)
2. Lint: `npm run lint`
3. Manual: login, register (confirm password validation), home add/toggle/delete, theme toggle light/dark on all screens
4. Safe area: theme toggle not under notch on login

---

## 12. Implementation order

1. Create `src/theme/*` (tokens, colors, typography, index)
2. Update `ThemeContext` to full `Theme`
3. Add `useThemedStyles`
4. Build UI primitives (`AppText` → `Button` → `TextButton` → `ThemeToggle` → `Screen` → `TextField`)
5. Migrate screens + layout; fix register confirm field bug
6. Delete obsolete `constants/themes.ts` and old `CustomInputField` path
7. Write `docs/styling-guide.md`
8. Lint + typecheck + smoke verify

---

## 13. Risks & mitigations

| Risk                               | Mitigation                                            |
| ---------------------------------- | ----------------------------------------------------- |
| Visual drift after token snap      | Map tokens to existing values first                   |
| Import churn                       | Barrel `@/components/ui` + path alias already present |
| `useThemedStyles` factory identity | Memoize on `theme` only; pure factories               |
| Register field bug hidden          | Fix explicitly in migration checklist                 |

---

## 14. Success criteria

- [ ] Zero hardcoded brand hex in `src/app/**` and `src/components/**` (except theme module)
- [ ] Login, register, home use shared primitives for buttons/text/screen chrome
- [ ] Theme toggle works system-wide with full theme object
- [ ] Register confirm password validates correctly
- [ ] `docs/styling-guide.md` exists and matches implementation
- [ ] Lint + typecheck pass
