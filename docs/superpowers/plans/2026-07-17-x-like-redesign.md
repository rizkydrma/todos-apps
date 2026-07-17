# X-like Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle Just Todos to an X-like visual language: pure black/white canvas, X blue accents, flat chrome, pill CTAs, dark-first default, denser auth and home layouts.

**Architecture:** Token-first full restyle on the existing enterprise foundation. Update `src/theme/*` semantic values first so primitives pick up brand colors automatically, then restyle shape/elevation on primitives, then restyle screen layouts. Screens never hardcode brand hex.

**Tech Stack:** Expo SDK 57, React Native 0.86, TypeScript, Expo Router, existing `src/theme` + `components/ui` primitives

**Spec:** `docs/superpowers/specs/2026-07-17-x-like-design.md`

**Prerequisite:** Enterprise styling foundation must exist (`src/theme/*`, `src/components/ui/*`, `useThemedStyles`, screens already on tokens). If that work is still uncommitted in the working tree, finish/commit it first or implement this plan on top of the current files as-is — do not recreate the foundation.

**Verification note:** No unit test runner in this repo. Each task ends with `npx tsc --noEmit` and/or `npm run lint` plus a short manual visual checklist.

---

## File map

| Path                                | Action | Responsibility                                                      |
| ----------------------------------- | ------ | ------------------------------------------------------------------- |
| `src/theme/colors.ts`               | Modify | X palette + light/dark semantic maps                                |
| `src/theme/tokens.ts`               | Modify | Input radius preference, flatter elevation defaults                 |
| `src/theme/typography.ts`           | Modify | Slightly stronger title if needed                                   |
| `src/context/ThemeContext.tsx`      | Modify | Dark-first initial state                                            |
| `src/components/ui/Button.tsx`      | Modify | Pill primary, no heavy elevation                                    |
| `src/components/ui/TextField.tsx`   | Modify | Larger radius, focus border primary                                 |
| `src/components/ui/ThemeToggle.tsx` | Modify | Monochrome icon chrome                                              |
| `src/components/ui/AppText.tsx`     | Verify | No API change; colors flow from theme                               |
| `src/components/ui/TextButton.tsx`  | Verify | Already uses primary; no change unless needed                       |
| `src/components/ui/Screen.tsx`      | Verify | Already uses background token                                       |
| `src/app/(auth)/login.tsx`          | Modify | X-like auth density/layout                                          |
| `src/app/(auth)/register.tsx`       | Modify | Match login auth pattern                                            |
| `src/app/(main)/home.tsx`           | Modify | Composer + list restyle, monochrome complete indicator, tokens only |
| `src/app/_layout.tsx`               | Modify | Header uses `background` (pure canvas)                              |
| `docs/styling-guide.md`             | Modify | Brand + dark-first notes                                            |

---

### Task 1: X palette in `colors.ts`

**Files:**

- Modify: `src/theme/colors.ts`

- [ ] **Step 1: Replace palette and semantic maps with X-like values**

Replace the full contents of `src/theme/colors.ts` with:

```ts
/** Raw palette — internal to theme module only */
const palette = {
  white: '#FFFFFF',
  black: '#000000',
  // X-like neutrals
  gray50: '#F7F9F9',
  gray100: '#EFF3F4',
  gray400: '#536471',
  gray500: '#71767B',
  gray700: '#2F3336',
  gray800: '#16181C',
  textDark: '#0F1419',
  textLight: '#E7E9EA',
  // X blue + disabled solids (RN needs solid hex, not opacity)
  blue: '#1D9BF0',
  blueDisabledDark: '#0D4F7A',
  blueDisabledLight: '#8ECDF8',
  red: '#F4212E',
} as const;

export type SemanticColors = {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryDisabled: string;
  onPrimary: string;
  error: string;
  shadow: string;
};

export const lightColors: SemanticColors = {
  background: palette.white,
  surface: palette.gray50,
  text: palette.textDark,
  textMuted: palette.gray400,
  border: palette.gray100,
  primary: palette.blue,
  primaryDisabled: palette.blueDisabledLight,
  onPrimary: palette.white,
  error: palette.red,
  shadow: palette.black,
};

export const darkColors: SemanticColors = {
  background: palette.black,
  surface: palette.gray800,
  text: palette.textLight,
  textMuted: palette.gray500,
  border: palette.gray700,
  primary: palette.blue,
  primaryDisabled: palette.blueDisabledDark,
  onPrimary: palette.white,
  error: palette.red,
  shadow: palette.black,
};

export type ColorRole = keyof SemanticColors;
```

