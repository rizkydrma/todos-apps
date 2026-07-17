# Google Sign-In (Android) — Panduan Project Ini

Dokumentasi setup **native Google Sign-In** + **Firebase Auth** untuk app Expo ini.  
Ditulis agar bisa diikuti lagi kalau lupa kenapa error / apa yang harus di-config.

Terakhir diverifikasi berhasil: **Juli 2026**.

---

## Ringkasan stack

| Item                             | Nilai                                                                      |
| -------------------------------- | -------------------------------------------------------------------------- |
| Approach                         | Native only: `@react-native-google-signin/google-signin` + `firebase`      |
| Dependencies auth                | Hanya 2 package itu — **bukan** expo-auth-session / expo-web-browser       |
| Expo Go                          | **Tidak support** — wajib development build                                |
| Firebase project                 | `todos-c1b87`                                                              |
| Android package                  | `todo.android`                                                             |
| Web client ID (`client_type: 3`) | `244150983370-bdcj1aq5b9el7s5fi6p8fc6egc17hf1l.apps.googleusercontent.com` |
| Hook                             | `src/features/auth/hooks/useGoogleSignIn.ts`                               |
| Config file                      | `google-services.json` (root) + `app.json`                                 |
| Native folders                   | `android/` di-generate prebuild, **di-gitignore**                          |

---

## Alur auth (cara kerja)

```text
User tap "Sign in with Google"
        ↓
GoogleSignin.hasPlayServices()
        ↓
GoogleSignin.signIn()  →  idToken (native sheet)
        ↓
GoogleAuthProvider.credential(idToken)
        ↓
signInWithCredential(auth, credential)  →  Firebase user
```

`GoogleSignin.configure({ webClientId })` harus memakai **OAuth Web client** (`client_type: 3`), **bukan** Android client (`client_type: 1`).

---

## Prasyarat mesin

- Node + dependencies terpasang (`bun` / npm)
- Android SDK + emulator **Google Play** atau device fisik
- Firebase project dengan:
  - App Android package `todo.android`
  - **Authentication → Sign-in method → Google → Enabled**
  - SHA-1 fingerprint(s) terdaftar

---

## File penting

### `app.json`

Harus ada:

```json
{
  "expo": {
    "android": {
      "package": "todo.android",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": ["@react-native-google-signin/google-signin"]
  }
}
```

- `package` **wajib** sama dengan Firebase + `google-services.json`
- Plugin google-signin **wajib** sebelum prebuild

### `google-services.json` (root)

Setelah SHA-1 benar, harus ada **dua** jenis OAuth client minimal:

| `client_type` | Arti    | Dipakai untuk                                          |
| ------------- | ------- | ------------------------------------------------------ |
| `1`           | Android | Validasi package + certificate (SHA-1) di Google       |
| `3`           | Web     | `webClientId` di `GoogleSignin.configure()` + Firebase |

Contoh struktur (hash bisa beda per keystore):

```json
"oauth_client": [
  {
    "client_id": "...",
    "client_type": 1,
    "android_info": {
      "package_name": "todo.android",
      "certificate_hash": "5e8f16062ea3cd2c4a0d547876baa6f38cabf625"
    }
  },
  {
    "client_id": "244150983370-bdcj1aq5b9el7s5fi6p8fc6egc17hf1l.apps.googleusercontent.com",
    "client_type": 3
  }
]
```

`certificate_hash` = SHA-1 **tanpa colon**, lowercase.

### Hook

`src/features/auth/hooks/useGoogleSignIn.ts` — `useMutation` yang:

1. `hasPlayServices`
2. `signIn`
3. Ambil `idToken`
4. `signInWithCredential` ke Firebase

---

## Setup dari nol (checklist)

### 1. Install dependency

```bash
npx expo install @react-native-google-signin/google-signin
```

### 2. Config `app.json`

Lihat bagian file penting di atas (`package`, `googleServicesFile`, plugin).

### 3. Ambil SHA-1 **yang dipakai app** (penting!)

App hasil Expo prebuild **tidak selalu** pakai `~/.android/debug.keystore`.

**Cara paling aman** (setelah prebuild):

```bash
cd android
./gradlew signingReport
```

Cari:

```text
Variant: debug
Config: debug
Store: .../android/app/debug.keystore
SHA1: XX:XX:XX:...
```

Atau langsung:

```bash
keytool -list -v \
  -keystore android/app/debug.keystore \
  -alias androiddebugkey \
  -storepass android \
  -keypass android
```

Password default debug: `android`.

#### SHA-1 yang pernah valid di mesin dev ini (debug Expo)

```text
5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```

> **Peringatan:** SHA-1 bisa beda di laptop lain / keystore lain. Selalu cek `signingReport` di mesin yang membangun APK.

#### Jangan tertukar dengan keystore global

```bash
# Ini BUKAN keystore default Expo prebuild di project ini
keytool -list -v \
  -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android \
  -keypass android
```

Keystore itu menghasilkan SHA beda (`2E:A2:68:...`) dan dulu menyebabkan `DEVELOPER_ERROR`.

### 4. Daftarkan di Firebase

