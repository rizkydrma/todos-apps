# Auth API Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Expo app with the new Todo Service Auth API: Google `idToken` → `/auth/google`, email login/register, JWT access/refresh in SecureStore, 401 single-flight refresh, and proper logout.

**Architecture:** Session lives in a non-React `lib/auth-session.ts` (memory + SecureStore) so axios interceptors can read/write tokens. `AuthContext` hydrates on boot via `/auth/refresh`, exposes `commitSession` / `signOut`, and gates navigation. Thin React Query mutations call `authApi` then commit session and `router.replace` home.

**Tech Stack:** Expo 57, expo-router, axios, TanStack Query, expo-secure-store, `@react-native-google-signin/google-signin`, TypeScript. No Firebase in the login path.

**Spec:** `docs/superpowers/specs/2026-07-17-auth-api-redesign-design.md`  
**OpenAPI:** `https://todo-service.rizky-darmarazak.workers.dev/openapi.json`

**Verification note:** This repo has no Jest/Vitest. After each task run `npx tsc --noEmit` and eslint on touched files. End-to-end checks are manual on a dev build (`npx expo run:android`).

---

## File map

| File                                         | Responsibility                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/features/auth/types.ts`                 | OpenAPI types: `PublicUser`, `AuthSession`, envelopes, request bodies                      |
| `src/lib/api-error.ts`                       | `getApiErrorMessage(error)` from Axios error body                                          |
| `src/lib/auth-session.ts`                    | Memory + SecureStore tokens/user; `commitSession` / `clearSession` (storage only); getters |
| `src/lib/auth-token.ts`                      | Thin re-exports of access-token getters for any leftover imports (or delete after migrate) |
| `src/features/auth/api/auth.api.ts`          | `register`, `login`, `google`, `refresh`, `logout`, `me`                                   |
| `src/api/client.ts`                          | Bearer from session; 401 single-flight refresh                                             |
| `src/context/AuthContext.tsx`                | Boot hydrate, React state, `commitSession`, `signOut`                                      |
| `src/features/auth/hooks/useGoogleSignIn.ts` | Google idToken → `/auth/google`                                                            |
| `src/features/auth/hooks/useEmailLogin.ts`   | Email/password login                                                                       |
| `src/features/auth/hooks/useRegister.ts`     | Register                                                                                   |
| `src/app/index.tsx`                          | Boot gate + redirect                                                                       |
| `src/app/(main)/_layout.tsx`                 | Protect main routes                                                                        |
| `src/app/(auth)/login.tsx`                   | Wire email + Google                                                                        |
| `src/app/(auth)/register.tsx`                | Wire register                                                                              |
| `src/app/(main)/home.tsx`                    | Logout via `signOut`                                                                       |
| `src/app/_layout.tsx`                        | Ensure `AuthProvider` wraps tree                                                           |
| `docs/auth-flow.md`                          | Update to new mechanism                                                                    |
| `package.json`                               | Add `expo-secure-store`                                                                    |

---

### Task 1: Install expo-secure-store

**Files:**

- Modify: `package.json`, lockfile via install

- [ ] **Step 1: Install dependency with Expo**

```bash
cd /Users/rizkydarma/Documents/lessons/todos/apps
npx expo install expo-secure-store
```

Expected: `expo-secure-store` appears in `dependencies` with a version compatible with Expo 57.

- [ ] **Step 2: Commit**

```bash
git add package.json bun.lock package-lock.json yarn.lock 2>/dev/null
git add package.json bun.lock
git status
git commit -m "chore(deps): add expo-secure-store for auth session"
```

(Only stage lockfiles that exist in this repo — currently `bun.lock`.)

---

### Task 2: Auth types

**Files:**

- Create/Rewrite: `src/features/auth/types.ts`

- [ ] **Step 1: Replace types with OpenAPI-aligned definitions**

Write the full file:

```ts
/** OpenAPI-aligned auth types (Todo Service). */

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  firebaseUid: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type AuthSessionResponse = {
  success: true;
  data: AuthSession;
  requestId: string;
};

export type PublicUserResponse = {
  success: true;
  data: PublicUser;
  requestId: string;
};

