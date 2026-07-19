# Apple Auth + Floating Pill Nav — Implementation Plan

> **For agentic workers:** Inline execution in session after grill approval.

**Goal:** Ship quiet Apple auth suite + theme-adaptive floating pill tabs (5 destinations) with micro-motion.

**Architecture:** Custom `FloatingPillTabBar` on Expo Router Tabs; promote categories/tags; search tab wired to todo `search`; admin users via main stack from Profile; shared UI primitives (InitialsAvatar, GoogleLogo, TextField icons).

**Tech Stack:** Expo SDK 57, expo-router, Reanimated 4, lucide-react-native, expo-blur, react-native-svg, existing theme tokens.

---

### Task 1: Primitives

- Create `InitialsAvatar`, `GoogleLogo`
- Extend `TextField` with `leftIcon`
- Export from UI barrel

### Task 2: FloatingPillTabBar

- Create `src/components/navigation/FloatingPillTabBar.tsx`
- Wire in `(tabs)/_layout.tsx`

### Task 3: Tab routes

- Add `categories`, `tags`, `search` screens
- Move users to `(main)/users.tsx`
- Remove admin tab; update Profile
- Content bottom inset for floating bar

### Task 4: Auth redesign

- login / register / verify-email with Lucide, Google logo, mount motion

### Task 5: Verify

- Typecheck / lint; smoke critical paths
