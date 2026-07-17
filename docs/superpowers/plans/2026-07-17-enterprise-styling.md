# Enterprise Styling System Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a type-safe design-token theme, reusable UI primitives, full screen migration, register bugfix, and contributor styling guide.

**Architecture:** `theme/*` (tokens + semantic colors + typography) → `useAppTheme` / `useThemedStyles` → `components/ui/*` primitives → screens consume only primitives + themed layout styles.

**Tech Stack:** Expo 57, React Native 0.86, TypeScript, Expo Router, react-hook-form, react-native-safe-area-context

**Spec:** `docs/superpowers/specs/2026-07-17-enterprise-styling-design.md`

---

## File map

| Path                                  | Action                         |
| ------------------------------------- | ------------------------------ |
| `src/theme/tokens.ts`                 | Create                         |
| `src/theme/colors.ts`                 | Create                         |
| `src/theme/typography.ts`             | Create                         |
| `src/theme/index.ts`                  | Create                         |
| `src/hooks/useThemedStyles.ts`        | Create                         |
| `src/context/ThemeContext.tsx`        | Modify → full Theme            |
| `src/components/ui/AppText.tsx`       | Create                         |
| `src/components/ui/Button.tsx`        | Create                         |
| `src/components/ui/TextButton.tsx`    | Create                         |
| `src/components/ui/ThemeToggle.tsx`   | Create                         |
| `src/components/ui/Screen.tsx`        | Create                         |
| `src/components/ui/TextField.tsx`     | Create (from CustomInputField) |
| `src/components/ui/index.ts`          | Create barrel                  |
| `src/components/CustomInputField.tsx` | Delete after migration         |
| `src/constants/themes.ts`             | Delete after migration         |
| `src/app/_layout.tsx`                 | Modify                         |
| `src/app/(auth)/login.tsx`            | Modify                         |
| `src/app/(auth)/register.tsx`         | Modify + confirmPassword fix   |
| `src/app/(main)/home.tsx`             | Modify                         |
| `docs/styling-guide.md`               | Create                         |

---

### Task 1: Theme foundation

- [ ] Create `src/theme/tokens.ts`, `colors.ts`, `typography.ts`, `index.ts`
- [ ] Values match current UI (spacing 4–40, radius 8, fonts 12–32, existing light/dark hex)

### Task 2: ThemeContext + useThemedStyles

- [ ] Update `ThemeContext` to export full `Theme` from `@/theme`
- [ ] Create `src/hooks/useThemedStyles.ts` (memo on `theme` only)

### Task 3: UI primitives

- [ ] `AppText`, `Button`, `TextButton`, `ThemeToggle`, `Screen`, `TextField`, barrel `index.ts`

### Task 4: Migrate screens

- [ ] `_layout`, login, register (fix confirm field), home
- [ ] Remove `CustomInputField.tsx`, `constants/themes.ts`

### Task 5: Docs + verify

- [ ] `docs/styling-guide.md`
- [ ] `npx tsc --noEmit` + `npm run lint`
- [ ] Commit implementation

---

## Verification checklist

- Typecheck clean
- Lint clean
- No brand hex outside `src/theme/`
- Register confirmPassword works
- Theme toggle on auth + home
