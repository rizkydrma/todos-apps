/**
 * Mutations todos: create, update, toggle, delete.
 * Toggle + delete: optimistic update infinite cache.
 */
import { getApiErrorMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { todosApi } from '../api/todos.api';
import type { CreateTodoBody, TodoListResult, UpdateTodoBody } from '../types';
import { todoKeys } from './keys';

type InfiniteTodos = InfiniteData<TodoListResult, number>;

export function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTodoBody) => todosApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: todoKeys.all });
      toast.success({ message: 'Todo ditambahkan' });
    },
    onError: (e) => {
      toast.error({
        title: 'Gagal menambah',
        message: getApiErrorMessage(e),
      });
    },
  });
}

export function useUpdateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTodoBody }) =>
      todosApi.update(id, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: todoKeys.all });
      void qc.invalidateQueries({ queryKey: todoKeys.detail(id) });
    },
    onError: (e) => {
      toast.error({
        title: 'Gagal menyimpan',
        message: getApiErrorMessage(e),
      });
    },
  });
}

export function useToggleTodoComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      todosApi.update(id, { completed }),
    onMutate: async ({ id, completed }) => {
      await qc.cancelQueries({ queryKey: todoKeys.all });
      const previous = qc.getQueriesData<InfiniteTodos>({
        queryKey: todoKeys.all,
      });

      // Patch semua infinite/list cache yang match todos
      previous.forEach(([key]) => {
        qc.setQueryData<InfiniteTodos>(key, (old) =>
          patchInfiniteTodo(old, id, (t) => ({ ...t, completed }))
        );
      });

      return { previous };
    },
    onError: (e, _v, ctx) => {
      ctx?.previous?.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
      toast.error({
        title: 'Gagal update',
        message: getApiErrorMessage(e),
      });
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: todoKeys.all });
    },
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => todosApi.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: todoKeys.all });
      const previous = qc.getQueriesData<InfiniteTodos>({
        queryKey: todoKeys.all,
      });
      previous.forEach(([key]) => {
        qc.setQueryData<InfiniteTodos>(key, (old) =>
          removeInfiniteTodo(old, id)
        );
      });
      return { previous };
    },
    onError: (e, _id, ctx) => {
      ctx?.previous?.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
      toast.error({
        title: 'Gagal menghapus',
        message: getApiErrorMessage(e),
      });
    },
    onSuccess: () => {
      toast.success({ message: 'Todo dihapus' });
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: todoKeys.all });
    },
  });
}

function patchInfiniteTodo(
  old: InfiniteTodos | undefined,
  id: string,
  map: (t: TodoListResult['items'][number]) => TodoListResult['items'][number]
): InfiniteTodos | undefined {
  if (!old) return old;
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      items: page.items.map((t) => (t.id === id ? map(t) : t)),
    })),
  };
}

function removeInfiniteTodo(
  old: InfiniteTodos | undefined,
  id: string
): InfiniteTodos | undefined {
  if (!old) return old;
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      items: page.items.filter((t) => t.id !== id),
      meta: {
        ...page.meta,
        total: Math.max(0, page.meta.total - 1),
      },
    })),
  };
}