- [ ] **Step 2: Typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: no errors (semantic keys unchanged).

- [ ] **Step 3: Commit**

```bash
git add src/theme/colors.ts
git commit -m "feat(theme): adopt X-like pure black/white palette"
```

---

### Task 2: Tokens + typography tune

**Files:**

- Modify: `src/theme/tokens.ts`
- Modify: `src/theme/typography.ts`

- [ ] **Step 1: Prefer flatter elevation in `tokens.ts`**

In `src/theme/tokens.ts`, keep spacing/radius/fontSize/size scales. Soften `getElevation` so the UI stays nearly flat:

For level `'sm'`, use lower opacity/radius:

```ts
if (level === 'sm') {
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
    },
    android: { elevation: 0 },
    default: {},
  })!;
}
```

For default (`md`):

```ts
return Platform.select<ViewStyle>({
  ios: {
    shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  android: { elevation: 1 },
  default: {},
})!;
```

Do **not** change numeric keys of `spacing`, `radius`, `fontSize`, or `size` unless a call site requires it. Inputs will use existing `radius.lg` (16).

- [ ] **Step 2: Slightly strengthen title in `typography.ts`**

Ensure title uses bold + largest size (already `xxl` / `700`). Optionally bump nothing if already correct. Only change if title is not bold:

```ts
title: {
  fontSize: fontSize.xxl,
  fontWeight: fontWeight.bold,
  letterSpacing: -0.3,
},
```

