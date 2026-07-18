# Apple HIG Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the X-like theme with a full Apple HIG design system (iOS 18 system colors, motion tokens, HIG controls, grouped home, system appearance) across tokens, primitives, and all screens.

**Architecture:** Deepen `src/theme/*` (system color table → aliases → tokens → typography → motion → Theme) → `ThemeContext` (system + session override) + `useReducedMotion` → restyle `components/ui/*` with Reanimated press/springs → migrate screens → rewrite styling guide. One vertical branch; do not leave mixed X/HIG on `main`.

**Tech Stack:** Expo SDK 57, React Native 0.86, TypeScript, Reanimated 4.5, expo-symbols, expo-haptics (add), AccessibilityInfo, Expo Router

**Spec:** `docs/superpowers/specs/2026-07-18-apple-hig-design-system.md`  
**Glossary:** `CONTEXT.md`  
**ADRs:** `docs/adr/0001`–`0005`

**Verification note:** This repo has no UI unit-test runner. Gates are `npx tsc --noEmit`, `npm run lint`, and manual smoke (light/dark/system, reduced motion, auth, home). Prefer type-level completeness over inventing a test framework mid-redesign.

---

## File map

| Path                                | Action                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `src/theme/systemColors.ios18.ts`   | **Create** — pinned light/dark system color table                       |
| `src/theme/colors.ts`               | **Rewrite** — build light/dark maps + app aliases from table            |
| `src/theme/tokens.ts`               | **Modify** — radius xl, size tweaks, elevation keeps `shadow` via black |
| `src/theme/typography.ts`           | **Rewrite** — tracking + lineHeight per variant; add `headline`         |
| `src/theme/motion.ts`               | **Create** — springs, press, durations, helpers                         |
| `src/theme/index.ts`                | **Modify** — assemble Theme with motion + new colors                    |
| `src/hooks/useReducedMotion.ts`     | **Create**                                                              |
| `src/hooks/useThemedStyles.ts`      | Keep (verify still works)                                               |
| `src/context/ThemeContext.tsx`      | **Rewrite** — system scheme + session override                          |
| `src/lib/haptics.ts`                | **Create** — thin wrappers around expo-haptics                          |
| `src/components/ui/AppText.tsx`     | **Modify** — color roles                                                |
| `src/components/ui/Button.tsx`      | **Rewrite** — HIG variants + Reanimated press                           |
| `src/components/ui/TextButton.tsx`  | **Rewrite** — wrapper around plain Button or restyle                    |
| `src/components/ui/TextField.tsx`   | **Rewrite** — no float label                                            |
| `src/components/ui/Screen.tsx`      | **Modify** — background role prop                                       |
| `src/components/ui/ThemeToggle.tsx` | **Rewrite** — SF Symbol                                                 |
| `src/components/ui/ToastHost.tsx`   | **Modify** — HIG colors + motion tokens                                 |
| `src/components/ui/OtpInput.tsx`    | **Modify** — HIG field colors                                           |
| `src/components/ui/index.ts`        | **Modify** — exports if needed                                          |
| `src/app/_layout.tsx`               | **Modify** — stack chrome colors                                        |
| `src/app/(auth)/login.tsx`          | **Modify**                                                              |
| `src/app/(auth)/register.tsx`       | **Modify**                                                              |
| `src/app/(auth)/verify-email.tsx`   | **Modify**                                                              |
| `src/app/(main)/_layout.tsx`        | **Modify**                                                              |
| `src/app/(main)/home.tsx`           | **Rewrite layout** — grouped list + symbols + haptics                   |
| `docs/styling-guide.md`             | **Rewrite**                                                             |
| `package.json`                      | **Modify** — add `expo-haptics`                                         |

**Color migration cheat sheet (old → new):**

