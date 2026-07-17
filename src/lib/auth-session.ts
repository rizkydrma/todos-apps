/**
 * Sumber kebenaran session auth di sisi client.
 *
 * Menyimpan access token, refresh token, dan data user di:
 * - Memori (cepat dibaca interceptor axios)
 * - SecureStore (bertahan setelah app ditutup)
 *
 * AuthContext + apiClient memakai module ini; UI sebaiknya lewat useAuth().
 */
import type { AuthSession, PublicUser } from '@/features/auth/types';
import * as SecureStore from 'expo-secure-store';

/** Key string di SecureStore — jangan diganti sembarangan (data lama hilang). */
const KEYS = {
  accessToken: 'auth.accessToken',
  refreshToken: 'auth.refreshToken',
  user: 'auth.user',
} as const;

// Cache in-memory: interceptor bisa baca token sinkron tanpa await SecureStore
let accessToken: string | null = null;
let refreshToken: string | null = null;
let cachedUser: PublicUser | null = null;

/** Listener yang dipanggil setiap session berubah (login/logout/refresh). */
type SessionListener = (user: PublicUser | null) => void;
const listeners = new Set<SessionListener>();

/**
 * Daftarkan listener session. Return fungsi unsubscribe.
 * AuthProvider memakai ini supaya state React ikut berubah saat session di-clear/refresh.
 */
export function subscribeSession(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Beritahu semua listener user terbaru (atau null = logout). */
function notify(user: PublicUser | null) {
  listeners.forEach((l) => l(user));
}

/** Access token JWT di memori (untuk header Authorization). */
export function getAccessToken(): string | null {
  return accessToken;
}

/** Refresh token di memori (untuk /auth/refresh dan logout). */
export function getRefreshToken(): string | null {
  return refreshToken;
}

/** User terakhir yang di-cache (bisa null sebelum hydrate). */
export function getCachedUser(): PublicUser | null {
  return cachedUser;
}

/**
 * Simpan full session (setelah login / register / refresh) ke memori + SecureStore.
 * Lalu notify listener agar UI update.
 */
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

/**
 * Hapus session dari memori + SecureStore (logout / refresh gagal).
 * Listener mendapat user = null.
 */
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

/** Bentuk data yang dibaca dari storage (belum tentu valid di server). */
export type StoredSessionBits = {
  accessToken: string | null;
  refreshToken: string | null;
  user: PublicUser | null;
};

/**
 * Baca SecureStore ke memori saat app start.
 * TIDAK memanggil API — AuthProvider yang akan refresh token setelah ini.
 */
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
      // JSON user rusak → anggap tidak ada user
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