Keep other variants as-is.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/theme/tokens.ts src/theme/typography.ts
git commit -m "feat(theme): flatten elevation and tighten title type"
```

---

### Task 3: Dark-first ThemeContext

**Files:**

- Modify: `src/context/ThemeContext.tsx`

- [ ] **Step 1: Default `isDarkMode` to `true`**

Replace system-first init with dark-first. Remove unused `useColorScheme` import if no longer needed.

Final `ThemeProvider` body:

```tsx
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const value = useMemo<ThemeContextType>(
    () => ({
      isDarkMode,
      theme: isDarkMode ? darkTheme : lightTheme,
      toggleTheme: () => setIsDarkMode((prev) => !prev),
    }),
    [isDarkMode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
```

Imports should be:

```tsx
import { darkTheme, lightTheme, type Theme } from '@/theme';
import { createContext, useContext, useMemo, useState } from 'react';
```

Do **not** reintroduce `useColorScheme` for initial state.

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/context/ThemeContext.tsx
git commit -m "feat(theme): default to dark-first X-like mode"
```

---

### Task 4: Restyle Button (pill, flat)

**Files:**

- Modify: `src/components/ui/Button.tsx`

- [ ] **Step 1: Pill radius, drop primary elevation**

Update themed styles and press/elevation logic:

```tsx
const styles = useThemedStyles((t) => ({
  base: {
    paddingVertical: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    borderRadius: t.radius.full,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: t.size.controlHeight,
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingVertical: t.spacing.sm,
  },
}));
```

Remove primary elevation usage — delete `elevationStyle` and do not pass elevation into `style`.

Pressed opacity: use `0.85` when pressed and not disabled:

```tsx
opacity: pressed && !isDisabled ? 0.85 : 1,
```

Keep variant color logic (primary / ghost / danger / disabled) unchanged otherwise.

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Button.tsx
git commit -m "feat(ui): pill flat primary Button for X-like CTAs"
```

---

### Task 5: Restyle TextField (radius + focus)

**Files:**

- Modify: `src/components/ui/TextField.tsx`

- [ ] **Step 1: Larger radius + focus border primary**

Add local focus state and apply border colors:

```tsx
import { useState } from 'react';
// ... existing imports

export function TextField<T extends FieldValues>({
  control,
  name,
  error,
  innerRef,
  placeholder,
  ...restProps
}: TextFieldProps<T>) {
  const { theme } = useAppTheme();
  const [focused, setFocused] = useState(false);

  const styles = useThemedStyles((t) => ({
    container: {
      width: '100%' as const,
      marginTop: t.spacing.md,
    },
    input: {
      borderWidth: 1,
      paddingVertical: 14,
      paddingHorizontal: t.spacing.md,
      borderRadius: t.radius.lg,
      fontSize: t.fontSize.md,
      minHeight: t.size.controlHeight,
    },
    errorText: {
      marginTop: t.spacing.xs,
      marginLeft: t.spacing.xs,
    },
  }));

  const borderColor = error
    ? theme.colors.error
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            ref={innerRef}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textMuted}
            value={value}
            onChangeText={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              onBlur();
            }}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor,
                color: theme.colors.text,
              },
            ]}
            {...restProps}
          />
        )}
      />

      {error ? (
        <AppText variant="caption" color="error" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/TextField.tsx
git commit -m "feat(ui): X-like TextField radius and focus ring"
```

---

### Task 6: Restyle ThemeToggle chrome

**Files:**

- Modify: `src/components/ui/ThemeToggle.tsx`

- [ ] **Step 1: Monochrome icon toggle**

Use circular-ish border chrome and simpler glyphs. Icon variant:

```tsx
if (variant === 'icon') {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'
      }
      onPress={toggleTheme}
      style={({ pressed }) => [
        styles.icon,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.full,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <AppText
        color="text"
        style={{ fontSize: theme.fontSize.md, fontWeight: '600' }}
      >
        {isDarkMode ? '☾' : '☀'}
      </AppText>
    </Pressable>
  );
}
```

Keep text variant as primary link style (already fine). Ensure `styles.icon` still has min touch size 44.

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/ThemeToggle.tsx
git commit -m "feat(ui): monochrome ThemeToggle for X-like chrome"
```

---

### Task 7: Root layout chrome

**Files:**

- Modify: `src/app/_layout.tsx`

- [ ] **Step 1: Header on pure background**

Use `theme.colors.background` for header (not slate surface) so chrome matches pure canvas:

```tsx
<Stack
  screenOptions={{
    headerStyle: { backgroundColor: theme.colors.background },
    headerTintColor: theme.colors.text,
    headerShadowVisible: false,
    headerTitleStyle: { fontWeight: '700' },
    contentStyle: { backgroundColor: theme.colors.background },
  }}
>
```

Keep StatusBar light/dark mapping as-is.

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/_layout.tsx
git commit -m "feat(nav): pure-canvas stack header for X-like chrome"
```

---

### Task 8: Restyle Login screen

**Files:**

- Modify: `src/app/(auth)/login.tsx`

- [ ] **Step 1: Dense canvas auth layout with tokens**

Keep form logic (zod, RHF) unchanged. Update layout styles only.

Prefer `useThemedStyles` for layout (or keep StyleSheet with token imports — match file style). Target structure:

```tsx
return (
  <Screen keyboard dismissKeyboardOnPress safe={{ top: true }}>
    <View style={styles.content}>
      <View style={styles.themeToggle}>
        <ThemeToggle variant="text" />
      </View>

      <View style={styles.logoContainer}>
        <AppText variant="title">Just Todos</AppText>
        <AppText variant="subtitle" color="textMuted" style={styles.subtitle}>
          Silahkan masuk ke akun Anda
        </AppText>
      </View>

      <View style={styles.form}>
        {/* TextFields + Button + TextButton unchanged in behavior */}
      </View>
    </View>
  </Screen>
);
```

Styles (tokenized; no magic hex):

```ts
const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  themeToggle: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.lg,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  form: {
    width: '100%',
  },
  submit: {
    marginTop: spacing.lg,
    width: '100%',
  },
});
```

Ensure Sign In `Button` has `style={styles.submit}` so it is full width. Button already pills from Task 4.

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: clean (or only pre-existing unrelated warnings).

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/login.tsx
git commit -m "feat(auth): restyle login for X-like canvas density"
```

