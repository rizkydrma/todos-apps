/**
 * Hook login email/password (React Query mutation).
 *
 * Alur sukses: authApi.login → commitSession → ganti route ke home.
 * Alur unverified (403 EMAIL_NOT_VERIFIED): navigate ke verify-email dengan email form.
 * Alur gagal lain: Alert dengan pesan dari getApiErrorMessage.
 *
 * Di screen: emailLogin.mutate({ email, password })
 * Cek loading: emailLogin.isPending
 */
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/features/auth/api/auth.api';
import { authCopy } from '@/features/auth/auth-copy';
import type { AuthSession, LoginBody } from '@/features/auth/types';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export const useEmailLogin = () => {
  const router = useRouter();
  const { commitSession } = useAuth();

  return useMutation({
    mutationFn: (body: LoginBody): Promise<AuthSession> => authApi.login(body),

    onSuccess: async (session) => {
      // Simpan token + user, lalu masuk area main
      await commitSession(session);
      router.replace('/(main)/home');
    },

    onError: (error: Error, variables: LoginBody) => {
      // Password benar tapi email belum verified → arahkan ke OTP, bukan Alert generik
      if (getApiErrorCode(error) === 'EMAIL_NOT_VERIFIED') {
        router.replace({
          pathname: '/(auth)/verify-email',
          params: { email: variables.email },
        });
        return;
      }

      Alert.alert(authCopy.login.failTitle, getApiErrorMessage(error));
    },
  });
};