| Old          | New                                                              |
| ------------ | ---------------------------------------------------------------- |
| `background` | `systemBackground` (or `systemGroupedBackground` on home)        |
| `surface`    | `secondarySystemBackground` / `secondarySystemGroupedBackground` |
| `text`       | `label`                                                          |
| `textMuted`  | `secondaryLabel`                                                 |
| `border`     | `separator` or `opaqueSeparator`                                 |
| `primary`    | `primary` (alias → systemBlue)                                   |
| `error`      | `destructive` (alias → systemRed)                                |
| `onPrimary`  | `onPrimary`                                                      |
| `shadow`     | use `#000000` in elevation helper or `theme.colors.shadow` alias |

---

### Task 1: iOS 18 system color table

**Files:**

- Create: `src/theme/systemColors.ios18.ts`

- [ ] **Step 1: Create the pinned table**

```ts
/**
 * Pinned iOS system UI colors (light/dark resolved).
 * Reference pin: iOS 18 / HIG system colors (values from iOS 13+ adaptive set;
 * mint/brown/cyan from later system palette). Bump only via deliberate PR (ADR-0002).
 * Source tables: Apple HIG Color + community-resolved hex (Noah Gilmore / Sarunw cheat sheets).
 * RN supports 8-digit hex (#RRGGBBAA) for alpha labels/fills/separators.
 */
export type SystemColorName =
  | 'systemBackground'
  | 'secondarySystemBackground'
  | 'tertiarySystemBackground'
  | 'systemGroupedBackground'
  | 'secondarySystemGroupedBackground'
  | 'tertiarySystemGroupedBackground'
  | 'systemFill'
  | 'secondarySystemFill'
  | 'tertiarySystemFill'
  | 'quaternarySystemFill'
  | 'label'
  | 'secondaryLabel'
  | 'tertiaryLabel'
  | 'quaternaryLabel'
  | 'separator'
  | 'opaqueSeparator'
  | 'link'
  | 'placeholderText'
  | 'systemBlue'
  | 'systemRed'
  | 'systemGreen'
  | 'systemOrange'
  | 'systemYellow'
  | 'systemPink'
  | 'systemPurple'
  | 'systemTeal'
  | 'systemIndigo'
  | 'systemBrown'
  | 'systemMint'
  | 'systemCyan'
  | 'systemGray'
  | 'systemGray2'
  | 'systemGray3'
  | 'systemGray4'
  | 'systemGray5'
  | 'systemGray6';

export type SystemColorModeMap = Record<SystemColorName, string>;

/** Light appearance resolved values. */
export const systemColorsLight: SystemColorModeMap = {
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  tertiarySystemBackground: '#FFFFFF',
  systemGroupedBackground: '#F2F2F7',
  secondarySystemGroupedBackground: '#FFFFFF',
  tertiarySystemGroupedBackground: '#F2F2F7',
  systemFill: '#78788033',
  secondarySystemFill: '#78788028',
  tertiarySystemFill: '#7676801E',
  quaternarySystemFill: '#74748014',
  label: '#000000',
  secondaryLabel: '#3C3C4399',
  tertiaryLabel: '#3C3C434C',
  quaternaryLabel: '#3C3C432D',
  separator: '#3C3C434A',
  opaqueSeparator: '#C6C6C8',
  link: '#007AFF',
  placeholderText: '#3C3C434C',
  systemBlue: '#007AFF',
  systemRed: '#FF3B30',
  systemGreen: '#34C759',
  systemOrange: '#FF9500',
  systemYellow: '#FFCC00',
  systemPink: '#FF2D55',
  systemPurple: '#AF52DE',
  systemTeal: '#5AC8FA',
  systemIndigo: '#5856D6',
  systemBrown: '#A2845E',
  systemMint: '#00C7BE',
  systemCyan: '#32ADE6',
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',
};

/** Dark appearance resolved values. */
export const systemColorsDark: SystemColorModeMap = {
  systemBackground: '#000000',
  secondarySystemBackground: '#1C1C1E',
  tertiarySystemBackground: '#2C2C2E',
  systemGroupedBackground: '#000000',
  secondarySystemGroupedBackground: '#1C1C1E',
  tertiarySystemGroupedBackground: '#2C2C2E',
  systemFill: '#7878805C',
  secondarySystemFill: '#78788052',
  tertiarySystemFill: '#7676803D',
  quaternarySystemFill: '#7676802E',
  label: '#FFFFFF',
  secondaryLabel: '#EBEBF599',
  tertiaryLabel: '#EBEBF54C',
  quaternaryLabel: '#EBEBF52D',
  separator: '#54545899',
  opaqueSeparator: '#38383A',
  link: '#0A84FF',
  placeholderText: '#EBEBF54C',
  systemBlue: '#0A84FF',
  systemRed: '#FF453A',
  systemGreen: '#30D158',
  systemOrange: '#FF9F0A',
  systemYellow: '#FFD60A',
  systemPink: '#FF375F',
  systemPurple: '#BF5AF2',
  systemTeal: '#64D2FF',
  systemIndigo: '#5E5CE6',
  systemBrown: '#AC8E68',
  systemMint: '#63E6E2',
  systemCyan: '#64D2FF',
  systemGray: '#8E8E93',
  systemGray2: '#636366',
  systemGray3: '#48484A',
  systemGray4: '#3A3A3C',
  systemGray5: '#2C2C2E',
  systemGray6: '#1C1C1E',
};

export const SYSTEM_COLOR_PIN = 'ios18' as const;
```