---

### Task 9: Restyle Register screen

**Files:**

- Modify: `src/app/(auth)/register.tsx`

- [ ] **Step 1: Match login auth pattern**

Keep validation schema and field order. Align layout with login:

- Centered title **Buat Akun** + muted subtitle
- Stacked fields
- Full-width pill submit (`width: '100%'`, marginTop from tokens — replace magic `28` with `t.spacing.lg` or `xl`)
- Bottom `TextButton` back to login

Example style fixes inside `useThemedStyles`:

```ts
const styles = useThemedStyles((t) => ({
  content: {
    flexGrow: 1,
    justifyContent: 'center' as const,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center' as const,
    marginBottom: t.spacing.xl,
  },
  subtitle: {
    marginTop: t.spacing.sm,
    textAlign: 'center' as const,
  },
  submit: {
    marginTop: t.spacing.lg,
    width: '100%' as const,
  },
}));
```

No floating card wrappers.

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/register.tsx
git commit -m "feat(auth): restyle register to match X-like auth"
```

---

### Task 10: Restyle Home screen

**Files:**

- Modify: `src/app/(main)/home.tsx`

- [ ] **Step 1: Composer + list X-like density; monochrome complete indicator**

Requirements:

1. Replace all magic numbers (`20`, `10`, `14`, `12`, `6`, `24`) with `theme.spacing` / `theme.radius` / `theme.fontSize` / `theme.size`.
2. Circular add button: `borderRadius: t.radius.full`.
3. List rows: `surface` + thin `border`, radius `lg` or `md`.
4. Completed indicator: replace `✅` / `⬜` with simple monochrome marks, e.g. `✓` / `○` (or `●` / `○`), color via `text` / `textMuted` / `primary` for checked if desired.
5. Delete stays compact `error` text.
6. Empty state: single muted centered line.
7. Prefer wrapping with `Screen` safe top if easy; otherwise keep `KeyboardAvoidingView` but set `backgroundColor: theme.colors.background` and padding from tokens.

Suggested styles factory:

```ts
const styles = useThemedStyles((t) => ({
  root: {
    flex: 1,
    paddingHorizontal: t.spacing.md,
    paddingTop: t.spacing.md,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: t.spacing.lg,
    marginTop: t.spacing.sm,
  },
  subtitle: {
    marginTop: t.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row' as const,
    marginBottom: t.spacing.md,
    alignItems: 'center' as const,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radius.lg,
    fontSize: t.fontSize.md,
    marginRight: t.spacing.sm,
    minHeight: t.size.controlHeight,
  },
  addButton: {
    width: t.size.iconButton,
    height: t.size.iconButton,
    borderRadius: t.radius.full,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  listContainer: {
    paddingBottom: t.spacing.lg,
  },
  emptyText: {
    textAlign: 'center' as const,
    marginTop: t.spacing.xxl,
  },
  todoItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: t.spacing.md,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    marginBottom: t.spacing.sm,
  },
  todoTextContainer: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  todoCompleted: {
    textDecorationLine: 'line-through' as const,
  },
  deleteButton: {
    padding: t.spacing.sm,
    minHeight: t.size.touchMin,
    justifyContent: 'center' as const,
  },
}));
```

Render complete mark:

```tsx
<AppText
  variant="body"
  color={item.isCompleted ? 'primary' : 'textMuted'}
  style={{ marginRight: theme.spacing.sm }}
>
  {item.isCompleted ? '✓' : '○'}
</AppText>
<AppText
  variant="body"
  color={item.isCompleted ? 'textMuted' : 'text'}
  style={item.isCompleted ? styles.todoCompleted : undefined}
>
  {item.text}
</AppText>
```

Title can stay `Daftar Tugas` without emoji, or drop 📝 for cleaner X feel:

```tsx
<AppText variant="title" style={{ fontSize: theme.fontSize.xl }}>
  Daftar Tugas
