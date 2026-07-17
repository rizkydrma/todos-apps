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