- [ ] **Step 2: Typecheck module only**

Run: `npx tsc --noEmit`  
Expected: may fail later on consumers still using old colors — table file itself must be error-free. If whole project fails only on old `theme.colors.*`, continue Task 2 in the same working session before claiming green.

- [ ] **Step 3: Commit**

```bash
git add src/theme/systemColors.ios18.ts
git commit -m "feat(theme): add pinned iOS 18 system color table"
```

---

### Task 2: Semantic colors + aliases

**Files:**

- Rewrite: `src/theme/colors.ts`

- [ ] **Step 1: Replace `colors.ts` with system maps + aliases**

```ts
/**
 * Semantic colors for the app: full HIG system set + thin app aliases.
 * Hex lives only here and in systemColors.ios18.ts.
 */
import {
  systemColorsDark,
  systemColorsLight,
  type SystemColorModeMap,
} from './systemColors.ios18';

/** App-only aliases (not UIColor names). */
export type AppColorAliases = {
  primary: string;
  primaryDisabled: string;
  onPrimary: string;
  destructive: string;
  /** Scrim for toast/modal dimming */
  overlay: string;
  /** iOS shadowColor baseline */
  shadow: string;
};

export type SemanticColors = SystemColorModeMap & AppColorAliases;

export type ColorRole = keyof SemanticColors;

function withAliases(
  system: SystemColorModeMap,
  aliases: AppColorAliases
): SemanticColors {
  return { ...system, ...aliases };
}

export const lightColors: SemanticColors = withAliases(systemColorsLight, {
  primary: systemColorsLight.systemBlue,
  // Solid disabled blues (RN backgrounds dislike opacity-only fills)
  primaryDisabled: '#99C9FF',
  onPrimary: '#FFFFFF',
  destructive: systemColorsLight.systemRed,
  overlay: '#00000066',
  shadow: '#000000',
});

export const darkColors: SemanticColors = withAliases(systemColorsDark, {
  primary: systemColorsDark.systemBlue,
  primaryDisabled: '#0A3D7A',
  onPrimary: '#FFFFFF',
  destructive: systemColorsDark.systemRed,
  overlay: '#00000099',
  shadow: '#000000',
});
```

- [ ] **Step 2: Do not leave old keys** (`background`, `text`, etc.) — migration happens in later tasks; temporary `// @ts-expect-error` is forbidden. Prefer completing Tasks 2–8 in one sitting so `tsc` can pass after consumer updates, or update consumers immediately after Theme type changes.

- [ ] **Step 3: Commit**

```bash
git add src/theme/colors.ts
git commit -m "feat(theme): map HIG system colors and app aliases"
```

---

### Task 3: Tokens (radius / size)

**Files:**

- Modify: `src/theme/tokens.ts`

- [ ] **Step 1: Update radius + size**

Keep spacing scale. Change:

