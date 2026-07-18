# Todo Service Client — Full Product (Member + Admin)

**Date:** 2026-07-18  
**Status:** Accepted (grilled + user confirmed)  
**API:** https://todo-service.rizky-darmarazak.workers.dev (`/openapi.json`)  
**UI:** Apple HIG design system (existing `src/theme` + primitives)  
**Domain language:** [`CONTEXT.md`](../../../CONTEXT.md)  
**ADRs:** [`docs/adr/0006`](../../adr/0006-member-plus-admin-todo-client.md)–`0008`

---

## 1. Problem

Auth is integrated; **todos are still in-memory** on home. The backend exposes a full Todo Service (todos, categories, tags, users admin). The app must become a real client: server state, rich todo UX, admin surfaces, HIG craft — not a local demo list.

---

## 2. Goals

1. Wire **all member-relevant + admin** Todo Service endpoints used by product UI.
2. Replace local home state with **TanStack Query** + selective optimistic updates.
3. **Power-user member UX**: full fields, filters/sort/search, infinite scroll, multi-select, session filter chips, due sectioning, batch actions.
4. **Admin CRUD** for categories, tags, users (role-gated).
5. **HIG** navigation (tabs), modals, confirms, haptics — reuse design system.
6. Document domain terms + ADRs; single vertical implementation plan with milestones.

### Non-goals

- Offline mutation queue / persisted Query cache as product
- Full calendar month UI / drag-to-reschedule
- Persisted named filter presets
- New backend endpoints
- Dual visual brand

---

## 3. Decisions (grilling)

| #   | Decision       | Choice                                                                                              |
| --- | -------------- | --------------------------------------------------------------------------------------------------- |
| 1   | Product scope  | **Member + admin**                                                                                  |
| 2   | Navigation     | Tab shell; admin gated by `role === 'admin'`                                                        |
| 3   | Power UX       | Closed kit: full fields/filters + multi-select (client) + session chips + due sections + batch APIs |
| 4   | Server state   | TanStack Query; **optimistic** toggle complete + delete                                             |
| 5   | Admin depth    | Full CRUD lists: Categories, Tags, Users                                                            |
| 6   | Tabs           | **Todos** \| **Profile** (+ **Admin** when admin)                                                   |
| 7   | Create/edit    | **Modal / form sheet**                                                                              |
| 8   | Pagination     | **Infinite scroll** (`useInfiniteQuery`)                                                            |
| 9   | Destructive UX | **Confirm every delete** (single + bulk + admin)                                                    |
| 10  | Delivery       | One vertical plan, phased milestones                                                                |

---

## 4. Architecture

```
src/app/(main)/
  _layout.tsx          # Tabs: todos | profile | admin?
  todos/
    index.tsx          # List + filters + multi-select
  profile/
    index.tsx          # Account, theme, sign out, admin entry
  admin/
    _layout.tsx        # Stack, guard role
    index.tsx          # Hub
    categories.tsx
    tags.tsx
    users.tsx

src/features/
  todos/     api, types, queries, hooks
  categories/
  tags/
  users/     (extend existing)
  auth/      (existing; me if needed)

Modals (expo-router formSheet / modal):
  todo/form   # create + edit (param id?)
```

### Layers

| Layer       | Responsibility                                        |
| ----------- | ----------------------------------------------------- |
| `*.api.ts`  | HTTP + unwrap envelope `success/data/meta`            |
| `queries/*` | Query keys, useQuery / useInfiniteQuery / useMutation |
| Screens     | Compose hooks + HIG primitives; no hex; no raw axios  |
| Auth        | Existing session; `user.role` for admin gate          |

**Rule:** Screens never call `apiClient` directly.

---

## 5. API mapping (OpenAPI → features)

### 5.1 Todos (member)

