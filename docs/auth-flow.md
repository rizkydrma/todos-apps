# Auth Flow — Mekanisme Login (Referensi Masa Depan)

Dokumentasi **alur login end-to-end** di app ini: provider (Google / email) → backend JWT session → SecureStore → navigasi.

Untuk setup native Google (webClientId, SHA-1, prebuild), lihat **`docs/google-sign-in.md`**.  
Dokumen ini fokus ke **session app**, kontrak Auth API, file map, dan cara menambah method login baru.

**OpenAPI / Scalar (tag auth):**  
https://todo-service.rizky-darmarazak.workers.dev/docs#tag/auth

Terakhir diselaraskan dengan kode: **Juli 2026** (JWT session API redesign).

---

## Ringkasan 30 detik

| Pertanyaan                                  | Jawaban di project ini                                               |
| ------------------------------------------- | -------------------------------------------------------------------- |
| Siapa yang “membuktikan” identitas Google?  | Native Google Sign-In → **Google `idToken`** (bukan Firebase client) |
| Siapa yang membuat / mengembalikan session? | Backend: `POST /auth/google`, `/auth/login`, `/auth/register`        |
| Token untuk API selanjutnya?                | Backend **`accessToken` JWT** (Bearer) + **`refreshToken`**          |
| Di mana session disimpan?                   | Memory (`auth-session`) + SecureStore keys di bawah                  |
| Setelah sukses ke mana?                     | `commitSession` → `router.replace('/(main)/home')`                   |
| Restart app?                                | Hydrate SecureStore → `POST /auth/refresh` jika ada refreshToken     |

**Legacy (sudah tidak dipakai di login path):** Firebase `signInWithCredential` + `POST /auth/login` dengan Firebase ID token. Package `firebase` / `lib/firebase.ts` boleh residual; hooks auth **tidak** import Firebase.

---

## Diagram alur (happy path)

### Google

```text
┌─────────────────────────────────────────────────────────────────┐
│  UI: LoginScreen                                                │
│  "Sign in with Google" → useGoogleSignIn().mutate()             │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Google (native)                                             │
│     GoogleSignin.hasPlayServices()                              │
│     GoogleSignin.signIn()  →  Google idToken                    │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Backend                                                     │
│     POST {baseURL}/auth/google                                  │
│     Body: { "idToken": "<Google idToken>" }                     │
│     Response: AuthSessionResponse → AuthSession                 │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Commit session                                              │
│     commitSession(session)                                      │
│       → persistSession (memory + SecureStore)                   │
│       → status = authenticated, user = session.user             │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Navigasi                                                    │
│     router.replace('/(main)/home')                              │
└─────────────────────────────────────────────────────────────────┘
```

### Email login

```text
Form email/password → useEmailLogin().mutate({ email, password })
  → POST /auth/login
  → commitSession → replace home
```

### Register

```text
Form name/email/password → useRegister().mutate({ name, email, password })
  → POST /auth/register
  → commitSession → replace home
```

### Logout

```text
Home "Keluar" → signOut()
  → POST /auth/logout { refreshToken }   // best-effort
  → clearSession()                       // memory + SecureStore
  → GoogleSignin.signOut()               // best-effort
  → status = unauthenticated
  → (UI) router.replace('/(auth)/login')
```

### Cold start / boot

```text
App buka → AuthProvider status = bootstrapping
  → hydrateSessionFromStorage()
  → jika tidak ada refreshToken → clearSession → unauthenticated
  → jika ada refreshToken → POST /auth/refresh → persistSession → authenticated
  → gagal refresh → clearSession → unauthenticated

App path `/` (src/app/index.tsx)
  → bootstrapping → spinner
  → authenticated → /(main)/home
  → unauthenticated → /(auth)/login
```

---

## Peta file (siapa bertanggung jawab apa)

