/**
 * Context global status autentikasi.
 *
 * Menyediakan:
 * - user, status (bootstrapping | authenticated | unauthenticated)
 * - commitSession: simpan session setelah login/register sukses
 * - signOut: logout API + clear storage + Google signOut + clear React Query cache
 *
 * Saat mount: baca SecureStore → refresh token → set authenticated/unauthenticated.
 * Session null (logout/refresh gagal) → queryClient.clear() agar data user lama tidak bocor.
 * Screen index/main/login membaca status lewat useAuth() untuk redirect.
 */
import { authApi } from '@/features/auth/api/auth.api';
import type { AuthSession, PublicUser } from '@/features/auth/types';
import {
  clearSession,
  getRefreshToken,
  hydrateSessionFromStorage,
  persistSession,
  subscribeSession,
} from '@/lib/auth-session';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/** Status auth app: loading awal | sudah login | belum login. */
type AuthStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated';

/**
 * Bootstrap Timeout (CONTEXT / ADR-0011): cap Auth Bootstrap.
 * Lewat ini → unauthenticated supaya Cold Start Hold bisa lepas di Login.
 */
const BOOTSTRAP_TIMEOUT_MS = 15_000;

type AuthContextValue = {
  user: PublicUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  /** Simpan session dari login/register/Google ke storage + state. */
  commitSession: (session: AuthSession) => Promise<void>;
  /** Logout: best-effort API + clear local + Google. */
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Provider auth — bungkus di root layout (setelah Query/Theme).
 * Jangan panggil useAuth di luar provider ini.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<PublicUser | null>(null);
  // Mulai bootstrapping supaya UI tampil loading, bukan flash ke login
  const [status, setStatus] = useState<AuthStatus>('bootstrapping');

  // Sinkronkan state React bila session di-clear/refresh dari tempat lain (mis. interceptor).
  // Saat user = null (logout / refresh gagal): buang seluruh React Query cache
  // supaya user berikutnya tidak melihat todos/categories user lama (keys tidak per-user).
  //
  // Catatan bootstrap: effect ini TIDAK boleh “mencuri” status dari bootstrapping
  // lewat notify(null) di tengah hydrate — itu bikin splash hide terlalu cepat
  // lalu status flip lagi (flash splash berulang). Bootstrap set status sendiri.
  useEffect(() => {
    return subscribeSession((next) => {
      setUser(next);
      setStatus((prev) => {
        // Biarkan bootstrap effect yang menutup bootstrapping (satu kali, terkontrol).
        if (prev === 'bootstrapping') {
          return prev;
        }
        return next ? 'authenticated' : 'unauthenticated';
      });
      if (!next) {
        queryClient.clear();
      }
    });
  }, [queryClient]);

  /**
   * Bootstrap: hydrate SecureStore → kalau ada refresh token, tukar ke session valid.
   * Flag `cancelled` mencegah setState setelah unmount.
   * Timeout 15s → unauthenticated (jangan stuck di splash selamanya).
   */
  useEffect(() => {
    let cancelled = false;
    let settled = false;

    const finish = (next: AuthStatus, nextUser: PublicUser | null) => {
      if (cancelled || settled) return;
      settled = true;
      setUser(nextUser);
      setStatus(next);
    };

    const timeoutId = setTimeout(() => {
      // Bootstrap Timeout: fail-open ke login, jangan hang di Cold Start Hold.
      if (cancelled || settled) return;
      void clearSession().finally(() => {
        finish('unauthenticated', null);
      });
    }, BOOTSTRAP_TIMEOUT_MS);

    (async () => {
      try {
        const stored = await hydrateSessionFromStorage();
        if (cancelled || settled) return;

        // Tidak ada refresh token → user belum pernah login (atau sudah logout).
        if (!stored.refreshToken) {
          await clearSession();
          finish('unauthenticated', null);
          return;
        }

        // Validasi/rotate token lewat backend
        const session = await authApi.refresh(stored.refreshToken);
        if (cancelled || settled) return;
        // persistSession → notify(user). Subscriber tidak menutup bootstrapping.
        await persistSession(session);
        finish('authenticated', session.user);
      } catch {
        // Token invalid/expired → bersihkan, minta login lagi
        await clearSession();
        finish('unauthenticated', null);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  /** Dipanggil hook login/register/Google setelah API sukses. */
  const commitSession = useCallback(async (session: AuthSession) => {
    await persistSession(session);
    setUser(session.user);
    setStatus('authenticated');
  }, []);

  /**
   * Logout:
   * 1. Best-effort revoke refresh di server
   * 2. Hapus local session
   * 3. Best-effort Google Sign-In signOut (supaya sheet Google tidak auto-pilih akun lama)
   */
  const signOut = useCallback(async () => {
    const refresh = getRefreshToken();
    if (refresh) {
      try {
        await authApi.logout(refresh);
      } catch {
        // best-effort — tetap clear lokal meski network gagal
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

/**
 * Hook akses auth. Harus di dalam AuthProvider.
 * Contoh: const { user, status, signOut } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}
