# Styling Guide

How we style the Just Todos Expo app. Read this before adding UI.

**Visual brand:** X-like — pure black/white canvas, accent `#1D9BF0`, flat chrome, pill primary CTAs.

**Default mode:** Dark-first (`ThemeProvider` initializes `isDarkMode = true`). Light mode remains available via `ThemeToggle`.

**Design specs:**

- Enterprise foundation: [`docs/superpowers/specs/2026-07-17-enterprise-styling-design.md`](./superpowers/specs/2026-07-17-enterprise-styling-design.md)
- X-like redesign: [`docs/superpowers/specs/2026-07-17-x-like-design.md`](./superpowers/specs/2026-07-17-x-like-design.md)

---

## Architecture (one minute)

```
Screen  →  UI primitives  →  useAppTheme / useThemedStyles  →  src/theme/*
```

| Layer          | Path                         | Owns                                     |
| -------------- | ---------------------------- | ---------------------------------------- |
| Tokens & theme | `src/theme/`                 | colors, spacing, radius, type, elevation |
| Hooks          | `src/hooks/`, `src/context/` | theme access, memoized styles            |
| Primitives     | `src/components/ui/`         | Button, AppText, Screen, TextField, …    |
| Screens        | `src/app/`                   | product layout & data only               |

---

## Rules

### Do

1. **Semantic colors only** in screens: `theme.colors.primary`, never `#1D9BF0` or other hex.
2. **Spacing / radius / font** from `theme.spacing`, `theme.radius`, `theme.fontSize`.
3. Prefer **UI primitives** (`Button`, `AppText`, `TextField`, `Screen`, …) before inventing controls.
4. Use **`useThemedStyles`** for screen-specific layout that depends on the theme scale.
5. Keep factories **pure**: `(theme) => styles` — no component state inside the factory.

### Don’t

1. Hardcode brand hex outside `src/theme/`.
2. Copy-paste primary button styles into a new screen.
3. Use magic offsets like `top: 60` — use `Screen` safe edges or `useSafeAreaInsets`.
4. Call `StyleSheet.create` on every render without memoization.
5. Put business logic inside UI primitives.

---

## Theme API

```ts
import { useAppTheme } from '@/context/ThemeContext';

const { theme, isDarkMode, toggleTheme } = useAppTheme();

theme.colors.background;
theme.colors.primary;
theme.spacing.lg; // 24
theme.radius.sm; // 8
theme.fontSize.md; // 16
theme.typography.title;
theme.elevation('sm', theme.colors.shadow);
```

### Adding a color

1. Add palette value in `src/theme/colors.ts` (if new raw hex).
2. Add semantic key to `SemanticColors` and both `lightColors` / `darkColors`.
3. Use `theme.colors.yourKey` or extend `AppText` color roles if needed.

### Adding spacing / type

Edit `src/theme/tokens.ts` or `typography.ts`. Prefer extending the scale over one-off numbers in screens.

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

Import from the barrel:

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

| Component     | Use for                                              |
| ------------- | ---------------------------------------------------- |
| `Screen`      | Root chrome: background, keyboard, safe area, scroll |
| `AppText`     | All text (`variant` + semantic `color`)              |
| `Button`      | Primary / ghost / danger actions                     |
| `TextButton`  | Inline navigation links under forms                  |
| `TextField`   | react-hook-form controlled inputs                    |
| `ThemeToggle` | Light/dark switch (`text` \| `icon`)                 |

### Example screen pattern

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
        <AppText variant="subtitle" color="textMuted">
          Subtitle
        </AppText>
        <Button title="Continue" onPress={() => {}} />
      </View>
    </Screen>
  );
}
```

---

## Adding a new primitive

1. Create `src/components/ui/YourComponent.tsx`.
2. Consume `useAppTheme` / `useThemedStyles` only — no hex.
3. Export types + component from `src/components/ui/index.ts`.
4. Prefer composition of `AppText` / `Button` over forking styles.
5. Include accessibility props (`accessibilityRole`, disabled state, `hitSlop` for small targets).

---

## Anti-patterns (real)

```tsx
// ❌ hex in screen
<Text style={{ color: '#007AFF' }}>Link</Text>

// ✅ semantic
<AppText variant="link" color="primary">Link</AppText>
```

```tsx
// ❌ duplicated button
<TouchableOpacity style={{ padding: 16, backgroundColor: theme.primary }}>
  <Text style={{ color: '#fff' }}>Save</Text>
</TouchableOpacity>

// ✅ primitive
<Button title="Save" onPress={onSave} />
```

```tsx
// ❌ unsafe notch offset
<View style={{ position: 'absolute', top: 60, right: 24 }} />

// ✅ Screen safe + themed layout
<Screen safe={{ top: true }}>
  <View style={styles.themeToggle}>...</View>
</Screen>
```

---

## Checklist before PR

- [ ] No new hex outside `src/theme/`
- [ ] New spacing uses tokens (or documents a one-off with a comment why)
- [ ] Shared controls go through `components/ui`
- [ ] Light and dark both look correct
- [ ] `npx tsc --noEmit` and `npm run lint` pass