```ts
export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const size = {
  touchMin: 44,
  controlHeight: 50,
  iconButton: 44,
} as const;
```

Update file header comment: continuous controls use `radius.lg`/`xl`, not pills for primary buttons. `getElevation` keeps using passed `shadowColor` (callers pass `theme.colors.shadow`).

- [ ] **Step 2: Commit**

```bash
git add src/theme/tokens.ts
git commit -m "feat(theme): tune radius and control sizes for HIG controls"
```

---

### Task 4: Typography with tracking + leading

**Files:**

- Rewrite: `src/theme/typography.ts`

- [ ] **Step 1: Write variants**

```ts
/**
 * Typography variants: size + weight + tracking + leading as one unit.
 * Fixed scale (not Dynamic Type reflow). System font only.
 */
import { TextStyle } from 'react-native';
import { fontSize, fontWeight } from './tokens';

export type TextVariant =
  'title' | 'headline' | 'subtitle' | 'body' | 'label' | 'caption' | 'link';

export type TypographyStyles = Record<TextVariant, TextStyle>;

export const typography: TypographyStyles = {
  title: {
    fontSize: fontSize.xxl, // 32
    fontWeight: fontWeight.bold,
    letterSpacing: -0.6,
    lineHeight: 38,
  },
  headline: {
    fontSize: fontSize.lg, // 18
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: fontSize.sm, // 14
    fontWeight: fontWeight.regular,
    letterSpacing: 0,
    lineHeight: 20,
  },
  body: {
    fontSize: fontSize.md, // 16
    fontWeight: fontWeight.regular,
    letterSpacing: 0,
    lineHeight: 22,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0,
    lineHeight: 22,
  },
  caption: {
    fontSize: fontSize.xs, // 12
    fontWeight: fontWeight.regular,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  link: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0,
    lineHeight: 20,
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/theme/typography.ts
git commit -m "feat(theme): size-specific tracking and leading for type variants"
```

---

### Task 5: Motion tokens + helpers

**Files:**

- Create: `src/theme/motion.ts`

- [ ] **Step 1: Create motion module**

```ts
/**
 * Motion tokens (Apple damping/response mental model) + small helpers.
 * Prefer Reanimated springs; reduced-motion uses short opacity durations.
 */
export type SpringPreset = {
  /** Damping ratio: 1 = critically damped; <1 overshoot */
  damping: number;
  /** Response in seconds (settle speed, not fixed duration) */
  response: number;
};

export const motion = {
  spring: {
    snappy: { damping: 1, response: 0.28 } satisfies SpringPreset,
    default: { damping: 1, response: 0.38 } satisfies SpringPreset,
    gentle: { damping: 1, response: 0.5 } satisfies SpringPreset,
    momentum: { damping: 0.8, response: 0.35 } satisfies SpringPreset,
  },
  press: {
    scale: 0.97,
    opacity: 0.85,
  },
  duration: {
    /** ms — reduced-motion / opacity paths */
    instant: 0,
    fast: 120,
    ui: 200,
  },
  rubberBand: {
    constant: 0.55,
  },
  /** Apple scroll-style projection deceleration */
  decelerationRate: 0.998,
} as const;

export type MotionTokens = typeof motion;

/**
 * Map Apple-style spring to Reanimated spring config (approx).
 * stiffness ≈ (2π / response)^2 * mass; dampingRatio = damping.
 */
export function springConfig(preset: SpringPreset, mass = 1) {
  const stiffness = Math.pow((2 * Math.PI) / preset.response, 2) * mass;
  const damping = 2 * Math.sqrt(stiffness * mass) * preset.damping;
  return { mass, stiffness, damping, overshootClamping: preset.damping >= 1 };
}

/** Exponential projection distance (px) from velocity (px/s). */
export function projectVelocity(
  velocityPxPerSec: number,
  decelerationRate = motion.decelerationRate
): number {
  return (
    (velocityPxPerSec / 1000) * (decelerationRate / (1 - decelerationRate))
  );
}

/** Progressive resistance past a bound (Apple rubber-band). */
export function rubberband(
  overshoot: number,
  dimension: number,
  constant = motion.rubberBand.constant
): number {
  return (
    (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot))
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/theme/motion.ts
git commit -m "feat(theme): add motion tokens and fluid helpers"
```