</AppText>
```

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: clean.

- [ ] **Step 3: Grep for brand hex leakage**

```bash
rg -n "#[0-9A-Fa-f]{3,8}|007AFF|3b82f6" src/app src/components --glob '!**/node_modules/**'
```

Expected: no matches in screens/components (hex only allowed under `src/theme/`).

- [ ] **Step 4: Commit**

```bash
git add src/app/\(main\)/home.tsx
git commit -m "feat(home): X-like composer and list restyle"
```

---

### Task 11: Update styling guide

**Files:**

- Modify: `docs/styling-guide.md`

- [ ] **Step 1: Add brand + dark-first notes**

Near the top (after intro paragraph), add:

```md
**Visual brand:** X-like — pure black/white canvas, accent `#1D9BF0`, flat chrome, pill primary CTAs.

**Default mode:** Dark-first (`ThemeProvider` initializes `isDarkMode = true`). Light mode remains available via `ThemeToggle`.

**Design specs:**

- Enterprise foundation: [`docs/superpowers/specs/2026-07-17-enterprise-styling-design.md`](./superpowers/specs/2026-07-17-enterprise-styling-design.md)
- X-like redesign: [`docs/superpowers/specs/2026-07-17-x-like-design.md`](./superpowers/specs/2026-07-17-x-like-design.md)
```

Update any rule that still says “never `#007AFF`” to also mention never hardcoding X blue outside theme:

```md
1. **Semantic colors only** in screens: `theme.colors.primary`, never `#1D9BF0` or other hex.
```

- [ ] **Step 2: Commit**

```bash
git add docs/styling-guide.md
git commit -m "docs: note X-like brand and dark-first default"
```

---

### Task 12: Final verification pass

**Files:** none (verify only)

- [ ] **Step 1: Typecheck + lint whole project**

```bash
npx tsc --noEmit && npm run lint
```

Expected: exit 0.

- [ ] **Step 2: Hex isolation check**

```bash
rg -n "#[0-9A-Fa-f]{3,8}" src --glob '!**/node_modules/**'
```

Expected: matches only under `src/theme/` (primarily `colors.ts`).

- [ ] **Step 3: Manual visual checklist**

Run app (`npm start` / Expo):

| Check                                             | Dark | Light |
| ------------------------------------------------- | ---- | ----- |
| Cold start is dark pure black                     | ✓    | n/a   |
| Toggle switches to pure white light               | ✓    | ✓     |
| Primary CTA is pill + X blue                      | ✓    | ✓     |
| Links are X blue                                  | ✓    | ✓     |
| Login full-width Sign In                          | ✓    | ✓     |
| Register matches login density                    | ✓    | ✓     |
| Home composer circular +                          | ✓    | ✓     |
| Complete mark monochrome, not emoji checkbox spam | ✓    | ✓     |
| Header/status bar contrast OK                     | ✓    | ✓     |
| Form validation still works                       | ✓    | ✓     |

- [ ] **Step 4: Fix any gaps found, then final commit if needed**

Only if fixes were required:

```bash
git add -A
git commit -m "fix: polish X-like redesign after visual pass"
```

---

## Spec coverage checklist

| Spec requirement                            | Task                           |
| ------------------------------------------- | ------------------------------ |
| X palette pure black/white + `#1D9BF0`      | Task 1                         |
| Flat elevation / shape tokens               | Task 2                         |
| Dark-first default                          | Task 3                         |
| Pill primary Button, no heavy shadow        | Task 4                         |
| TextField radius + focus primary            | Task 5                         |
| Monochrome ThemeToggle                      | Task 6                         |
| Root layout pure canvas header              | Task 7                         |
| Login restyle                               | Task 8                         |
| Register restyle                            | Task 9                         |
| Home restyle + monochrome complete + tokens | Task 10                        |
| Styling guide update                        | Task 11                        |
| Success criteria verification               | Task 12                        |
| No multi-brand / custom fonts / X clone     | Out of scope — not implemented |
| Semantic hex only in theme                  | Tasks 1 + 10/12 grep           |

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-17-x-like-redesign.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — execute tasks in this session with checkpoints

Which approach?
