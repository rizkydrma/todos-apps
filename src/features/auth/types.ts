/**
 * Tipe auth yang selaras dengan OpenAPI Todo Service.
 * Dipakai di authApi, AuthContext, hook login/register/Google/verify-email.
 */

/** User publik yang aman ditampilkan di UI (tanpa password). */
export type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  firebaseUid: string | null;
  /** true jika email sudah diverifikasi (OTP atau Google verified). */
  emailVerified: boolean;
  /**
   * URL publik avatar di CDN (dari R2 avatar_key).
   * null = belum set; backend tidak default dari Google.
   */
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Body PATCH /auth/me — partial: name dan/atau avatarKey.
 * avatarKey dari response upload; null = hapus avatar.
 */
export type UpdateMeBody = {
  name?: string;
  avatarKey?: string | null;
};

/** Session lengkap setelah login/verify/refresh: user + sepasang token. */
export type AuthSession = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  /** Umur access token (detik) dari server. */
  expiresIn: number;
};

/** Envelope sukses API yang membawa AuthSession. */
export type AuthSessionResponse = {
  success: true;
  data: AuthSession;
  requestId: string;
};

/**
 * Response register password: belum ada session.
 * FE harus navigasi ke verify-email, bukan commitSession.
 */
export type RegisterPendingVerification = {
  requiresEmailVerification: true;
  email: string;
};

/** Envelope sukses register (pending verification). */
export type RegisterPendingResponse = {
  success: true;
  data: RegisterPendingVerification;
  requestId: string;
};

/** Envelope sukses untuk GET /auth/me. */
export type PublicUserResponse = {
  success: true;
  data: PublicUser;
  requestId: string;
};

/** Envelope error standar backend. */
export type ErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
  requestId?: string;
};

/** Body POST /auth/register. */
export type RegisterBody = {
  name: string;
  email: string;
  password: string;
};

/** Body POST /auth/login. */
export type LoginBody = {
  email: string;
  password: string;
};

/** Body POST /auth/google (idToken = Firebase ID token, bukan raw Google OAuth). */
export type GoogleLoginBody = {
  idToken: string;
};

/** Body POST /auth/refresh. */
export type RefreshBody = {
  refreshToken: string;
};

/** Body POST /auth/logout. */
export type LogoutBody = {
  refreshToken: string;
};

/** Body POST /auth/verify-email. */
export type VerifyEmailBody = {
  email: string;
  code: string;
};

/** Body POST /auth/resend-verification. */
export type ResendVerificationBody = {
  email: string;
};

/** Kode error backend yang relevan untuk FE auth (stabil di envelope error.code). */
export type AuthErrorCode =
  | 'EMAIL_NOT_VERIFIED'
  | 'INVALID_OTP'
  | 'OTP_EXPIRED'
  | 'OTP_MAX_ATTEMPTS'
  | 'RATE_LIMITED'
  | 'EMAIL_REGISTERED_USE_PASSWORD'
  | 'IDENTITY_CONFLICT'
  | 'EMAIL_ALREADY_REGISTERED';