---

### Task 6: Theme index assembly

**Files:**

- Modify: `src/theme/index.ts`

- [ ] **Step 1: Assemble Theme including motion**

```ts
/**
 * Entry theme: colors + tokens + typography + motion → lightTheme / darkTheme.
 */
import { darkColors, lightColors, type SemanticColors } from './colors';
import { motion, type MotionTokens } from './motion';
import {
  fontSize,
  fontWeight,
  getElevation,
  radius,
  size,
  spacing,
} from './tokens';
import { typography, type TypographyStyles } from './typography';

export type ThemeMode = 'light' | 'dark';

export type Theme = {
  mode: ThemeMode;
  colors: SemanticColors;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  size: typeof size;
  typography: TypographyStyles;
  motion: MotionTokens;
  elevation: typeof getElevation;
};

function createTheme(mode: ThemeMode, colors: SemanticColors): Theme {
  return {
    mode,
    colors,
    spacing,
    radius,
    fontSize,
    fontWeight,
    size,
    typography,
    motion,
    elevation: getElevation,
  };
}

export const lightTheme = createTheme('light', lightColors);
export const darkTheme = createTheme('dark', darkColors);

export type { ColorRole, SemanticColors } from './colors';
export type { TextVariant, TypographyStyles } from './typography';
export type { FontSize, Radius, Spacing } from './tokens';
export type { MotionTokens, SpringPreset } from './motion';
export { getElevation } from './tokens';
export { motion, projectVelocity, rubberband, springConfig } from './motion';
export { SYSTEM_COLOR_PIN } from './systemColors.ios18';
```

- [ ] **Step 2: Commit**

```bash
git add src/theme/index.ts
git commit -m "feat(theme): assemble Theme with motion and HIG colors"
```

---

### Task 7: ThemeProvider — system default + session override

**Files:**

- Rewrite: `src/context/ThemeContext.tsx`

- [ ] **Step 1: Implement provider**

```tsx
/**
 * Theme context: system light/dark default + session-only override (ADR-0004).
 */
import { darkTheme, lightTheme, type Theme } from '@/theme';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

type ThemeOverride = 'light' | 'dark' | null;

type ThemeContextType = {
  theme: Theme;
  isDarkMode: boolean;
  /** null = following system */
  override: ThemeOverride;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [override, setOverride] = useState<ThemeOverride>(null);

  const resolvedMode: 'light' | 'dark' =
    override ?? (systemScheme === 'dark' ? 'dark' : 'light');

  const toggleTheme = useCallback(() => {
    setOverride((prev) => {
      const current = prev ?? (systemScheme === 'dark' ? 'dark' : 'light');
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [systemScheme]);

  const value = useMemo<ThemeContextType>(
    () => ({
      theme: resolvedMode === 'dark' ? darkTheme : lightTheme,
      isDarkMode: resolvedMode === 'dark',
      override,
      toggleTheme,
    }),
    [resolvedMode, override, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme harus digunakan di dalam ThemeProvider');
  }
  return context;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/context/ThemeContext.tsx
git commit -m "feat(theme): system appearance default with session override"
```

---

### Task 8: useReducedMotion hook

**Files:**

- Create: `src/hooks/useReducedMotion.ts`

- [ ] **Step 1: Implement**

```ts
/**
 * Baca preferensi reduced motion OS.
 * true → gunakan cross-fade / opacity, bukan spring/translate besar.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useReducedMotion.ts
git commit -m "feat(a11y): add useReducedMotion hook"
```

---

### Task 9: AppText color roles

**Files:**

- Modify: `src/components/ui/AppText.tsx`

- [ ] **Step 1: Update allowed colors**