export type ErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
  requestId?: string;
};

export type RegisterBody = {
  name: string;
  email: string;
  password: string;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type GoogleLoginBody = {
  idToken: string;
};

export type RefreshBody = {
  refreshToken: string;
};

export type LogoutBody = {
  refreshToken: string;
};
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: may fail on old consumers still using `LoginResponse` — fixed in later tasks. If only `types.ts` is new, note errors for Task 3–6.

- [ ] **Step 3: Commit**

```bash
git add src/features/auth/types.ts
git commit -m "feat(auth): align types with OpenAPI AuthSession"
```

---

### Task 3: API error helper

**Files:**

- Create: `src/lib/api-error.ts`

- [ ] **Step 1: Implement getApiErrorMessage**

```ts
import { isAxiosError } from 'axios';

type ErrorBody = {
  success?: boolean;
  error?: {
    code?: string;
    message?: string;
  };
};

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Terjadi kesalahan. Coba lagi.'
): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as ErrorBody | undefined;
    if (data?.error?.message) {
      return data.error.message;
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
```

- [ ] **Step 2: Lint**

```bash
npx eslint src/lib/api-error.ts
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api-error.ts
git commit -m "feat(api): add getApiErrorMessage helper"
```

---

### Task 4: auth-session module (memory + SecureStore)

**Files:**

- Create: `src/lib/auth-session.ts`
- Rewrite: `src/lib/auth-token.ts` (re-export access helpers for compatibility)

- [ ] **Step 1: Implement `src/lib/auth-session.ts`**

```ts
import type { AuthSession, PublicUser } from '@/features/auth/types';
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  accessToken: 'auth.accessToken',
  refreshToken: 'auth.refreshToken',
  user: 'auth.user',
} as const;

let accessToken: string | null = null;
let refreshToken: string | null = null;
let cachedUser: PublicUser | null = null;

type SessionListener = (user: PublicUser | null) => void;
const listeners = new Set<SessionListener>();

export function subscribeSession(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(user: PublicUser | null) {
  listeners.forEach((l) => l(user));
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function getCachedUser(): PublicUser | null {
  return cachedUser;
}

/** Persist full session (login or refresh) to memory + SecureStore. */
export async function persistSession(session: AuthSession): Promise<void> {
  accessToken = session.accessToken;
  refreshToken = session.refreshToken;
  cachedUser = session.user;

  await Promise.all([
    SecureStore.setItemAsync(KEYS.accessToken, session.accessToken),
    SecureStore.setItemAsync(KEYS.refreshToken, session.refreshToken),
    SecureStore.setItemAsync(KEYS.user, JSON.stringify(session.user)),
  ]);

  notify(session.user);
}

export async function clearSession(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  cachedUser = null;

  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.accessToken),
    SecureStore.deleteItemAsync(KEYS.refreshToken),
    SecureStore.deleteItemAsync(KEYS.user),
  ]);

  notify(null);
}

export type StoredSessionBits = {
  accessToken: string | null;
  refreshToken: string | null;
  user: PublicUser | null;
};

/** Read SecureStore into memory (does not call API). */
export async function hydrateSessionFromStorage(): Promise<StoredSessionBits> {
  const [access, refresh, userJson] = await Promise.all([
    SecureStore.getItemAsync(KEYS.accessToken),
    SecureStore.getItemAsync(KEYS.refreshToken),
    SecureStore.getItemAsync(KEYS.user),
  ]);

  accessToken = access;
  refreshToken = refresh;

  if (userJson) {
    try {
      cachedUser = JSON.parse(userJson) as PublicUser;
    } catch {
      cachedUser = null;
    }
  } else {
    cachedUser = null;
  }

  return {
    accessToken,
    refreshToken,
    user: cachedUser,
  };
}
```

- [ ] **Step 2: Rewrite `src/lib/auth-token.ts` as re-exports**

```ts
/** Compatibility re-exports — prefer importing from `@/lib/auth-session`. */
export {
  getAccessToken,
  getRefreshToken,
  clearSession,
  persistSession,
} from '@/lib/auth-session';
```

Update all old `setAccessToken` / `clearAccessToken` call sites in later tasks to use `persistSession` / `clearSession`.

- [ ] **Step 3: Lint auth-session**

```bash
npx eslint src/lib/auth-session.ts src/lib/auth-token.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth-session.ts src/lib/auth-token.ts
git commit -m "feat(auth): add SecureStore-backed auth session module"
```

---

### Task 5: authApi full surface

**Files:**

- Rewrite: `src/features/auth/api/auth.api.ts`

- [ ] **Step 1: Implement all auth endpoints**

```ts
import apiClient from '@/api/client';
import type {
  AuthSession,
  AuthSessionResponse,
  LoginBody,
  LogoutBody,
  PublicUser,
  PublicUserResponse,
  RefreshBody,
  RegisterBody,
} from '../types';

function unwrapSession(body: AuthSessionResponse): AuthSession {
  if (!body?.success || !body.data?.accessToken || !body.data?.refreshToken) {
    throw new Error('Invalid auth session response');
  }
  return body.data;
}

export const authApi = {
  register: async (payload: RegisterBody): Promise<AuthSession> => {
    const { data } = await apiClient.post<AuthSessionResponse>(
      '/auth/register',
      payload
    );
    return unwrapSession(data);
  },

  login: async (payload: LoginBody): Promise<AuthSession> => {
    const { data } = await apiClient.post<AuthSessionResponse>(
      '/auth/login',
      payload
    );
    return unwrapSession(data);
  },

  google: async (idToken: string): Promise<AuthSession> => {
    const { data } = await apiClient.post<AuthSessionResponse>('/auth/google', {
      idToken,
    });
    return unwrapSession(data);
  },

  refresh: async (refreshToken: string): Promise<AuthSession> => {
    const { data } = await apiClient.post<AuthSessionResponse>(
      '/auth/refresh',
      {
        refreshToken,
      } satisfies RefreshBody
    );
    return unwrapSession(data);
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', {
      refreshToken,
    } satisfies LogoutBody);
  },

  me: async (): Promise<PublicUser> => {
    const { data } = await apiClient.get<PublicUserResponse>('/auth/me');
    if (!data?.success || !data.data) {
      throw new Error('Invalid /auth/me response');
    }
    return data.data;
  },
};
```

- [ ] **Step 2: Lint**

```bash
npx eslint src/features/auth/api/auth.api.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/features/auth/api/auth.api.ts
git commit -m "feat(auth): implement full authApi against OpenAPI"
```

---

### Task 6: apiClient bearer + single-flight refresh

**Files:**

- Rewrite: `src/api/client.ts`

- [ ] **Step 1: Wire interceptors to auth-session**

```ts
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  persistSession,
} from '@/lib/auth-session';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: 'https://todo-service.rizky-darmarazak.workers.dev',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const AUTH_NO_REFRESH_PATHS = [
  '/auth/refresh',
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/logout',
];

function shouldSkipRefresh(url?: string): boolean {
  if (!url) return false;
  return AUTH_NO_REFRESH_PATHS.some((p) => url.includes(p));
}

apiClient.interceptors.request.use(
  (config: CustomAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const currentRefresh = getRefreshToken();
  if (!currentRefresh) {
    await clearSession();
    return null;
  }

  try {
    // Use bare axios (or apiClient carefully) to avoid interceptor recursion.
    // Prefer apiClient: /auth/refresh is in skip list.
    const { authApi } = await import('@/features/auth/api/auth.api');
    const session = await authApi.refresh(currentRefresh);
    await persistSession(session);
    return session.accessToken;
  } catch {
    await clearSession();
    return null;
  }
}

function getOrCreateRefreshPromise(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      CustomAxiosRequestConfig | undefined;

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      shouldSkipRefresh(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const newToken = await getOrCreateRefreshPromise();
    if (!newToken) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${newToken}`;
    return apiClient(originalRequest);
  }
);

