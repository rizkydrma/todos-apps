/**
 * Admin users: infinite list + role/delete mutations.
 */
import { getApiErrorMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { userApi } from '../api/user.api';
import type { UpdateUserRoleBody } from '../types';
import { userKeys } from './keys';

const LIMIT = 20;

export function useUsersInfinite(search = '') {
  return useInfiniteQuery({
    queryKey: userKeys.list({ search: search || undefined, limit: LIMIT }),
    queryFn: ({ pageParam }) =>
      userApi.list({
        page: pageParam,
        limit: LIMIT,
        search: search || undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page >= last.meta.totalPages ? undefined : last.meta.page + 1,
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserRoleBody }) =>
      userApi.updateRole(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: userKeys.all });
      toast.success({ message: 'Role diperbarui' });
    },
    onError: (e) =>
      toast.error({ title: 'Gagal', message: getApiErrorMessage(e) }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: userKeys.all });
      toast.success({ message: 'User dihapus' });
    },
    onError: (e) =>
      toast.error({ title: 'Gagal', message: getApiErrorMessage(e) }),
  });
}
