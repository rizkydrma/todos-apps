/**
 * Layer API auth — panggil endpoint /auth/* lewat apiClient.
 * Mengembalikan data sudah di-unwrap (bukan envelope success/data mentah).
 *
 * Hook (useEmailLogin, useRegister, useGoogleSignIn, useVerifyEmail, …)
 * dan AuthContext memakai ini.
 */
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
  RegisterPendingResponse,
  RegisterPendingVerification,
  ResendVerificationBody,
  VerifyEmailBody,
} from '../types';

/**
 * Validasi envelope session dari backend, lalu return body.data.
 * Lempar error kalau shape tidak lengkap (token/user hilang).
 */
function unwrapSession(body: AuthSessionResponse): AuthSession {
  if (!body?.success || !body.data?.accessToken || !body.data?.refreshToken) {
    throw new Error('Invalid auth session response');
  }
  return body.data;
}

/** Kumpulan method HTTP untuk autentikasi. */
export const authApi = {
  /**
   * Daftar akun password → pending verification (TIDAK ada token).
   * FE harus arahkan user ke verify-email, bukan commitSession.
   */
  register: async (
    payload: RegisterBody
  ): Promise<RegisterPendingVerification> => {
    const { data } = await apiClient.post<RegisterPendingResponse>(
      '/auth/register',
      payload
    );
    if (!data?.success || !data.data?.requiresEmailVerification) {
      throw new Error('Invalid register response');
    }
    return data.data;
  },

  /** Login email + password → session (403 EMAIL_NOT_VERIFIED jika belum verify). */
  login: async (payload: LoginBody): Promise<AuthSession> => {
    const { data } = await apiClient.post<AuthSessionResponse>(
      '/auth/login',
      payload
    );
    return unwrapSession(data);
  },

  /**
   * Login Google: kirim Firebase ID token ke backend.
   * Backend verifikasi token Firebase lalu buat/ambil user + session.
   */
  google: async (idToken: string): Promise<AuthSession> => {
    const { data } = await apiClient.post<AuthSessionResponse>('/auth/google', {
      idToken,
    });
    return unwrapSession(data);
  },

  /**
   * Verifikasi OTP email → Auth Session penuh.
   * Dipakai setelah register atau login unverified.
   */
  verifyEmail: async (payload: VerifyEmailBody): Promise<AuthSession> => {
    const { data } = await apiClient.post<AuthSessionResponse>(
      '/auth/verify-email',
      payload
    );
    return unwrapSession(data);
  },

  /**
   * Kirim ulang OTP. Response generik { ok: true } (tidak bocorkan keberadaan akun).
   * 429 RATE_LIMITED jika cooldown/server throttle.
   */
  resendVerification: async (
    payload: ResendVerificationBody
  ): Promise<void> => {
    await apiClient.post('/auth/resend-verification', payload);
  },

  /** Rotate refresh token → session baru (dipakai bootstrap AuthProvider). */
  refresh: async (token: string): Promise<AuthSession> => {
    const { data } = await apiClient.post<AuthSessionResponse>(
      '/auth/refresh',
      {
        refreshToken: token,
      } satisfies RefreshBody
    );
    return unwrapSession(data);
  },

  /** Revoke refresh token di server (logout). */
  logout: async (token: string): Promise<void> => {
    await apiClient.post('/auth/logout', {
      refreshToken: token,
    } satisfies LogoutBody);
  },

  /** Ambil profil user yang sedang login (butuh access token valid). */
  me: async (): Promise<PublicUser> => {
    const { data } = await apiClient.get<PublicUserResponse>('/auth/me');
    if (!data?.success || !data.data) {
      throw new Error('Invalid /auth/me response');
    }
    return data.data;
  },
};