```tsx
type AppTextColor = Extract<
  ColorRole,
  | 'label'
  | 'secondaryLabel'
  | 'tertiaryLabel'
  | 'quaternaryLabel'
  | 'primary'
  | 'link'
  | 'destructive'
  | 'onPrimary'
  | 'systemBlue'
  | 'systemRed'
>;

// default color = 'label'
// default variant = 'body'
```

Use `theme.colors[color]` as today. Update file comments to Indonesian/English mix per AGENTS.md.

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/AppText.tsx
git commit -m "feat(ui): AppText uses HIG label color roles"
```

---

### Task 10: Button — HIG variants + press spring

**Files:**

- Rewrite: `src/components/ui/Button.tsx`

- [ ] **Step 1: Install nothing new** (Reanimated already present)

- [ ] **Step 2: Implement Button**

Key API:

```ts
export type ButtonVariant =
  'filled' | 'tinted' | 'gray' | 'plain' | 'destructive';
```

Behavior:

- `minHeight: theme.size.controlHeight`, `borderRadius: theme.radius.lg` (not `full`)
- Colors:
  - `filled`: bg `primary`, text `onPrimary`; disabled `primaryDisabled`
  - `tinted`: bg `secondarySystemFill` or light blue wash — use `systemBlue` text + `secondarySystemFill` bg
  - `gray`: bg `tertiarySystemFill`, text `label`
  - `plain`: transparent, text `primary`
  - `destructive`: bg `destructive`, text `onPrimary` (or plain red text if you add prop later — default filled destructive)
- Press: Reanimated `useSharedValue` scale → `theme.motion.press.scale` on pressIn, spring back with `springConfig(theme.motion.spring.snappy)`. If `useReducedMotion()`, only opacity dip using `theme.motion.press.opacity` / `duration.fast`.
- Keep `loading` + `ActivityIndicator` with `onPrimary` or `primary` as appropriate.

Skeleton:

```tsx
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { springConfig } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
// onPressIn / onPressOut update scale shared value
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Button.tsx
git commit -m "feat(ui): HIG button variants with press spring feedback"
```

---

### Task 11: TextButton + TextField

**Files:**

- Rewrite: `src/components/ui/TextButton.tsx`
- Rewrite: `src/components/ui/TextField.tsx`

- [ ] **Step 1: TextButton → plain text control**

Implement as Pressable + `AppText variant="link" color="primary"` (or `link`), hitSlop, opacity/scale press via same reduced-motion rules. Props: `title`, `onPress`, `disabled?`. Keep existing call-site prop names if any (`label` vs `title`) — **grep and match**.

- [ ] **Step 2: TextField without floating label**

Remove `floatAnim`, `TextFieldShell` float logic, LABEL_* constants.

Structure:

```tsx
<View>
  {label ? (
    <AppText variant="caption" color="secondaryLabel">
      {label}
    </AppText>
  ) : null}
  <TextInput
    placeholder={placeholder}
    placeholderTextColor={theme.colors.placeholderText}
    style={{
      minHeight: theme.size.controlHeight,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.tertiarySystemFill,
      borderWidth: 1,
      borderColor: error
        ? theme.colors.destructive
        : focused
          ? theme.colors.primary
          : theme.colors.separator,
      color: theme.colors.label,
      fontSize: theme.fontSize.md,
    }}
  />
  {error ? (
    <AppText variant="caption" color="destructive">
      {error}
    </AppText>
  ) : null}
</View>
```

Keep RHF `Controller` integration and `innerRef`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/TextButton.tsx src/components/ui/TextField.tsx
git commit -m "feat(ui): HIG text button and non-floating text fields"
```

---

### Task 12: Screen, ThemeToggle, Toast, OtpInput

**Files:**

- Modify: `src/components/ui/Screen.tsx`
- Rewrite: `src/components/ui/ThemeToggle.tsx`
- Modify: `src/components/ui/ToastHost.tsx`
- Modify: `src/components/ui/OtpInput.tsx`

- [ ] **Step 1: Screen background role**

Add optional prop:

```ts
background?: 'systemBackground' | 'systemGroupedBackground';
// default 'systemBackground'
// root backgroundColor: theme.colors[background]
```

