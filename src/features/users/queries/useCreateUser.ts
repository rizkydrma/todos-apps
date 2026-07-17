/**
 * Hook create user (React Query useMutation).
 * Setelah sukses: invalidate semua list users supaya list ter-refresh.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/user.api';
import { userKeys } from './keys';

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.createUser,
    onSuccess: () => {
      // List lama dianggap stale → re-fetch di screen yang pakai useUsers
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};
