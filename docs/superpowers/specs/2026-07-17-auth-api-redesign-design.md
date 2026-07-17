# Auth API Redesign — Design Spec

**Date:** 2026-07-17  
**Status:** Draft for user review  
**OpenAPI source:** https://todo-service.rizky-darmarazak.workers.dev/openapi.json  
**Scalar UI:** https://todo-service.rizky-darmarazak.workers.dev/docs#tag/auth

## Problem

Client auth no longer matches the backend:

| Current app                                                   | New API                                      |
| ------------------------------------------------------------- | -------------------------------------------- |
| Google → Firebase → `POST /auth/login` with Firebase ID token | `POST /auth/google` with Google `idToken`    |
| Bearer = Firebase ID token                                    | Bearer = backend `accessToken` JWT           |
| No refresh token                                              | `accessToken` + `refreshToken` + `expiresIn` |
| User payload flat / ad-hoc                                    | `data.user` inside `AuthSession`             |
| Email form not wired                                          | `POST /auth/login` + `POST /auth/register`   |
| Logout local-only                                             | `POST /auth/logout` with refresh token       |
| In-memory session only                                        | Persist via SecureStore + hydrate on boot    |

## Goals

1. Align mobile client with full Auth surface from OpenAPI.
2. Single session model for Google, email login, and register.
3. Survive app restart (SecureStore).
4. Silent token refresh on 401 (single-flight).
5. Proper logout (API + local clear + Google sign-out best-effort).

## Non-goals

- Proactive refresh timer before `expiresIn` elapses (401-driven only in v1).
- Biometric lock / PIN.
- Email verification deep links.
- Admin role-based UI beyond storing `role` on user.
- Removing the `firebase` package from the repo (stop using it in login path; full uninstall optional follow-up).

## Decisions (locked)

| Topic                    | Choice                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------- |
| Scope                    | Full auth: Google + email login + register + refresh + logout + `/me` helper          |
| Google path              | Native Google `idToken` → `POST /auth/google` only (no Firebase client in login flow) |
| Session persistence      | SecureStore for access, refresh, and user JSON                                        |
| Architecture             | Session-centric module + AuthContext + thin hooks                                     |
| Boot                     | If `refreshToken` present → `POST /auth/refresh` then commit or unauthenticated       |
| Navigation after success | `router.replace('/(main)/home')`                                                      |

## Architecture

### Happy paths

```text
Google:
  GoogleSignin → idToken
  → POST /auth/google { idToken }
  → commitSession(AuthSession)
  → replace /(main)/home

Email login:
  { email, password } → POST /auth/login
  → commitSession → home

Register:
  { name, email, password } → POST /auth/register (201)
  → commitSession → home

Cold start:
  status = bootstrapping
  read SecureStore
  if refreshToken → POST /auth/refresh → commitSession → authenticated
  else → unauthenticated
  index gate → home | login

API 401 (protected routes):
  single-flight POST /auth/refresh
  → update tokens → retry request
  → on fail clearSession (UI returns to login)

Logout:
  POST /auth/logout { refreshToken } (best-effort)
  → clearSession
  → GoogleSignin.signOut() (best-effort)
  → replace login
```

### Layering

| Layer                           | Responsibility                                                           |
| ------------------------------- | ------------------------------------------------------------------------ |
| `features/auth/types.ts`        | OpenAPI-aligned types                                                    |
| `features/auth/api/auth.api.ts` | HTTP: register, login, google, refresh, logout, me                       |
| `lib/auth-session.ts`           | Memory tokens + SecureStore + notify listeners; used by axios (no React) |
| `context/AuthContext.tsx`       | `user`, `status`, `commitSession`, `signOut`, boot hydrate               |
| `api/client.ts`                 | Bearer header; 401 refresh single-flight                                 |
| Hooks                           | `useGoogleSignIn`, `useEmailLogin`, `useRegister`                        |
| Screens                         | Forms, loading, errors, navigation only                                  |

### Why a non-React session module

Axios interceptors cannot call React hooks. Tokens live in `lib/auth-session.ts` (memory + SecureStore). `AuthContext` subscribes / calls into that module so UI and HTTP stay in sync.

## Data model

Mirror OpenAPI components:

