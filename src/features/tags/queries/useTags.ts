/**
 * List + admin mutations tags.
 */
import { getApiErrorMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from '../api/tags.api';
import type { CreateTagBody, UpdateTagBody } from '../types';
import { tagKeys } from './keys';

export function useTags() {
  return useQuery({
    queryKey: tagKeys.list(),
    queryFn: () => tagsApi.list(),
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTagBody) => tagsApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: tagKeys.all });
      toast.success({ message: 'Tag ditambah' });
    },
    onError: (e) =>
      toast.error({ title: 'Gagal', message: getApiErrorMessage(e) }),
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTagBody }) =>
      tagsApi.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: tagKeys.all });
      toast.success({ message: 'Tag diubah' });
    },
    onError: (e) =>
      toast.error({ title: 'Gagal', message: getApiErrorMessage(e) }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tagsApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: tagKeys.all });
      toast.success({ message: 'Tag dihapus' });
    },
    onError: (e) =>
      toast.error({ title: 'Gagal', message: getApiErrorMessage(e) }),
  });
}
