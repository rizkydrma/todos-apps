/**
 * Hook verifikasi OTP email (React Query mutation).
 *
 * Alur sukses: authApi.verifyEmail → commitSession → home.
 * Alur gagal: Alert dengan copy ID (INVALID_OTP, OTP_EXPIRED, dll.) bila ada.
 *
 * Di screen: verifyEmail.mutate({ email, code })
 */
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/features/auth/api/auth.api';
import { authCopy, messageForAuthCode } from '@/features/auth/auth-copy';
import type { AuthSession, VerifyEmailBody } from '@/features/auth/types';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export const useVerifyEmail = () => {
  const router = useRouter();
  const { commitSession } = useAuth();

  return useMutation({
    mutationFn: (body: VerifyEmailBody): Promise<AuthSession> =>
      authApi.verifyEmail(body),

    onSuccess: async (session) => {
      await commitSession(session);
      router.replace('/(main)/home');
    },

    onError: (error: Error) => {
      const code = getApiErrorCode(error);
      const message = messageForAuthCode(code) ?? getApiErrorMessage(error);
      Alert.alert(authCopy.verifyAlert.failTitle, message);
    },
  });
};
