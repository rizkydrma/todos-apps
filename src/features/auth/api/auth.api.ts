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
} from '../types';

function unwrapSession(body: AuthSessionResponse): AuthSession {
  if (!body?.success || !body.data?.accessToken || !body.data?.refreshToken) {
    throw new Error('Invalid auth session response');
  }
  return body.data;
}

export const authApi = {
  register: async (payload: RegisterBody): Promise<AuthSession> => {
    const { data } = await apiClient.post<AuthSessionResponse>(
      '/auth/register',
      payload
    );
    return unwrapSession(data);
  },

  login: async (payload: LoginBody): Promise<AuthSession> => {
    const { data } = await apiClient.post<AuthSessionResponse>(
      '/auth/login',
      payload
    );
    return unwrapSession(data);
  },

  google: async (idToken: string): Promise<AuthSession> => {
    const { data } = await apiClient.post<AuthSessionResponse>('/auth/google', {
      idToken,
    });
    return unwrapSession(data);
  },

  refresh: async (token: string): Promise<AuthSession> => {
    const { data } = await apiClient.post<AuthSessionResponse>(
      '/auth/refresh',
      {
        refreshToken: token,
      } satisfies RefreshBody
    );
    return unwrapSession(data);
  },

  logout: async (token: string): Promise<void> => {
    await apiClient.post('/auth/logout', {
      refreshToken: token,
    } satisfies LogoutBody);
  },

  me: async (): Promise<PublicUser> => {
    const { data } = await apiClient.get<PublicUserResponse>('/auth/me');
    if (!data?.success || !data.data) {
      throw new Error('Invalid /auth/me response');
    }
    return data.data;
  },
};
