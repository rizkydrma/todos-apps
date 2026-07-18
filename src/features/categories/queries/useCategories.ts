/**
 * List + admin mutations categories.
 */
import { getApiErrorMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categories.api';
import type { CreateCategoryBody, UpdateCategoryBody } from '../types';
import { categoryKeys } from './keys';

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => categoriesApi.list(),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCategoryBody) => categoriesApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success({ message: 'Kategori ditambah' });
    },
    onError: (e) =>
      toast.error({ title: 'Gagal', message: getApiErrorMessage(e) }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCategoryBody }) =>
      categoriesApi.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success({ message: 'Kategori diubah' });
    },
    onError: (e) =>
      toast.error({ title: 'Gagal', message: getApiErrorMessage(e) }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success({ message: 'Kategori dihapus' });
    },
    onError: (e) =>
      toast.error({ title: 'Gagal', message: getApiErrorMessage(e) }),
  });
}