export default apiClient;
```

**Note:** Dynamic `import('@/features/auth/api/auth.api')` avoids circular init if `auth.api` imports `apiClient`. Prefer that pattern.

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit
npx eslint src/api/client.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/api/client.ts
git commit -m "feat(api): bearer auth and single-flight token refresh"
```

---

### Task 7: AuthContext boot + commitSession + signOut

**Files:**

- Rewrite: `src/context/AuthContext.tsx`
- Modify: `src/app/_layout.tsx` (ensure provider order: Query → SafeArea → Theme → Auth → nav)

- [ ] **Step 1: Rewrite AuthContext**

```tsx
import { authApi } from '@/features/auth/api/auth.api';
import type { AuthSession, PublicUser } from '@/features/auth/types';
import {
  clearSession,
  getCachedUser,
  hydrateSessionFromStorage,
  persistSession,
  subscribeSession,
} from '@/lib/auth-session';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type AuthStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  user: PublicUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  commitSession: (session: AuthSession) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('bootstrapping');

  useEffect(() => {
    return subscribeSession((next) => {
      setUser(next);
      setStatus(next ? 'authenticated' : 'unauthenticated');
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = await hydrateSessionFromStorage();
        if (cancelled) return;

        if (!stored.refreshToken) {
          await clearSession();
          if (!cancelled) setStatus('unauthenticated');
          return;
        }

        const session = await authApi.refresh(stored.refreshToken);
        if (cancelled) return;
        await persistSession(session);
        if (!cancelled) {
          setUser(session.user);
          setStatus('authenticated');
        }
      } catch {
        await clearSession();
        if (!cancelled) {
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const commitSession = useCallback(async (session: AuthSession) => {
    await persistSession(session);
    setUser(session.user);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    const { getRefreshToken } = await import('@/lib/auth-session');
    const refresh = getRefreshToken();
    if (refresh) {
      try {
        await authApi.logout(refresh);
      } catch {
        // best-effort
      }
    }
    await clearSession();
    setUser(null);
    setStatus('unauthenticated');
    try {
      await GoogleSignin.signOut();
    } catch {
      // best-effort
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      commitSession,
      signOut,
    }),
    [user, status, commitSession, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}
```

