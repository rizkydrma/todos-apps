/**
 * HTTP client (Axios) untuk semua request ke Todo Service.
 *
 * Tanggung jawab utama:
 * 1. Base URL + timeout + header JSON
 * 2. Request interceptor: sisipkan Bearer access token
 * 3. Response interceptor: kalau 401, coba refresh token sekali lalu ulang request
 *
 * Dipakai lewat feature API (authApi, userApi, dll), bukan dipanggil UI langsung.
 */
import type { AuthSessionResponse } from '@/features/auth/types';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  persistSession,
} from '@/lib/auth-session';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

/** Flag internal: request ini sudah pernah di-retry setelah refresh (hindari loop). */
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/** Instance Axios tunggal — semua endpoint backend lewat sini. */
export const apiClient = axios.create({
  baseURL: 'https://todo-service.rizky-darmarazak.workers.dev',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Path auth yang JANGAN memicu refresh otomatis.
 * Kalau login/register/refresh sendiri dapat 401, refresh ulang hanya bikin loop.
 */
const AUTH_NO_REFRESH_PATHS = [
  '/auth/refresh',
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/logout',
] as const;

/** True jika URL request termasuk path auth di atas. */
function shouldSkipRefresh(url?: string): boolean {
  if (!url) return false;
  return AUTH_NO_REFRESH_PATHS.some((path) => url.includes(path));
}

/**
 * REQUEST INTERCEPTOR
 * Sebelum request dikirim: ambil access token dari memori, pasang di header Authorization.
 * Tanpa token → request tetap jalan (endpoint publik seperti login).
 */
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

/**
 * Single-flight refresh: banyak request 401 bersamaan hanya memicu SATU call /auth/refresh.
 * Request lain menunggu promise yang sama, lalu pakai token baru.
 */
let refreshPromise: Promise<string | null> | null = null;

/**
 * Tukar refresh token → access token baru lewat POST /auth/refresh.
 *
 * Penting: pakai apiClient langsung (bukan authApi) supaya tidak circular import:
 * auth.api → apiClient → auth.api.
 * Path /auth/refresh ada di AUTH_NO_REFRESH_PATHS jadi 401 di sini tidak recurse.
 *
 * @returns access token baru, atau null kalau gagal (session dibersihkan).
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

    // Simpan token + user baru ke SecureStore + memori
    await persistSession(data.data);
    return data.data.accessToken;
  } catch {
    // Refresh gagal → anggap session habis, user harus login lagi
    await clearSession();
    return null;
  }
}

/**
 * Ambil promise refresh yang sedang jalan, atau buat yang baru.
 * Setelah selesai (sukses/gagal), reset agar refresh berikutnya bisa jalan lagi.
 */
function getOrCreateRefreshPromise(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * RESPONSE INTERCEPTOR
 * Kalau response 401 (unauthorized):
 * - Skip jika request auth, atau sudah pernah retry
 * - Coba refresh token
 * - Ulangi request asli dengan Bearer token baru
 * - Kalau refresh gagal → tolak error (UI/AuthContext bisa arahkan ke login)
 */
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

    // Tandai agar tidak retry berkali-kali
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
