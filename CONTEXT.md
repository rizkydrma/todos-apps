# Just Todos — Design & Product Context

Domain language for the Expo app’s product UI and design system. Implementation lives in `src/theme`, `src/features`, and `src/components/ui`; this file is glossary only.

## Language

### Todo domain

**Todo**:
A task owned by a user: title, optional description, completion state, priority, optional due date, optional category, and zero or more tags. Identity and persistence live on the Todo Service, not on the device alone.
_Avoid_: Task (as a synonym in this app), item (when meaning a Todo entity)

**Priority**:
Relative urgency of a Todo: `low`, `medium`, or `high` (server enum).
_Avoid_: Importance, severity

**Category**:
A named catalog label (optional color) that groups Todos. Managed by admins; members assign/filter only.
_Avoid_: Folder, project, list (when meaning Category)

**Tag**:
A named catalog label (optional color) that annotates Todos; a Todo may have many tags. Managed by admins; members assign/filter only.
_Avoid_: Label (when meaning Tag entity — Label is a text color role in the design system)

**Todo filter**:
A set of list constraints (status, category, tag, priority, search, sort) applied to GET `/todos`. Session filter chips are not persisted across app restarts in v1.
_Avoid_: Saved search (not v1), smart list

**Admin**:
A user with `role === 'admin'` who may mutate categories, tags, and users. UI for these actions is fail-closed (hidden/blocked for non-admins).
_Avoid_: Superuser, root

### Design system

**Design Token**:
A named primitive design value (spacing step, radius, type size, motion parameter, material weight) that does not change with light/dark by itself.
_Avoid_: Magic number, hardcode, style constant (when referring to the shared scale)

**Semantic Color**:
A role-based color name that maps to different concrete values in light vs dark. Public API uses **HIG/UIColor system names** (e.g. `label`, `systemBackground`, `systemBlue`) plus thin app aliases (`primary`, `destructive`, `onPrimary`).
_Avoid_: Hex in screens, brand color (as a screen-level reference), palette color (use only inside the theme module)

**System Color Table**:
The version-pinned static source of light/dark resolved values for the full system color set (reference pin: **iOS 18**). Updated only by deliberate PR when the pin changes.
_Avoid_: Runtime UIColor bridge (not current approach), ad hoc hex expansion

**Theme Mode**:
The active appearance: light or dark. Selects which semantic color map is live. Default follows the **system** appearance; ThemeToggle applies a **session-only** light/dark override (not persisted). OS appearance changes do not clear an active session override.
_Avoid_: Theme (alone — ambiguous with the full Theme object), color scheme (unless meaning OS setting), dark-first (retired default), persisted appearance preference (not v1)

**Typography Variant**:
A named text style (title, body, caption, …) bundling size, weight, tracking, and leading as one unit. Scale is fixed for v1 (not full Dynamic Type reflow); tracking and leading are size-specific.
_Avoid_: Font style, text style (when meaning a tokenized variant), Dynamic Type (as current v1 behavior)

**UI Primitive**:
A shared visual building block (Button, AppText, Screen, TextField) that consumes the design system so screens stay thin.
_Avoid_: Component (when meaning design-system control specifically), widget

**System Symbol**:
A platform symbol (SF Symbol via `expo-symbols`) used for chrome affordances (theme toggle, add, checkmarks). Not a custom icon font.
_Avoid_: Emoji-as-icon (for chrome), custom icon pack

**Control Variant**:
A named button/action style aligned with HIG: `filled`, `tinted`, `gray`, `plain`, `destructive`.
_Avoid_: primary/ghost/danger (retired Button API names)

**Text Field**:
A form input primitive using an iOS-style rounded rect with placeholder and optional static caption label — not a floating-label pattern.
_Avoid_: Floating label, outlined Material field

### Brand direction (resolved)

**HIG Visual Language**:
The product’s visual brand follows Apple Human Interface Guidelines–faithful system colors, materials hierarchy, and type craft — not the previous X-like black/blue flat brand.
_Avoid_: X-like, Twitter-like (retired direction)

**Grouped List**:
A list presentation on a grouped background where rows share an inset rounded container with hairline separators — the default layout language for Home todos.
_Avoid_: Full-bleed X-style row stack (as the default Home look)

