# Apple Auth + Floating Pill Navigation — Design

**Date:** 2026-07-19  
**Status:** Approved (grilled decisions locked)

## Goals

1. Redesign auth screens (login, register, verify-email) with quiet Apple HIG language, Lucide icons, official Google mark, and micro-motion.
2. Replace the system tab bar with a modern floating pill/capsule tab bar (theme-adaptive glass, sliding active indicator, springs + haptics).
3. Restructure member IA to five product destinations with social-style chrome icons.

## Locked decisions

| #   | Decision              | Choice                                                                    |
| --- | --------------------- | ------------------------------------------------------------------------- |
| 1   | IA chrome style       | Social icon language (B)                                                  |
| 2   | Destinations          | B1: Home→Todos, Grid→Categories, Send→Tags, Search→Search, Avatar→Profile |
| 3   | Search vs admin Users | Always Search on bar; Users via Profile (admin)                           |
| 4   | Category/Tags ACL     | Read all; write admin-only on same screens                                |
| 5   | Pill material         | Theme-adaptive glass                                                      |
| 6   | Login visual          | Quiet Apple auth                                                          |
| 7   | Profile slot          | Circular initials avatar (photo-ready later)                              |
| 8   | Search depth          | Real todo title search (`search` filter)                                  |
| 9   | Active motion         | Sliding capsule + scale/color + light haptic                              |
| 10  | Auth scope            | Login + Register + Verify-email                                           |
| 11  | Admin cleanup         | No Admin tab; Profile → Users                                             |
| 12  | Pill labels           | Icons only + accessibilityLabel                                           |

## Architecture

### Navigation

```
(main)/
  (tabs)/          custom FloatingPillTabBar
    todos/         Home
    categories/    Grid
    tags/          Send
    search/        Search (todos by title)
    profile/       Initials avatar
  todo-form        modal (existing)
  users            admin-only stack screen (from Profile)
```

- Remove/hide former `admin` tab hub.
- Custom `tabBar` prop on Expo Router `Tabs`.
- Scene content uses bottom inset so lists clear the floating bar.

### Components

| Unit                 | Responsibility                                                          |
| -------------------- | ----------------------------------------------------------------------- |
| `FloatingPillTabBar` | Absolute capsule, glass/blur, 5 slots, sliding indicator, press springs |
| `InitialsAvatar`     | Name → 1–2 letters circle; optional imageUri later                      |
| `GoogleLogo`         | Official multicolor G (SVG), not Lucide                                 |
| `TextField`          | Optional `leftIcon` (Lucide)                                            |
| Auth screens         | Quiet hierarchy + staggered mount motion                                |

### Motion (Apple defaults)

- Critically damped springs (`motion.spring.snappy` / `default`) for tab indicator and press.
- Mount: staggered opacity + slight translateY; reduced-motion → opacity only.
- Haptic light on tab change via `hapticCommit('light')`.

### Materials

- Prefer `BlurView` / `GlassView` when available; solid elevated fill fallback (Android / reduced transparency).
- Light mode: light frosted pill; dark mode: dark frosted pill.
- Active icon high contrast; inactive `secondaryLabel` gray.

## Non-goals

- Backend avatar field
- Meta/Instagram brand logo (use LayoutGrid)
- Global search beyond todos
- Bouncy/overshoot tab springs

## Dependencies

- `lucide-react-native`, `react-native-svg`, `expo-blur` (plus existing Reanimated, haptics, glass-effect)
