/**
 * Hook kirim ulang OTP verifikasi email (React Query mutation).
 *
 * Sukses: Alert generik (server tidak bocorkan apakah email ada).
 * RATE_LIMITED: Alert khusus dari auth-copy.
 *
 * Di screen: resend.mutate({ email }); cooldown UI 60s di screen, bukan di sini.
 */
import { authApi } from '@/features/auth/api/auth.api';
import { authCopy, messageForAuthCode } from '@/features/auth/auth-copy';
import type { ResendVerificationBody } from '@/features/auth/types';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';

export const useResendVerification = () => {
  return useMutation({
    mutationFn: (body: ResendVerificationBody): Promise<void> =>
      authApi.resendVerification(body),

    onSuccess: () => {
      Alert.alert(authCopy.resend.successTitle, authCopy.resend.successBody);
    },

    onError: (error: Error) => {
      const code = getApiErrorCode(error);
      if (code === 'RATE_LIMITED') {
        Alert.alert(
          authCopy.resend.rateLimitedTitle,
          messageForAuthCode(code) ?? authCopy.resend.rateLimitedBody
        );
        return;
      }

      Alert.alert(
        authCopy.resend.failTitle,
        messageForAuthCode(code) ?? getApiErrorMessage(error)
      );
    },
  });
};
