# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

This project uses **Expo SDK 57** + **expo-router ~57**. Prefer official Expo Router v57 patterns over older tutorials (SDK 49–52 redirects-only auth).

---

## Idiomatic code (wajib — setiap sesi)

Agent **harus** menulis kode **idiomatic** untuk stack ini. Jangan pakai pola usang hanya karena “masih jalan”.

### Prioritas sumber kebenaran

1. **Docs Expo versi pinned:** https://docs.expo.dev/versions/v57.0.0/
2. **Best practice / senior / enterprise** (lihat section di bawah — wajib dicari dulu bila task non-trivial)
3. **Pola yang sudah ada di `apps/src`** (feature folders, theme tokens, auth-session)
4. **File ini (`AGENTS.md`)** — override kebiasaan default agent

---

## Best practice, senior way & enterprise standards (wajib)

Sebelum merancang atau mengimplementasi fitur non-trivial (auth, navigasi, data fetching, storage, security, performance, arsitektur), agent **wajib** mencari dan mengikuti pendekatan yang **idiomatic, senior, dan enterprise-grade** — bukan sekadar “yang paling cepat jalan” atau pengetahuan model yang sudah usang.

### Kapan wajib riset dulu

- Fitur baru atau refactor area sensitif (auth, API client, routing guard, persistence, payments, sync)
- Ada lebih dari satu cara wajar di industri
- Menyentuh security, session, token, permissions, atau data user
- User minta “bagus”, “benar”, “senior”, “enterprise”, “best practice”, atau setara
- Stack berubah / API library major version (cek changelog + docs terbaru untuk versi di `package.json`)

Task trivial (typo, copy teks, rename kecil, styling 1 baris) boleh langsung — tetap jaga konsistensi repo.

### Apa yang harus dicari

Cari dan bandingkan secara aktif (web search / docs resmi), prioritaskan:

1. **Official docs** versi yang dipakai project (Expo 57, React Native, TanStack Query, Axios, Firebase, dll.)
2. **Recommended / “default” path** dari maintainer framework (bukan tutorial blog 2022)
3. **Pola production umum:** error handling, loading/bootstrap states, fail-closed security, single-flight refresh, cancel/unmount safety, accessibility
4. **Enterprise concerns** bila relevan: secure storage, least privilege, tidak log secret, timeout, observability, testability, separation of layers
5. **Trade-off jujur:** kapan optimistic UI, kapan managed auth (Auth0/Clerk), kapan custom JWT — pilih yang cocok skala project, dokumentasikan singkat di komentar/PR bila non-obvious

### Cara kerja agent

Alur default untuk task non-trivial:

1. **Riset singkat** — docs resmi (versi di `package.json`) + best practice / senior patterns
2. **Pilih pendekatan senior** — secure-by-default, typed, maintainable; proporsional ke skala app
3. **Cocokkan dengan pola repo** — mirror `apps/src` + aturan di file ini
4. **Implement** — idiomatic, bukan prototype throwaway
5. **Jelaskan kenapa** — komentar / ringkasan ke user bila keputusan arsitektural

Aturan tambahan:

- Jika docs resmi Expo/RN bertentangan dengan tutorial random, **menangkan docs resmi + versi pinned**.
- Jika “enterprise ideal” terlalu berat untuk lesson app, pilih **subset enterprise yang proporsional**, tapi **jangan** pilih anti-pattern (token di AsyncStorage plain, guard boolean tanpa loading, dll.).
- Jangan mengarang “standar enterprise”. Kalau tidak yakin, **cari dulu**; sebut sumber utama (docs) di ringkasan ke user bila keputusan besar.
- Prefer solusi yang: maintainable, typed, testable, secure-by-default, dan selaras idiomatic stack — bukan clever one-off.

### Contoh arah “senior / enterprise” di stack ini

| Area         | Arah yang diutamakan                                               |
| ------------ | ------------------------------------------------------------------ |
| Auth routing | Protected routes + bootstrap/loading; jangan flash unauthenticated |
| Tokens       | SecureStore + memory; rotate refresh; single-flight; fail-closed   |
| API          | Thin `*.api.ts`, typed envelope unwrap, central error mapping      |
| Server state | TanStack Query; session auth tetap dedicated store/context         |
| UI           | Design tokens, themed components, a11y labels                      |
| Structure    | Feature folders; screens tipis; business logic di luar UI          |

### Auth & routing (Expo Router 57)

- Auth state machine: `bootstrapping | authenticated | unauthenticated` (bukan hanya `boolean isLoggedIn`).
- Session: memory + `expo-secure-store` via `@/lib/auth-session`; API lewat `apiClient` interceptors (Bearer + single-flight refresh).
- **Route protection:** prefer **`Stack.Protected` / protected routes** di root navigator (docs: Authentication + Protected routes). Masih handle `bootstrapping` dulu (spinner/splash) **sebelum** render guarded tree — cegah flash ke login.
- Hindari menyebarkan `<Redirect />` guard di banyak screen jika bisa diganti satu deklarasi Protected di layout.
- Jangan anggap client guard = security; backend tetap authorize.

### Struktur & layering

- **UI screens** di `src/app/` — tipis: form + compose hooks/components.
- **Feature logic** di `src/features/<domain>/` — `api/`, `hooks/`, `types.ts`.
- **Shared UI** di `src/components/ui/` — pakai theme tokens, bukan magic number/hex.
- **Theme** lewat `useAppTheme` / `useThemedStyles` / `AppText` — jangan hardcode warna.
- Server state: TanStack Query (`useQuery` / `useMutation`); auth session tetap di `AuthContext`, jangan diganti Query sebagai sumber kebenaran session.

### TypeScript & React Native

- Type tegas untuk API body/response; unwrap envelope API di layer `*.api.ts`.
- Error user-facing lewat `getApiErrorMessage`.
- Hindari `any` kecuali boundary yang memang dinamis (document kenapa).
- Accessibility: `accessibilityRole` / label pada kontrol interaktif.

### Jangan (anti-idiomatic di project ini)

- AsyncStorage untuk tokens (pakai SecureStore).
- Auth flow Google: kirim raw Google OAuth idToken ke backend — harus **Firebase ID token** (lihat `useGoogleSignIn`).
- Copy pola Next.js middleware / web cookie httpOnly seolah-olah sama di RN.
- Tutorial Expo Router lama yang hanya `useEffect` + `router.replace` tanpa protected routes / status bootstrap, kecuali migrasi bertahap dan didokumentasikan.

### Saat ragu

Buka docs v57 dulu, lalu mirror file sejenis di repo. Lebih baik 1 PR kecil idiomatic daripada “jalan dulu” dengan pola deprecated.

---

## Komentar kode (wajib)

Selalu beri **komentar penjelasan** di `apps/src` agar mudah diingat dan dipahami lagi di masa depan:

1. **File** — singkat di atas: peran file ini dalam app (1–3 baris).
2. **Fungsi / hook / komponen export** — apa yang dilakukan, kapan dipanggil, input/output penting.
3. **Logika non-obvious** — kenapa (bukan hanya apa): interceptor, bootstrap auth, single-flight refresh, animasi, dsb.
4. **Bahasa** — boleh campuran Indonesia + istilah teknis (API, token, hook). Jelas dan ringkas; hindari komentar yang hanya mengulang nama variabel.

Contoh:

```ts
/**
 * Simpan session login ke memori + SecureStore.
 * Dipanggil setelah login/register/refresh sukses.
 */
export async function persistSession(session: AuthSession): Promise<void> {
  // ...
}
```

Saat menambah fitur baru di `apps`, ikuti pola komentar di file sejenis.