```text
src/
├── app/
│   ├── _layout.tsx              # AuthProvider + Stack screens
│   ├── index.tsx                # Auth gate `/` (tunggu bootstrapping)
│   ├── (auth)/login.tsx         # UI email + Google
│   ├── (auth)/register.tsx      # UI register
│   └── (main)/
│       ├── _layout.tsx          # Guard main routes
│       └── home.tsx             # Area authenticated + Keluar
│
├── context/
│   └── AuthContext.tsx          # status, user, commitSession, signOut, boot
│
├── lib/
│   ├── auth-session.ts          # memory + SecureStore; getters; persist/clear
│   ├── auth-token.ts            # re-export thin dari auth-session (compat)
│   ├── api-error.ts             # getApiErrorMessage dari axios/body
│   └── firebase.ts              # residual; TIDAK dipakai di login path
│
├── api/
│   └── client.ts                # axios + Bearer + 401 single-flight refresh
│
└── features/auth/
    ├── types.ts                 # PublicUser, AuthSession, bodies, envelopes
    ├── api/auth.api.ts          # register, login, google, refresh, logout, me
    └── hooks/
        ├── useGoogleSignIn.ts   # Google idToken → authApi.google
        ├── useEmailLogin.ts     # authApi.login
        └── useRegister.ts       # authApi.register
```

| Layer             | Jangan taruh di sini                                                |
| ----------------- | ------------------------------------------------------------------- |
| `auth.api.ts`     | UI, navigasi, Google SDK                                            |
| `auth-session.ts` | React hooks / navigasi                                              |
| `AuthContext`     | Panggilan Google SDK / form fields                                  |
| Hooks auth        | Layout screen / styling form                                        |
| Screens           | Logika token & HTTP (cukup panggil hook + `commitSession` via hook) |
| `api/client.ts`   | Business login; hanya attach Bearer + refresh on 401                |

---

## Kontrak API

Base URL (axios): `https://todo-service.rizky-darmarazak.workers.dev`  
(`src/api/client.ts`)

Scalar: https://todo-service.rizky-darmarazak.workers.dev/docs#tag/auth

### Endpoints yang dipakai client

| Method | Path             | Body                        | Response data      |
| ------ | ---------------- | --------------------------- | ------------------ |
| `POST` | `/auth/google`   | `{ idToken }`               | `AuthSession`      |
| `POST` | `/auth/login`    | `{ email, password }`       | `AuthSession`      |
| `POST` | `/auth/register` | `{ name, email, password }` | `AuthSession`      |
| `POST` | `/auth/refresh`  | `{ refreshToken }`          | `AuthSession`      |
| `POST` | `/auth/logout`   | `{ refreshToken }`          | void (best-effort) |
| `GET`  | `/auth/me`       | — (Bearer)                  | `PublicUser`       |

### Envelope sukses

```ts
// AuthSessionResponse
{
  success: true;
  requestId: string;
  data: {
    user: PublicUser;
    accessToken: string;
    refreshToken: string;
    expiresIn: number; // detik TTL access token (contoh 900)
  }
}
```

`authApi` **unwrap** ke `AuthSession` (`body.data`) dan throw jika `accessToken` / `refreshToken` hilang.

### `PublicUser`

```ts
{
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  firebaseUid: string | null; // boleh null untuk email-only
  createdAt: string;
  updatedAt: string;
}
```

### Error envelope

```ts
{
  success: false;
  error: { code: string; message: string };
  requestId?: string;
}
```

UI memakai `getApiErrorMessage(error)` (`lib/api-error.ts`) → `Alert.alert`.

### Yang **tidak** lagi dikirim ke backend (login path)

- Firebase ID token sebagai `POST /auth/login { token }`
- Google `idToken` lewat Firebase `signInWithCredential` dulu

Google: **langsung** `POST /auth/google { idToken }`.

---

## Session model

### `AuthSession`

```ts
type AuthSession = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};
```

### Dua lapisan (sengaja)

| Layer                 | Isi                                                   | Konsumen                                                   |
| --------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `lib/auth-session.ts` | access + refresh + cached user (memory + SecureStore) | axios interceptor, boot, `persistSession` / `clearSession` |
| `AuthContext`         | `user`, `status`, `commitSession`, `signOut`          | UI, gate, greeting                                         |

Alasan: axios **tidak** boleh bergantung React context. Token live di module non-React; context subscribe / sync ke UI.

### SecureStore keys

| Key                 | Value                    |
| ------------------- | ------------------------ |
| `auth.accessToken`  | JWT string               |
| `auth.refreshToken` | JWT string               |
| `auth.user`         | JSON string `PublicUser` |