Remove unused `getCachedUser` import if not used (drop it from import list in the real file).

- [ ] **Step 2: Ensure `_layout.tsx` wraps with AuthProvider**

```tsx
// RootLayout children order:
<QueryProvider>
  <SafeAreaProvider>
    <ThemeProvider>
      <AuthProvider>
        <NavigationLayout />
      </AuthProvider>
    </ThemeProvider>
  </SafeAreaProvider>
</QueryProvider>
```

- [ ] **Step 3: Typecheck + lint**

```bash
npx tsc --noEmit
npx eslint src/context/AuthContext.tsx src/app/_layout.tsx
```

- [ ] **Step 4: Commit**

```bash
git add src/context/AuthContext.tsx src/app/_layout.tsx
git commit -m "feat(auth): AuthContext boot hydrate and signOut"
```

---

### Task 8: Hooks (Google, email login, register)

**Files:**

- Rewrite: `src/features/auth/hooks/useGoogleSignIn.ts`
- Create: `src/features/auth/hooks/useEmailLogin.ts`
- Create: `src/features/auth/hooks/useRegister.ts`

- [ ] **Step 1: useGoogleSignIn (no Firebase)**

```ts
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/features/auth/api/auth.api';
import type { AuthSession } from '@/features/auth/types';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

GoogleSignin.configure({
  webClientId:
    '244150983370-bdcj1aq5b9el7s5fi6p8fc6egc17hf1l.apps.googleusercontent.com',
});

export const useGoogleSignIn = () => {
  const router = useRouter();
  const { commitSession } = useAuth();

  return useMutation({
    mutationFn: async (): Promise<AuthSession> => {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response) || !response.data.idToken) {
        throw new Error('Google Sign-In gagal: idToken tidak tersedia');
      }

      return authApi.google(response.data.idToken);
    },

    onSuccess: async (session) => {
      await commitSession(session);
      router.replace('/(main)/home');
    },

    onError: (error: Error) => {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
          case statusCodes.IN_PROGRESS:
            return;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert('Error', 'Google Play Services tidak tersedia');
            return;
          default:
            break;
        }
      }
      Alert.alert('Login gagal', getApiErrorMessage(error));
    },
  });
};
```