```ts
type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  firebaseUid: string | null;
  createdAt: string;
  updatedAt: string;
};

type AuthSession = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // access TTL seconds (e.g. 900)
};

type AuthSessionResponse = {
  success: true;
  data: AuthSession;
  requestId: string;
};

type PublicUserResponse = {
  success: true;
  data: PublicUser;
  requestId: string;
};

type ErrorResponse = {
  success: false;
  error: { code: string; message: string };
  requestId?: string;
};
```

**Remove** legacy types: `LoginRequest { token }`, flat user-as-`data` without nested `user`, treating Firebase ID token as API bearer.

## Session storage

### SecureStore keys

| Key                 | Value                       |
| ------------------- | --------------------------- |
| `auth.accessToken`  | string JWT                  |
| `auth.refreshToken` | string JWT                  |
| `auth.user`         | JSON string of `PublicUser` |

### `commitSession(session: AuthSession)`

1. Set in-memory access + refresh (and optional user cache).
2. Write all three SecureStore keys.
3. Update React `user` / `status → authenticated`.
4. Notify listeners if any (for future).

### `clearSession()`

1. Clear memory tokens.
2. Delete SecureStore keys.
3. `user = null`, `status → unauthenticated`.

### AuthContext surface

```ts
status: 'bootstrapping' | 'authenticated' | 'unauthenticated'
user: PublicUser | null
isAuthenticated: boolean // status === 'authenticated'
commitSession(session: AuthSession): Promise<void>
signOut(): Promise<void>
```

### Boot UX

- While `bootstrapping`, do **not** redirect to login/home (prevents flash).
- `app/index.tsx` and auth screens wait until `status !== 'bootstrapping'`.
- UI: null/simple spinner acceptable for v1.

### Boot algorithm

1. `status = bootstrapping`.
2. Read SecureStore (`refreshToken`, optional `accessToken` + `user`).
3. No `refreshToken` → `clearSession` semantics → `unauthenticated`.
4. Has `refreshToken` → `POST /auth/refresh` → on success `commitSession` → `authenticated`; on failure `clearSession` → `unauthenticated`.
5. `GET /auth/me` is **not** required on boot (refresh already returns `user`). Keep `authApi.me()` for later profile screens.

## API client

### Request interceptor

If access token in memory → `Authorization: Bearer <accessToken>`.

### Response interceptor (401)

1. Skip refresh loop for: `/auth/refresh`, `/auth/login`, `/auth/register`, `/auth/google`, `/auth/logout`.
2. If already retried on this request → reject.
3. If no refresh token → `clearSession` → reject.
4. Else single-flight shared promise:
   - `POST /auth/refresh { refreshToken }`
   - Success → persist new session tokens (and user) → retry original request with new access token.
   - Failure → `clearSession` → reject.

## authApi

| Function   | Method | Path             | Body                  | Returns (unwrapped) |
| ---------- | ------ | ---------------- | --------------------- | ------------------- |
| `register` | POST   | `/auth/register` | name, email, password | `AuthSession`       |
| `login`    | POST   | `/auth/login`    | email, password       | `AuthSession`       |
| `google`   | POST   | `/auth/google`   | `{ idToken }`         | `AuthSession`       |
| `refresh`  | POST   | `/auth/refresh`  | `{ refreshToken }`    | `AuthSession`       |
| `logout`   | POST   | `/auth/logout`   | `{ refreshToken }`    | ok payload          |
| `me`       | GET    | `/auth/me`       | Bearer                | `PublicUser`        |

All through `apiClient`. Prefer returning unwrapped `data` after validating `success`.

Helper: `getApiErrorMessage(error)` reads Axios `error.response.data.error.message` when present.

## Hooks

| Hook              | Flow                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `useGoogleSignIn` | Play Services → `GoogleSignin.signIn` → `idToken` → `authApi.google` → `commitSession` → `replace` home |
| `useEmailLogin`   | `authApi.login` → commit → home                                                                         |
| `useRegister`     | `authApi.register` → commit → home                                                                      |

Shared success path only; no Firebase.

### Error UX (v1)

- Google cancel / in-progress: silent / log.
- Other errors: `Alert.alert` or inline text via `getApiErrorMessage`.
- Buttons honor `isPending`.

## UI wiring

### Login

- Email/password submit → `useEmailLogin`.
- Google button → `useGoogleSignIn`.
- If authenticated after boot → Redirect home.
- If bootstrapping → hold.

### Register

