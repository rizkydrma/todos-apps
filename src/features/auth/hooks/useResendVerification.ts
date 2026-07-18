/**
 * Hook kirim ulang OTP verifikasi email (React Query mutation).
 *
 * Sukses: toast generik (server tidak bocorkan apakah email ada).
 * RATE_LIMITED: toast khusus dari auth-copy.
 *
 * Di screen: resend.mutate({ email }); cooldown UI 60s di screen, bukan di sini.
 */
import { authApi } from '@/features/auth/api/auth.api';
import { authCopy, messageForAuthCode } from '@/features/auth/auth-copy';
import type { ResendVerificationBody } from '@/features/auth/types';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { useMutation } from '@tanstack/react-query';

export const useResendVerification = () => {
  return useMutation({
    mutationFn: (body: ResendVerificationBody): Promise<void> =>
      authApi.resendVerification(body),

    onSuccess: () => {
      toast.success({
        title: authCopy.resend.successTitle,
        message: authCopy.resend.successBody,
      });
    },

    onError: (error: Error) => {
      const code = getApiErrorCode(error);
      if (code === 'RATE_LIMITED') {
        toast.error({
          title: authCopy.resend.rateLimitedTitle,
          message: messageForAuthCode(code) ?? authCopy.resend.rateLimitedBody,
        });
        return;
      }

      toast.error({
        title: authCopy.resend.failTitle,
        message: messageForAuthCode(code) ?? getApiErrorMessage(error),
      });
    },
  });
};