- [ ] **Step 2: ThemeToggle with SF Symbol**

```tsx
import { SymbolView } from 'expo-symbols';
// isDarkMode ? 'sun.max.fill' : 'moon.fill' (or reverse: show action to switch TO)
// Prefer showing icon for the mode you will switch into, or current mode — pick one and document in comment.
// accessibilityLabel: "Toggle color scheme"
```

Use `theme.colors.label` for icon tint. Press feedback like Button plain.

- [ ] **Step 3: ToastHost**

Map colors to `secondarySystemBackground`, `label`, `destructive`/`systemGreen` for variants; enter/exit use Reanimated + `theme.motion` / reduced motion opacity only. Scrim uses `theme.colors.overlay` if present.

- [ ] **Step 4: OtpInput**

Replace `error`→`destructive`, `text`→`label`, `border`→`separator`, `background`→`tertiarySystemFill` or `secondarySystemBackground`.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Screen.tsx src/components/ui/ThemeToggle.tsx \
  src/components/ui/ToastHost.tsx src/components/ui/OtpInput.tsx
git commit -m "feat(ui): restyle Screen, ThemeToggle, Toast, Otp for HIG"
```

---

### Task 13: expo-haptics helper

**Files:**

- Run: `npx expo install expo-haptics`
- Create: `src/lib/haptics.ts`

- [ ] **Step 1: Install**

```bash
npx expo install expo-haptics
```

- [ ] **Step 2: Helper**

```ts
/**
 * Commit haptics only — meaningful actions, not every press (CONTEXT.md).
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export async function hapticCommit(
  style: 'light' | 'medium' | 'warning' = 'light'
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (style === 'warning') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    await Haptics.impactAsync(
      style === 'medium'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light
    );
  } catch {
    // Simulator / unsupported — ignore
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock src/lib/haptics.ts
git commit -m "feat: add expo-haptics commit helpers"
```

---

### Task 14: App layouts chrome

**Files:**

- Modify: `src/app/_layout.tsx`
- Modify: `src/app/(main)/_layout.tsx`

- [ ] **Step 1: Stack / headers**

Use `theme.colors.systemBackground`, `theme.colors.label`, `theme.colors.separator` for header styles. Status bar: `style={isDarkMode ? 'light' : 'dark'}`.

Grep for old color keys in layouts and replace.

- [ ] **Step 2: Commit**

```bash
git add src/app/_layout.tsx src/app/\(main\)/_layout.tsx
git commit -m "feat(app): HIG system colors for navigation chrome"
```

---

### Task 15: Auth screens migration

**Files:**

- Modify: `src/app/(auth)/login.tsx`
- Modify: `src/app/(auth)/register.tsx`
- Modify: `src/app/(auth)/verify-email.tsx`

- [ ] **Step 1: Replace every old color role**

- `color="textMuted"` → `color="secondaryLabel"`
- `color="text"` → `color="label"` or omit (default label)
- `color="error"` → `color="destructive"`
- `Button` `variant="primary"` → `variant="filled"`
- `variant="ghost"` → `variant="plain"` or `tinted`
- `variant="danger"` → `variant="destructive"`
- Prefer `Screen` default system background
- Remove direct `import { spacing } from '@/theme/tokens'` if styles can use `useThemedStyles` only

- [ ] **Step 2: Manual pass structure**

Auth: title + subtitle secondaryLabel + fields + filled primary CTA + plain secondary TextButton + ThemeToggle.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/
git commit -m "feat(auth): migrate screens to HIG tokens and controls"
```

---

### Task 16: Home — inset grouped list + symbols + haptics

**Files:**

- Rewrite layout: `src/app/(main)/home.tsx`

- [ ] **Step 1: Layout structure**

```tsx
<Screen background="systemGroupedBackground" safe={{ top: true, bottom: true }}>
  {/* header: title label, ThemeToggle, logout plain button */}
  {/* composer section: rounded group secondarySystemGroupedBackground */}
  {/* list section: same group; rows separated by Hairline separator */}
