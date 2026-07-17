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
          if (!cancelled) {
            setUser(null);
            setStatus('unauthenticated');
          }
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