### API session module

| Fungsi                                                       | Peran                                          |
| ------------------------------------------------------------ | ---------------------------------------------- |
| `getAccessToken()` / `getRefreshToken()` / `getCachedUser()` | Baca memory                                    |
| `persistSession(session)`                                    | Memory + SecureStore + notify listeners        |
| `clearSession()`                                             | Hapus memory + SecureStore + notify            |
| `hydrateSessionFromStorage()`                                | Baca SecureStore → memory (**tanpa** call API) |
| `subscribeSession(listener)`                                 | AuthContext sync user/status                   |

### AuthContext surface

```ts
status: 'bootstrapping' | 'authenticated' | 'unauthenticated'
user: PublicUser | null
isAuthenticated: boolean  // status === 'authenticated'
commitSession(session: AuthSession): Promise<void>
signOut(): Promise<void>
```

- **`commitSession`:** `persistSession` + set user + `authenticated` (dipakai hooks setelah login/register/google).
- **`signOut`:** logout API best-effort → `clearSession` → Google sign-out best-effort.
- **Boot:** lihat diagram cold start di atas. `GET /auth/me` **tidak** wajib di boot (refresh sudah bawa `user`).

### `authApi` methods

```ts
authApi.register(payload); // → AuthSession
authApi.login(payload); // → AuthSession
authApi.google(idToken); // → AuthSession
authApi.refresh(token); // → AuthSession
authApi.logout(token); // → void
authApi.me(); // → PublicUser
```

---

## Request API setelah login + 401 refresh

```text
Request interceptor
  → Authorization: Bearer <getAccessToken()>

Response interceptor (status 401):
  skip jika path ∈ { /auth/refresh, /auth/login, /auth/register, /auth/google, /auth/logout }
  skip jika _retry sudah true
  else:
    single-flight getOrCreateRefreshPromise()
      → authApi.refresh(getRefreshToken())
      → persistSession
      → return new accessToken
    jika sukses: set header + retry original request sekali
    jika gagal: clearSession → reject (UI jatuh ke unauthenticated / login)
```

**Single-flight:** concurrent 401 share **satu** `refreshPromise` supaya tidak spam `/auth/refresh`.

**Belum ada (v1):** proactive refresh timer sebelum `expiresIn` habis — refresh **driven by 401** saja.

---

## Routing & auth guard

| Route              | Perilaku                                                     |
| ------------------ | ------------------------------------------------------------ |
| `/`                | Spinner saat bootstrapping; lalu home atau login             |
| `/(auth)/login`    | Spinner boot; jika authenticated → home; form email + Google |
| `/(auth)/register` | Register form → `useRegister`                                |
| `/(main)/*`        | Layout guard: unauthenticated → login                        |
| `/(main)/home`     | Profile + Keluar                                             |

Navigasi sukses auth memakai **`replace`**, bukan `push`.

---

## Error handling (hooks)

| Situasi                      | Perilaku                            |
| ---------------------------- | ----------------------------------- |
| User cancel Google sheet     | Silent return (`SIGN_IN_CANCELLED`) |
| Sign-in already in progress  | Silent                              |
| Play Services tidak ada      | `Alert`                             |
| Tidak ada Google `idToken`   | throw → Alert "Login gagal"         |
| Backend 4xx / network        | `getApiErrorMessage` → Alert        |
| Email login / register gagal | Alert dengan message API            |

---

## Cara menambah login method baru

Ikuti pola yang sama; **jangan** copy orkestrasi ke screen.

```text
1. Dapatkan credential provider (native / form)
2. session = await authApi.<method>(...)   // endpoint backend yang sesuai
3. await commitSession(session)
4. router.replace('/(main)/home')
```

Contoh: `features/auth/hooks/useAppleSignIn.ts` — mirror `useEmailLogin` / `useGoogleSignIn`.

**Jangan** masukkan Firebase client di path login kecuali backend di kemudian hari mensyaratkan ulang.

---

## Checklist implementasi fitur yang butuh auth

