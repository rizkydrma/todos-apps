# Styling Guide

How we style the Just Todos Expo app. Read this before adding UI.

**Visual brand:** Apple HIG — system colors (iOS 18 pin), solid materials, continuous controls, inset grouped lists. System appearance by default.

**Domain language:** [`CONTEXT.md`](../CONTEXT.md)

**Design specs / decisions:**

- HIG redesign: [`docs/superpowers/specs/2026-07-18-apple-hig-design-system.md`](./superpowers/specs/2026-07-18-apple-hig-design-system.md)
- ADRs: [`docs/adr/`](./adr/)
- Historical (superseded brand): enterprise styling + X-like specs under `docs/superpowers/specs/2026-07-17-*`

---

## Architecture (one minute)

```
Screen  →  UI primitives  →  useAppTheme / useThemedStyles  →  src/theme/*
```

| Layer          | Path                         | Owns                                          |
| -------------- | ---------------------------- | --------------------------------------------- |
| Tokens & theme | `src/theme/`                 | system colors, spacing, radius, type, motion  |
| Hooks          | `src/hooks/`, `src/context/` | theme access, reduced motion, memoized styles |
| Primitives     | `src/components/ui/`         | Button, AppText, Screen, TextField, …         |
| Screens        | `src/app/`                   | product layout & data only                    |

---

## Rules

### Do

1. **HIG / semantic colors only** in screens: `theme.colors.label`, `theme.colors.systemBlue`, never raw hex.
2. **Spacing / radius / font / motion** from `theme.spacing`, `theme.radius`, `theme.fontSize`, `theme.motion`.
3. Prefer **UI primitives** before inventing controls.
4. Use **`useThemedStyles`** for screen-specific layout that depends on the theme.
5. Keep style factories **pure**: `(theme) => styles`.
6. Respect **reduced motion** for new animations (`useReducedMotion` + opacity cross-fades).

### Don’t

1. Hardcode brand hex outside `src/theme/`.
2. Reintroduce X-like patterns (pill primary CTAs, floating labels, pure-black X blue brand).
3. Use magic offsets like `top: 60` — use `Screen` safe edges or `useSafeAreaInsets`.
4. Fire haptics on every press — only **commit** moments (`hapticCommit`).
5. Put business logic inside UI primitives.

---

## Theme API

```ts
import { useAppTheme } from '@/context/ThemeContext';

const { theme, isDarkMode, override, toggleTheme } = useAppTheme();

theme.colors.systemBackground;
theme.colors.label;
theme.colors.primary; // alias → systemBlue
theme.colors.destructive; // alias → systemRed
theme.spacing.lg; // 24
theme.radius.lg; // 12 — continuous controls
theme.motion.spring.snappy;
theme.motion.press.scale; // 0.97
theme.typography.title;
theme.elevation('sm', theme.colors.shadow);
```

### Appearance

- Default: **OS** light/dark (`useColorScheme`).
- `toggleTheme`: **session override** only (not persisted).
- OS change while override is set: override wins until process death.

### Adding a color

1. Prefer an existing **system** key from `systemColors.ios18.ts`.
2. If truly new and not in UIColor set, add to the pin table (both light + dark) or as an **app alias** in `colors.ts`.
3. Pin bumps are deliberate (see ADR-0002).

### Adding spacing / type / motion

Edit `src/theme/tokens.ts`, `typography.ts`, or `motion.ts`. Prefer extending the scale over one-off numbers in screens.

---

## `useThemedStyles`

```tsx
import { useThemedStyles } from '@/hooks/useThemedStyles';

const styles = useThemedStyles((t) => ({
  header: {
    marginBottom: t.spacing.lg,
    paddingHorizontal: t.spacing.lg,
  },
}));
```

- Recomputes when light/dark theme changes.
- Factory must be a pure function of `theme`.

---

## UI primitives

```ts
import {
  AppText,
  Button,
  Screen,
  TextButton,
  TextField,
  ThemeToggle,
} from '@/components/ui';
```

| Component     | Use for                                                       |
| ------------- | ------------------------------------------------------------- |
| `Screen`      | Root chrome; `background="systemGroupedBackground"` for lists |
| `AppText`     | All text (`variant` + semantic `color`)                       |
| `Button`      | `filled` \| `tinted` \| `gray` \| `plain` \| `destructive`    |
| `TextButton`  | Inline text actions under forms                               |
| `TextField`   | RHF inputs — rounded + placeholder, no float label            |
| `ThemeToggle` | Session light/dark (`text` \| `icon` + SF Symbol)             |

### Example

```tsx
export default function ExampleScreen() {
  const styles = useThemedStyles((t) => ({
    content: {
      flex: 1,
      paddingHorizontal: t.spacing.lg,
      justifyContent: 'center' as const,
    },
  }));

  return (
    <Screen keyboard safe={{ top: true }}>
      <View style={styles.content}>
        <AppText variant="title">Hello</AppText>
        <AppText variant="subtitle" color="secondaryLabel">
          Subtitle
        </AppText>
        <Button title="Continue" variant="filled" onPress={() => {}} />
      </View>
    </Screen>
  );
}
```

---

## Motion & haptics

- Springs/press: `theme.motion` + Reanimated; see `src/theme/motion.ts`.
- Reduced motion: `useReducedMotion()` → opacity/timing only.
- Haptics: `import { hapticCommit } from '@/lib/haptics'` on complete/delete commits only.

---

## Checklist before PR

- [ ] No new hex outside `src/theme/`
- [ ] New spacing uses tokens (or documents a one-off with a comment why)
- [ ] Shared controls go through `components/ui`
- [ ] Light and dark (system + toggle) look correct
- [ ] Reduced motion does not break feedback
- [ ] `npx tsc --noEmit` and `npm run lint` pass