- Fields: **name**, email, password (add name if missing).
- Submit → `useRegister` → session + home (not “go login manually”).
- Map 409 to a clear “email already registered” message.

### Home

- Greeting from `useAuth().user`.
- Logout → `signOut()` then `replace` login.

### Guards

- `app/index.tsx`: boot wait → home | login.
- `(main)/_layout.tsx` (new): after boot, unauthenticated → login.

## File plan

| Action          | Path                                                                       |
| --------------- | -------------------------------------------------------------------------- |
| Rewrite         | `src/features/auth/types.ts`                                               |
| Rewrite         | `src/features/auth/api/auth.api.ts`                                        |
| Rewrite         | `src/features/auth/hooks/useGoogleSignIn.ts`                               |
| Add             | `src/features/auth/hooks/useEmailLogin.ts`                                 |
| Add             | `src/features/auth/hooks/useRegister.ts`                                   |
| Add             | `src/lib/auth-session.ts`                                                  |
| Add             | `src/lib/api-error.ts`                                                     |
| Rewrite/extend  | `src/context/AuthContext.tsx`                                              |
| Rewrite/extend  | `src/api/client.ts`                                                        |
| Merge/re-export | `src/lib/auth-token.ts` (compat or fold into auth-session)                 |
| Wire            | `src/app/(auth)/login.tsx`, `register.tsx`, `(main)/home.tsx`, `index.tsx` |
| Add             | `src/app/(main)/_layout.tsx`                                               |
| Dep             | `expo-secure-store` (`npx expo install expo-secure-store`)                 |
| Docs            | Update `docs/auth-flow.md` after implementation                            |
| Stop using      | Firebase in auth hooks/context (`lib/firebase.ts` unused by auth)          |

## Logout detail

```text
signOut():
  refresh = getRefreshToken()
  try { await authApi.logout({ refreshToken: refresh }) } catch { /* ignore */ }
  clearSession()
  try { await GoogleSignin.signOut() } catch { /* ignore */ }
// navigation: caller uses router.replace('/(auth)/login')
```

No Firebase sign-out in the new path.

## Manual verification

1. Register → lands on home; kill app → still home (after boot refresh).
2. Logout → login screen; kill app → still login.
3. Wrong password → readable error.
4. Google sign-in → home with correct name/email.
5. Expired access (or simulated 401) → refresh + request succeeds.
6. Invalid refresh → cleared session → login.
7. Register duplicate email → 409 message.

## Implementation order (for plan phase)

1. Types + `auth-session` (memory + SecureStore) + `api-error`.
2. `auth.api` full surface.
3. `api/client` interceptors (bearer + single-flight refresh).
4. `AuthContext` boot + commit + signOut.
5. Hooks: google, email login, register.
6. Wire screens + `(main)` guard + index boot gate.
7. Install SecureStore; manual test checklist.
8. Update `docs/auth-flow.md`.

## Risks & mitigations

| Risk                                     | Mitigation                                                  |
| ---------------------------------------- | ----------------------------------------------------------- |
| Google `idToken` vs what backend expects | OpenAPI says Google idToken; do not send Firebase token     |
| Refresh race with parallel 401s          | Single-flight promise                                       |
| Boot flash to login                      | `bootstrapping` status holds redirects                      |
| SecureStore unavailable (web/dev)        | Document; Android/iOS primary; fail soft to unauthenticated |
| Partial logout if API fails              | Always clear local session after best-effort API call       |

## OpenAPI reference (auth)

- `POST /auth/register` — email/password register → `AuthSessionResponse` (201)
- `POST /auth/login` — email/password → `AuthSessionResponse` (200)
- `POST /auth/google` — `{ idToken }` → `AuthSessionResponse` (200, auto-register)
- `POST /auth/refresh` — `{ refreshToken }` → `AuthSessionResponse` (200)
- `POST /auth/logout` — `{ refreshToken }` → success ok
- `GET /auth/me` — Bearer access → `PublicUserResponse`
- Security scheme: `bearerAuth` = access JWT from login/register/google

---

## Spec self-review

- [x] No TBD/placeholder sections left for required behavior
- [x] Architecture matches goals (session-centric, full surface, SecureStore)
- [x] Scope is one implementable auth redesign (not multi-product)
- [x] Ambiguities resolved: no Firebase in login; refresh-on-boot; 401-driven refresh; navigation ownership