| Method | Path           | App use                                                                          |
| ------ | -------------- | -------------------------------------------------------------------------------- |
| GET    | `/todos`       | Infinite list; query: status, category, tag, priority, search, sort, page, limit |
| POST   | `/todos`       | Create from form sheet                                                           |
| GET    | `/todos/{id}`  | Prefill edit sheet if needed                                                     |
| PATCH  | `/todos/{id}`  | Update fields; toggle completed                                                  |
| DELETE | `/todos/{id}`  | Delete (confirm first)                                                           |
| PATCH  | `/todos/batch` | `complete-all` \| `delete-completed`                                             |

### 5.2 Categories / Tags

| Method            | Path                       | Who                                                      |
| ----------------- | -------------------------- | -------------------------------------------------------- |
| GET               | `/categories`, `/tags`     | All authenticated (filters + form pickers + admin lists) |
| POST/PATCH/DELETE | `/categories/*`, `/tags/*` | **Admin only**                                           |

### 5.3 Users (admin)

| Method | Path          | App use              |
| ------ | ------------- | -------------------- |
| GET    | `/users`      | List + search + page |
| GET    | `/users/{id}` | Optional detail      |
| PATCH  | `/users/{id}` | `{ role }`           |
| DELETE | `/users/{id}` | Delete (confirm)     |

### 5.4 Auth (existing)

Keep current flows. Optional: refresh profile via `GET /auth/me` on Profile focus.

---

## 6. Domain types (aligned with OpenAPI)

```ts
type Priority = 'low' | 'medium' | 'high';

type Todo = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  dueDate: string | null;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
};

type TodoWithRelations = Todo & {
  category: Category | null;
  tags: Tag[];
};

type Category = { id; name; color: string | null; createdAt; updatedAt };
type Tag = { id; name; color: string | null; createdAt; updatedAt };

type PaginationMeta = { page; limit; total; totalPages };

type TodoListFilters = {
  status?: 'completed' | 'active';
  category?: string; // uuid
  tag?: string;
  priority?: Priority;
  search?: string;
  sort?:
    | 'createdAt'
    | '-createdAt'
    | 'dueDate'
    | '-dueDate'
    | 'priority'
    | '-priority';
};
```

Envelope unwrap in API layer:

- List: `{ success, data, meta, requestId }` → `{ items: data, meta }`
- Detail/mutation: return `data` only
- Errors: existing `getApiErrorMessage` / toast

**API-sourced colors:** Category/Tag `color` hex from server may render as chip background. That is **entity data**, not theme tokens — do not put API hex into `theme/colors.ts`. Theme still owns UI chrome.

---

## 7. Member UX

### 7.1 Todos tab

- **Screen** `systemGroupedBackground`, HIG grouped list.
- **Toolbar / chips (session only):** status (all/active/completed), priority, category, tag, search field, sort control.
- **Due sectioning:** when presenting list, group rows into Overdue / Today / Upcoming / No date (client-side buckets on loaded pages; document limitation with infinite scroll — sections apply to **currently loaded items**).
- **Row:** checkbox complete (optimistic + haptic), title, priority indicator, due caption, category/tag chips; swipe or trailing delete → **confirm** → optimistic remove.
- **Multi-select mode:** enter via edit button; select rows; bar actions: complete selected / delete selected (confirm) via parallel/serial PATCH/DELETE + progress toast.
- **Batch API menu:** Complete all active; Delete all completed (both confirm).
- **FAB / + :** open create **form sheet**.
- **Row press:** open edit **form sheet** (load detail if needed).
- **Infinite scroll:** `useInfiniteQuery`, `limit` 20, fetch next near end; filters change → reset pages.

### 7.2 Form sheet (create/edit)

Fields: title (required), description, priority segmented, due date picker, category picker (GET categories), multi tag picker (GET tags, max 10).  
Submit: POST or PATCH → invalidate todos queries → dismiss sheet → toast on error.

### 7.3 Profile tab

- Name, email, role badge.
- ThemeToggle.
- Sign out.
- If admin: navigation row → Admin hub.

### 7.4 Admin (role gate)

