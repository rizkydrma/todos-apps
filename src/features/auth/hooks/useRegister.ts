/**
 * Hook registrasi akun baru (React Query mutation).
 *
 * Alur sukses: authApi.register → navigate verify-email (TIDAK commitSession).
 * Backend hanya mengembalikan pending verification; session baru setelah OTP.
 *
 * Di screen: register.mutate({ name, email, password })
 */
import { authApi } from '@/features/auth/api/auth.api';
import { authCopy } from '@/features/auth/auth-copy';
import type {
  RegisterBody,
  RegisterPendingVerification,
} from '@/features/auth/types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export const useRegister = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (body: RegisterBody): Promise<RegisterPendingVerification> =>
      authApi.register(body),

    onSuccess: (pending) => {
      // Hard gate: belum ada token — user harus verifikasi email dulu
      router.replace({
        pathname: '/(auth)/verify-email',
        params: { email: pending.email },
      });
    },

    onError: (error: Error) => {
      Alert.alert(authCopy.register.failTitle, getApiErrorMessage(error));
    },
  });
};
