import type { AuthSessionResponse } from '@/features/auth/types';
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

/** Auth routes that must not trigger another refresh on 401. */
const AUTH_NO_REFRESH_PATHS = [
  '/auth/refresh',
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/logout',
] as const;

function shouldSkipRefresh(url?: string): boolean {
  if (!url) return false;
  return AUTH_NO_REFRESH_PATHS.some((path) => url.includes(path));
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

/** Single-flight: parallel 401s share one refresh call. */
let refreshPromise: Promise<string | null> | null = null;

/**
 * Rotate tokens via POST /auth/refresh.
 * Uses apiClient directly (not authApi) to avoid a circular import:
 * auth.api → apiClient → auth.api.
 * /auth/refresh is in AUTH_NO_REFRESH_PATHS so this cannot recurse.
 */
async function refreshAccessToken(): Promise<string | null> {
  const currentRefresh = getRefreshToken();
  if (!currentRefresh) {
    await clearSession();
    return null;
  }

  try {
    const { data } = await apiClient.post<AuthSessionResponse>(
      '/auth/refresh',
      { refreshToken: currentRefresh }
    );

    if (!data?.success || !data.data?.accessToken || !data.data?.refreshToken) {
      throw new Error('Invalid refresh response');
    }

    await persistSession(data.data);
    return data.data.accessToken;
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