- [ ] **Step 2: useEmailLogin**

```ts
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/features/auth/api/auth.api';
import type { AuthSession, LoginBody } from '@/features/auth/types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export const useEmailLogin = () => {
  const router = useRouter();
  const { commitSession } = useAuth();

  return useMutation({
    mutationFn: (body: LoginBody): Promise<AuthSession> => authApi.login(body),

    onSuccess: async (session) => {
      await commitSession(session);
      router.replace('/(main)/home');
    },

    onError: (error: Error) => {
      Alert.alert('Login gagal', getApiErrorMessage(error));
    },
  });
};
```

- [ ] **Step 3: useRegister**

```ts
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/features/auth/api/auth.api';
import type { AuthSession, RegisterBody } from '@/features/auth/types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export const useRegister = () => {
  const router = useRouter();
  const { commitSession } = useAuth();

  return useMutation({
    mutationFn: (body: RegisterBody): Promise<AuthSession> =>
      authApi.register(body),

    onSuccess: async (session) => {
      await commitSession(session);
      router.replace('/(main)/home');
    },

    onError: (error: Error) => {
      Alert.alert('Registrasi gagal', getApiErrorMessage(error));
    },
  });
};
```

- [ ] **Step 4: Lint hooks**

```bash
npx eslint src/features/auth/hooks/
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/hooks/
git commit -m "feat(auth): Google, email login, and register hooks"
```

---

### Task 9: Routing guards

**Files:**

- Rewrite: `src/app/index.tsx`
- Create: `src/app/(main)/_layout.tsx`
- Modify: `src/app/_layout.tsx` Stack screens if needed for `(main)` group

- [ ] **Step 1: index boot gate**

```tsx
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { status } = useAuth();

  if (status === 'bootstrapping') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (status === 'authenticated') {
    return <Redirect href="/(main)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}
```

- [ ] **Step 2: `(main)/_layout.tsx` protect group**

```tsx
import { useAuth } from '@/context/AuthContext';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function MainLayout() {
  const { status } = useAuth();

  if (status === 'bootstrapping') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (status !== 'authenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen name="home" options={{ title: 'Beranda' }} />
    </Stack>
  );
}
```

- [ ] **Step 3: Adjust root Stack**

In `src/app/_layout.tsx`, prefer group routes over leaf paths if using nested layouts:

```tsx
<Stack.Screen name="index" options={{ headerShown: false }} />
<Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
<Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
<Stack.Screen name="(main)" options={{ headerShown: false }} />
```

Remove duplicate `header` on `(main)/home` if nested layout owns it. Keep theme `screenOptions` on root Stack.

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/app/index.tsx src/app/\(main\)/_layout.tsx src/app/_layout.tsx
git commit -m "feat(auth): boot gate and protect main routes"
```

---

### Task 10: Wire login + register screens

**Files:**

- Modify: `src/app/(auth)/login.tsx`
- Modify: `src/app/(auth)/register.tsx`

- [ ] **Step 1: Login — useEmailLogin + useGoogleSignIn + boot/auth redirects**

Key changes (full file should compile):

```tsx
// imports: useAuth, useEmailLogin, useGoogleSignIn, Redirect, ActivityIndicator
const { status } = useAuth();
const emailLogin = useEmailLogin();
const googleSignIn = useGoogleSignIn();

// after all hooks:
if (status === 'bootstrapping') {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}
if (status === 'authenticated') {
  return <Redirect href="/(main)/home" />;
}

const onSubmit = (data: LoginFormValues) => {
  emailLogin.mutate({ email: data.email, password: data.password });
};

// Sign In button:
// onPress={handleSubmit(onSubmit)}
// disabled={!isValid || emailLogin.isPending}
// Google:
// onPress={() => googleSignIn.mutate()}
// disabled={googleSignIn.isPending || emailLogin.isPending}
```

- [ ] **Step 2: Register — useRegister**

```tsx
const { status } = useAuth();
const register = useRegister();

// boot + authenticated guards same as login

const onSubmit = (data: RegisterFormValues) => {
  register.mutate({
    name: data.name,
    email: data.email,
    password: data.password,
  });
};

