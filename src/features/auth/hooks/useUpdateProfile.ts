/**
 * Mutation update profil (PATCH /auth/me) + sinkron session user.
 * Upload R2 avatar dilakukan di call site sebelum mutate (butuh key).
 */
import { authApi } from '@/features/auth/api/auth.api';
import type { PublicUser, UpdateMeBody } from '@/features/auth/types';
import { getApiErrorMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { useMutation } from '@tanstack/react-query';

type UpdateProfileVars = {
  body: UpdateMeBody;
  /** Dipanggil setelah API sukses, sebelum toast — commit user ke AuthContext. */
  onUserUpdated: (user: PublicUser) => Promise<void>;
};

/**
 * Simpan perubahan name/avatarKey ke server, update cache session lewat callback.
 */
export function useUpdateProfile() {
  return useMutation({
    mutationFn: async ({ body, onUserUpdated }: UpdateProfileVars) => {
      const user = await authApi.updateMe(body);
      await onUserUpdated(user);
      return user;
    },
    onSuccess: () => {
      toast.success({ message: 'Profil diperbarui' });
    },
    onError: (e) => {
      toast.error({ title: 'Gagal', message: getApiErrorMessage(e) });
    },
  });
}