</Screen>
```

Row:

- Left: complete control (SF Symbol `circle` / `checkmark.circle.fill`) — onPress toggles + `hapticCommit('light')`
- Middle: todo text (`label` or `secondaryLabel` + line-through when done)
- Right: delete control — `hapticCommit('warning')` then remove

Add button: `SymbolView` `plus` in filled circular control using `primary` / `onPrimary`.

List container:

```ts
group: {
  backgroundColor: t.colors.secondarySystemGroupedBackground,
  borderRadius: t.radius.xl,
  overflow: 'hidden',
},
separator: {
  height: StyleSheet.hairlineWidth,
  backgroundColor: t.colors.separator,
  marginLeft: t.spacing.md,
},
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(main\)/home.tsx
git commit -m "feat(home): inset grouped list with SF Symbols and haptics"
```

---

### Task 17: Global grep cleanup + typecheck

**Files:** all of `src/`

- [ ] **Step 1: Grep for banned leftovers**

```bash
rg "textMuted|colors\.text\b|colors\.background\b|colors\.surface\b|colors\.border\b|colors\.error\b|variant=\"primary\"|variant=\"ghost\"|variant=\"danger\"|#1D9BF0|#0F1419" src
```

Expected: no matches (except comments explaining migration if any — prefer zero).

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: both pass.

- [ ] **Step 3: Fix any remaining errors; commit if needed**

```bash
git add -A src
git commit -m "fix: finish HIG color and variant migration"
```

---

### Task 18: Styling guide rewrite

**Files:**

- Rewrite: `docs/styling-guide.md`

- [ ] **Step 1: Rewrite guide**

Must cover:

- Brand: HIG visual language (X-like retired); link to new spec + ADRs + CONTEXT.md
- Architecture diagram (unchanged layers)
- Do/Don’t: HIG color names, motion tokens, no hex outside theme
- Theme API samples: `theme.colors.label`, `theme.motion.spring.default`, `theme.elevation('sm', theme.colors.shadow)`
- Button variants list
- TextField: no floating label
- Appearance: system + session override
- Reduced motion policy
- Checklist before PR

- [ ] **Step 2: Commit**

```bash
git add docs/styling-guide.md
git commit -m "docs: rewrite styling guide for Apple HIG design system"
```

---

### Task 19: Manual verification checklist

- [ ] Launch with device/simulator **light** system appearance → app light
- [ ] Launch with **dark** system appearance → app dark
- [ ] ThemeToggle flips for session; kill app → back to system
- [ ] Login / register / verify-email usable; fields focus blue; errors red
- [ ] Home grouped cards; add / complete (haptic) / delete (haptic)
- [ ] Enable Reduce Motion → press/toast without large springs
- [ ] `npx tsc --noEmit` + `npm run lint` green

---

## Spec coverage (self-review)

| Spec requirement                                  | Task(s)                   |
| ------------------------------------------------- | ------------------------- |
| Full iOS 18 system color table                    | 1–2                       |
| App aliases primary/destructive/onPrimary/overlay | 2                         |
| Solid materials (no blur)                         | 12, 16 (fills/separators) |
| Typography tracking/leading                       | 4                         |
| Motion tokens + helpers                           | 5–6                       |
| Fluid on existing surfaces only                   | 10–12, 16                 |
| Reduced motion                                    | 8, 10–12                  |
| System appearance + session override              | 7                         |
| HIG button variants                               | 10                        |
| TextField no float                                | 11                        |
| Grouped home                                      | 16                        |
| SF Symbols chrome                                 | 12, 16                    |
| Commit haptics                                    | 13, 16                    |
| Docs                                              | 18                        |
| Single vertical slice                             | ordered tasks + commits   |

**Placeholder scan:** none intentional.  
**Type consistency:** `SemanticColors`, `ButtonVariant`, `TextVariant` include `headline`; AppText colors use `label`/`destructive`/`primary`/`link`.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-18-apple-hig-design-system.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks
2. **Inline Execution** — run tasks in this session with checkpoints

Which approach?