1. [Firebase Console](https://console.firebase.google.com/) → project `todos-c1b87`
2. ⚙️ **Project settings** → app Android **`todo.android`**
3. **Add fingerprint** → paste SHA-1 dari `signingReport`
4. **Authentication → Sign-in method → Google** → Enable
5. **Download** `google-services.json` lagi
6. Ganti file di **root** project (`./google-services.json`)
7. Pastikan ada `client_type: 1` dengan `certificate_hash` yang cocok

### 5. Generate native project & run

```bash
# dari root project
npx expo prebuild --platform android
# atau setelah ganti google-services / plugin:
npx expo prebuild --platform android --clean

npx expo run:android
```

**Jangan** uji Google Sign-In native di Expo Go.

### 6. Tes

1. Buka login → **Sign in with Google**
2. Pilih akun
3. Cek log `✅ Login Google berhasil`
4. Cek Firebase → **Authentication → Users**

---

## Workflow harian (setelah setup sukses)

| Kebutuhan                                         | Perintah                                                    |
| ------------------------------------------------- | ----------------------------------------------------------- |
| Hanya ubah JS/TS                                  | `npx expo start` (dengan dev client yang sudah ter-install) |
| Ubah native dep / plugin / `google-services.json` | `prebuild --clean` lalu `npx expo run:android`              |
| Folder `android/` hilang (gitignore)              | `npx expo prebuild --platform android` lagi                 |

Folder `android/` dan `ios/` **di-gitignore** — anggap _generated_, bukan source of truth.  
Source of truth: `app.json`, `google-services.json`, kode di `src/`.

---

## Troubleshooting

### `DEVELOPER_ERROR` / code 10

**Hampir selalu** mismatch config Google/Firebase ↔ app.

Checklist:

1. Package app = `todo.android` (Firebase, `app.json`, `google-services.json`, `applicationId`)
2. SHA-1 di Firebase = SHA-1 dari **`android/app/debug.keystore`** (via `signingReport`), **bukan** asal `~/.android/debug.keystore`
3. Google Sign-In method **enabled** di Firebase Auth
4. `google-services.json` terbaru sudah di-download & di-prebuild ulang
5. Ada `oauth_client` `client_type: 1` dengan hash yang cocok
6. `webClientId` di hook = **type 3 (Web)**, bukan Android client

Setelah ganti fingerprint / JSON:

```bash
npx expo prebuild --platform android --clean
npx expo run:android
```

### `idToken` null / gagal

- Pastikan `GoogleSignin.configure({ webClientId })` pakai Web client ID
- Google provider enabled di Firebase

### Play Services not available

- Emulator harus image **dengan Google Play**
- Atau pakai device fisik

### Module not found / null di runtime

- Masih Expo Go → install **dev build** (`expo run:android`)

### Official docs

- Troubleshooting library: https://react-native-google-signin.github.io/docs/troubleshooting
- Expo setup: https://react-native-google-signin.github.io/docs/setting-up/expo
- Config doctor: `npx @react-native-google-signin/config-doctor`

---

## Production / Play Store (nanti)

Debug SHA-1 **tidak cukup** untuk app di Play Store.

1. Ambil SHA-1 **upload key** (keystore release / EAS credentials)
2. Di Play Console: **Release → Setup → App integrity**
   - **App signing key certificate** SHA-1
   - **Upload key certificate** SHA-1
3. Tambahkan **semua** SHA-1 itu di Firebase (boleh multiple fingerprints)
4. Download `google-services.json` lagi → rebuild release

---

## iOS (belum di-setup di project ini)

Kalau nanti butuh iOS:

1. Tambah app iOS di Firebase + bundle ID
2. Download `GoogleService-Info.plist`
3. Set di `app.json`: `ios.bundleIdentifier`, `ios.googleServicesFile`
4. Plugin google-signin (dengan Firebase path) / URL scheme sesuai docs
5. `npx expo prebuild --platform ios` + `npx expo run:ios`

---

## Tradeoff singkat: kenapa prebuild?

| Tanpa prebuild (Expo Go)         | Dengan prebuild / dev build                                   |
| -------------------------------- | ------------------------------------------------------------- |
| Cepat, simple                    | Native modules OK (Google Sign-In)                            |
| Tidak bisa native Google Sign-In | Perlu Android SDK, rebuild native                             |
| —                                | `android/` generated; jaga `app.json` sebagai source of truth |

Detail tradeoff: lihat percakapan setup / docs Expo Continuous Native Generation (CNG).

---

## Referensi cepat perintah

```bash
# SHA-1 debug app (setelah prebuild)
cd android && ./gradlew signingReport

# Rebuild native Android
npx expo prebuild --platform android --clean
npx expo run:android

# Install / update library
npx expo install @react-native-google-signin/google-signin
```

---

## Riwayat error yang pernah terjadi (supaya tidak diulang)

| Gejala                                                | Penyebab                                        | Perbaikan                                                   |
| ----------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------- |
| PluginError resolve `@react-native-google-signin/...` | Plugin di `app.json` tanpa package terpasang    | Install package **atau** hapus plugin                       |
| `AuthSession.startAsync` tidak ada                    | API lama expo-auth-session                      | Diganti native Google Sign-In                               |
| Tidak ada folder `android/`                           | Expo managed, belum prebuild                    | `npx expo prebuild --platform android`                      |
| `DEVELOPER_ERROR`                                     | SHA-1 dari `~/.android/debug.keystore`          | Pakai SHA-1 `android/app/debug.keystore` + re-download JSON |
| `client_type: 1` “tidak kelihatan”                    | SHA belum ditambah / JSON lama; atau hash salah | Add fingerprint benar, download ulang                       |
