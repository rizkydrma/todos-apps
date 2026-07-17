/**
 * Tipe auth yang selaras dengan OpenAPI Todo Service.
 * Dipakai di authApi, AuthContext, hook login/register/Google.
 */

/** User publik yang aman ditampilkan di UI (tanpa password). */
export type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  firebaseUid: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Session lengkap setelah login/register/refresh: user + sepasang token. */
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