**Material**:
A surface treatment that encodes hierarchy (background, secondary background, fill, chrome). In v1 materials are **solid** HIG-style surfaces; translucent blur is a future enhancement, not the current look.
_Avoid_: Glass, blur bar, vibrancy (as current product look)

**Motion Token**:
A named motion parameter or preset (spring response/damping, duration, press scale) shared by UI primitives so timing is not invented per screen.
_Avoid_: Animation config (when meaning the shared scale), duration (alone when a spring preset is intended)

**Fluid Interaction**:
A user-driven motion that stays continuous and interruptible: starts from the live on-screen value, can reverse mid-flight, and (when gesture-driven) hands off velocity. Applied to existing product surfaces only in this redesign — not new chrome invented for demos.
_Avoid_: Animation, transition (when the interaction must be interruptible/gesture-aware)

**Reduced Motion Mode**:
When the OS requests reduced motion, UI uses short cross-fades / opacity feedback instead of springs, overshoot, or large translations. Feedback remains; vestibular motion goes away.
_Avoid_: No animation, disable all feedback

**Commit Haptic**:
A short haptic fired only on meaningful commits (e.g. todo complete, destructive action), not on every press or keystroke.
_Avoid_: Haptic on every tap, decorative vibration

### Cold start (session gate)

**Cold Start Hold**:
The single branded native splash that remains visible from process start until the app has both a resolved session state and a **Cold Start Destination** on screen. No second JS layer that redraws the same splash art.
_Avoid_: Double splash, BootstrapCover (as a second splash), splash flash

**Cold Start Destination**:
The only screens that may appear when the hold ends on a normal launch: **Login** (unauthenticated) or **Home todos** (authenticated). Intermediate anchors (root `/` redirect) are not destinations.
_Avoid_: Entry hop, index redirect (as a visible step), any-auth-route / any-main-route (v1 cold start is narrower)

**Auth Bootstrap**:
The phase while session is still unknown (`bootstrapping`): SecureStore hydrate and optional refresh. Ends in authenticated, unauthenticated, or timeout-as-unauthenticated.
_Avoid_: Loading (alone), isLoading (when meaning this phase)

**Bootstrap Timeout**:
A hard cap on Auth Bootstrap (15s). On expiry the session is treated as unauthenticated so the hold can end at Login instead of hanging forever.
_Avoid_: Infinite splash wait

## Brand decisions (resolved in grilling)

These are product decisions captured for implementers; prefer ADRs for hard-to-reverse choices.

- Visual language: **full HIG redesign** (not X-like craft-only)
- Colors: **full iOS 18 system color table**, static pin, HIG names + app aliases
- Materials v1: **solid** surfaces (blur later)
- Motion: **full fluid fidelity** on existing surfaces + shared infrastructure (no new demo chrome)
- Type: fixed scale with size-specific tracking/leading (not full Dynamic Type)
- Controls: HIG variants `filled|tinted|gray|plain|destructive`
- Fields: rounded + placeholder (no floating label)
- Home: inset grouped list
- Appearance: system default, session override
- Icons: SF Symbols for chrome
- Haptics: selective commits
- Delivery: one vertical redesign slice

## Todo Service client (resolved in grilling)

- Scope: **member + admin**
- Tabs: Home | + (create action) | Profile (no Categories/Tags/Search tabs)
- Power kit: full fields/filters + session chips + due sections (no multi-select/batch, no calendar month, no saved presets)
- Server state: TanStack Query; optimistic complete/delete
- Create: tab-bar center sheet (TodoCreateProvider); edit: local sheet on list
- List: infinite scroll
- Deletes: confirm every time
- Delivery: one vertical plan, phased milestones

## Cold start (resolved in grilling)

- Hold: **single native** branded splash until Auth Bootstrap + Cold Start Destination
- Destinations: **Login** or **Home todos** only (v1)
- No JS second paint of splash art; no visible `/` redirect hop
- Bootstrap timeout: **15s** → unauthenticated → Login
- ADR: `docs/adr/0011-cold-start-single-native-hold.md`