1. User lewat login **atau** boot refresh sukses (`status === 'authenticated'`).
2. Panggil API lewat `apiClient` / `*Api` — **jangan** hardcode Authorization di call site.
3. Baca profil lewat `useAuth().user` — **jangan** parse JWT di UI.
4. Logout hanya lewat `useAuth().signOut()` (+ navigasi), supaya token, SecureStore, dan Google sinkron.

---

## Checklist “login terasa rusak” (debug cepat)

1. **Unmatched route di start** → cek `app/index.tsx`; path `/` harus resolve.
2. **Stuck spinner** → boot hang? cek network ke `/auth/refresh` + SecureStore keys.
3. **Google DEVELOPER_ERROR** → `docs/google-sign-in.md` (SHA-1, webClientId type 3).
4. **idToken null** → `GoogleSignin.configure({ webClientId })` salah client.
5. **Backend 4xx di /auth/google** → idToken Google (bukan Firebase); audience / backend verifier.
6. **Email 401** → password / user belum register.
7. **Response shape mismatch** → log axios `data`; samakan `auth.api.ts` + `types.ts` (harus ada `data.user` + tokens).
8. **Login sukses tapi request lain 401** → `commitSession` / `persistSession` terpanggil? `getAccessToken()` non-null? refresh single-flight gagal?
9. **Setelah restart logout** → cek SecureStore keys; refresh endpoint; refreshToken expired?
10. **Hook error `useAuth`** → komponen di luar `AuthProvider` (`_layout.tsx`).

---

## Roadmap auth (urutan disarankan)

| #   | Item                                                             | Status |
| --- | ---------------------------------------------------------------- | ------ |
| 1   | Google idToken → `POST /auth/google` (no Firebase client login)  | ✅     |
| 2   | Email login + register → JWT session                             | ✅     |
| 3   | AuthContext + `commitSession` / `signOut` + boot refresh         | ✅     |
| 4   | SecureStore persist + hydrate                                    | ✅     |
| 5   | 401 single-flight refresh di `apiClient`                         | ✅     |
| 6   | Root gate + protect `(main)` layout                              | ✅     |
| 7   | Error UX (Alert) di hooks                                        | ✅     |
| 8   | Proactive refresh sebelum `expiresIn`                            | ⬜     |
| 9   | Role-based UI (`user.role`)                                      | ⬜     |
| 10  | Hapus residual `firebase` package / `lib/firebase.ts` (opsional) | ⬜     |

---

## Referensi cepat path & perintah

| Butuh                       | Path / perintah                                                 |
| --------------------------- | --------------------------------------------------------------- |
| Hook Google                 | `src/features/auth/hooks/useGoogleSignIn.ts`                    |
| Hook email                  | `src/features/auth/hooks/useEmailLogin.ts`                      |
| Hook register               | `src/features/auth/hooks/useRegister.ts`                        |
| Session React               | `src/context/AuthContext.tsx` → `useAuth()`                     |
| Session storage             | `src/lib/auth-session.ts`                                       |
| HTTP auth                   | `src/features/auth/api/auth.api.ts`                             |
| Types                       | `src/features/auth/types.ts`                                    |
| Axios + 401 refresh         | `src/api/client.ts`                                             |
| API errors                  | `src/lib/api-error.ts`                                          |
| Scalar Auth API             | https://todo-service.rizky-darmarazak.workers.dev/docs#tag/auth |
| Setup native Google         | `docs/google-sign-in.md`                                        |
| Run Android (Google native) | `npx expo run:android` (bukan Expo Go)                          |

---

## Prinsip desain (ingat ini)

1. **Identity provider ≠ session app.** Google hanya memberi `idToken`; session = backend JWT (`access` + `refresh` + `user`).
2. **Satu model session** untuk Google, email login, dan register: `AuthSession` + `commitSession`.
3. **API layer tipis; hook orkestrasi; context state; screen navigasi/UX.**
4. **`replace` setelah auth** supaya back stack benar.
5. **Interceptor baca token non-React** — jangan pindahkan bearer hanya ke Context tanpa `auth-session`.
6. **401 refresh single-flight** — jangan N refresh paralel.
7. **Boot tunggu `status !== 'bootstrapping'`** supaya tidak flash login sebelum hydrate.