// Button disabled={!isValid || register.isPending}
// onPress={handleSubmit(onSubmit)}
```

- [ ] **Step 3: Lint screens + tsc**

```bash
npx eslint "src/app/(auth)/login.tsx" "src/app/(auth)/register.tsx"
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(auth)/login.tsx" "src/app/(auth)/register.tsx"
git commit -m "feat(auth): wire email login and register screens"
```

---

### Task 11: Home logout + greeting

**Files:**

- Modify: `src/app/(main)/home.tsx`

- [ ] **Step 1: Use signOut from useAuth (already may exist)**

Ensure:

```tsx
const { user, signOut } = useAuth();
const router = useRouter();

const handleSignOut = async () => {
  await signOut();
  router.replace('/(auth)/login');
};
```

Greeting: `user?.name ? \`Halo, ${user.name}\` : '...'`  
No Firebase imports.

- [ ] **Step 2: Lint + tsc**

```bash
npx eslint "src/app/(main)/home.tsx"
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(main)/home.tsx"
git commit -m "feat(auth): home logout uses API-backed signOut"
```

---

### Task 12: Docs + final cleanup

**Files:**

- Update: `docs/auth-flow.md`
- Update: `docs/google-sign-in.md` (note: Google idToken → `/auth/google`, Firebase optional/not used in app login)
- Grep for dead imports: `setAccessToken`, `LoginResponse`, `firebase` in auth path

- [ ] **Step 1: Grep dead code**

```bash
rg "setAccessToken|LoginResponse|signInWithCredential|/auth/login.*token" src/
```

Fix any remaining references.

- [ ] **Step 2: Rewrite `docs/auth-flow.md` summary sections to match new flow**

Include:

- Endpoints table from OpenAPI
- Google without Firebase client
- access/refresh SecureStore
- Boot refresh
- 401 single-flight
- File map

- [ ] **Step 3: Full typecheck + lint auth paths**

```bash
npx tsc --noEmit
npx eslint src/features/auth src/lib/auth-session.ts src/lib/api-error.ts src/context/AuthContext.tsx src/api/client.ts
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add docs/auth-flow.md docs/google-sign-in.md src/
git commit -m "docs(auth): update auth flow for JWT session API"
```

---

### Task 13: Manual verification (device)

- [ ] **Step 1: Run Android dev build**

```bash
npx expo run:android
```

- [ ] **Step 2: Checklist**

| #   | Case                                                | Expected                         |
| --- | --------------------------------------------------- | -------------------------------- |
| 1   | Register new email                                  | Home + name                      |
| 2   | Kill app, reopen                                    | Still home after boot            |
| 3   | Logout                                              | Login screen; reopen still login |
| 4   | Wrong password                                      | Alert with API message           |
| 5   | Google Sign-In                                      | Home; user email/name            |
| 6   | Call authenticated API after long wait / forced 401 | Refresh works or re-login        |
| 7   | Duplicate register                                  | 409-style message                |

- [ ] **Step 3: If issues, fix in follow-up commits (do not skip checklist)**

---

## Spec coverage checklist

| Spec requirement                                | Task  |
| ----------------------------------------------- | ----- |
| Types AuthSession / PublicUser                  | 2     |
| SecureStore persist                             | 4, 7  |
| authApi register/login/google/refresh/logout/me | 5     |
| Bearer + 401 single-flight refresh              | 6     |
| Boot refresh hydrate                            | 7, 9  |
| Google idToken only (no Firebase login)         | 8     |
| Email login + register UI                       | 8, 10 |
| Logout API + clear + Google signOut             | 7, 11 |
| Main route guard                                | 9     |
| Docs update                                     | 12    |
| Manual E2E                                      | 13    |

## Plan self-review

- No TBD steps; code blocks are concrete.
- Types consistent: `AuthSession`, `persistSession`, `commitSession`, `authApi.google(idToken)`.
- `auth-token.ts` compatibility kept minimal; primary API is `auth-session`.
- Circular dependency auth.api ↔ client handled via dynamic import in refresh.
- Project has no unit test runner — verification is tsc/eslint + manual device tests.
