import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/features/auth/api/auth.api';
import type { AuthSession, LoginBody } from '@/features/auth/types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export const useEmailLogin = () => {
  const router = useRouter();
  const { commitSession } = useAuth();

  return useMutation({
    mutationFn: (body: LoginBody): Promise<AuthSession> => authApi.login(body),

    onSuccess: async (session) => {
      await commitSession(session);
      router.replace('/(main)/home');
    },

    onError: (error: Error) => {
      Alert.alert('Login gagal', getApiErrorMessage(error));
    },
  });
};