- Entry only if `user.role === 'admin'`.
- Tab **Admin** visible only then **or** Profile → Admin stack (recommendation: **dedicated Admin tab** when admin for discoverability — matches Q6 “Admin tab”).
- **Categories / Tags:** list, add, edit name/color, delete confirm.
- **Users:** search, infinite or paged list, change role (confirm), delete confirm.
- Non-admin deep link → redirect Profile/Todos.

---

## 8. Data layer patterns

### Query keys

```ts
todoKeys.all;
todoKeys.list(filters);
todoKeys.infinite(filters);
todoKeys.detail(id);
categoryKeys.all / list;
tagKeys.all / list;
userKeys.list(filters); // existing, extend
```

### Optimistic

- **Toggle complete:** cancel queries → snapshot → setInfiniteData map completed → PATCH → onError rollback → onSettled invalidate.
- **Delete single:** same pattern after confirm.
- **Create / multi-field edit / multi-select / batch:** await server → invalidate (or setQueryData); show loading on control.

### Multi-select

Client loops selected IDs; `Promise.allSettled`; toast summary (N ok, M failed); invalidate list.

---

## 9. HIG / Apple craft

- Reuse tokens, Button variants, Screen, AppText, TextField, symbols, haptics, reduced motion.
- Confirmations: `Alert.alert` or HIG-style action sheet (RN Alert OK for v1).
- Form sheet: `presentation: 'formSheet'` / `modal` per Expo Router 57.
- Instant press feedback on rows/controls; no artificial delays.
- Loading: list skeleton or spinner; pull-to-refresh invalidate.
- Empty states: clear copy + CTA add todo.
- Error: toast via existing toast helper.

---

## 10. Routing sketch (Expo Router 57)

```
(main)/_layout.tsx          Tabs
  todos/index.tsx
  profile/index.tsx
  admin/_layout.tsx         Stack + role guard
    index.tsx
    categories.tsx
    tags.tsx
    users.tsx
(todo)/_layout.tsx          modal group (optional)
  form.tsx                  create | edit?id=
```

Migrate current `(main)/home` → `todos/index` (or rename home and redirect).

Protected: still root `Stack.Protected` authenticated.

---

## 11. Implementation milestones (single plan)

1. **Foundation:** types + todo/category/tag/user APIs unwrap + query keys
2. **Todos list core:** infinite query, create title, toggle, delete confirm, replace home
3. **Full form sheet + fields:** description, priority, due, category, tags
4. **Power filters:** chips, search, sort, due sections, multi-select, batch
5. **Tabs shell:** Todos | Profile (+ Admin tab)
6. **Admin CRUD:** categories, tags, users
7. **Polish:** empty/error, haptics, a11y, docs styling note if needed

---

## 12. Testing & verification

1. `npx tsc --noEmit` + `npm run lint`
2. Manual member: login → list sync → create full form → filter/search/sort → infinite scroll → multi-select → batch → delete confirm
3. Optimistic: toggle offline/fail path rollback (optional airplane)
4. Admin user: Admin tab visible; CRUD category/tag; user role/delete
5. Non-admin: no Admin tab; admin routes redirect

---

## 13. Risks

| Risk                    | Mitigation                                                     |
| ----------------------- | -------------------------------------------------------------- |
| Scope                   | Closed power kit + milestones                                  |
| Due sections + infinite | Document “loaded pages only”                                   |
| Multi-select N+1        | Cap selection UI feedback; allSettled                          |
| Modal + keyboard        | formSheet + Screen keyboard                                    |
| Role change mid-session | Re-read user from session; invalidate on admin role patch self |

---

## 14. Success criteria

- [ ] No local-only todo state on home
- [ ] All member todo endpoints used by UI
- [ ] Categories/tags GET for pickers; admin write paths for admin
- [ ] Users admin list/role/delete
- [ ] Infinite list + filters + form sheet + multi-select + batch
- [ ] Confirm on every delete
- [ ] Optimistic complete/delete
- [ ] HIG tabs + role-gated admin
- [ ] tsc + lint pass
