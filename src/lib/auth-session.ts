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
  return () => {
    listeners.delete(listener);
  };
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
