/**
 * Infinite list todos (GET /todos page/limit).
 * Filters tanpa page — page di-handle infinite query.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { todosApi } from '../api/todos.api';
import type { TodoListFilters } from '../types';
import { todoKeys } from './keys';

const DEFAULT_LIMIT = 20;

export type TodosInfiniteFilters = Omit<TodoListFilters, 'page' | 'limit'>;

export function useTodosInfinite(
  filters: TodosInfiniteFilters = {},
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery({
    queryKey: todoKeys.infinite(filters),
    queryFn: ({ pageParam }) =>
      todosApi.list({
        ...filters,
        page: pageParam,
        limit: DEFAULT_LIMIT,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      if (last.meta.page >= last.meta.totalPages) return undefined;
      return last.meta.page + 1;
    },
    enabled: options?.enabled ?? true,
  });
}

/** Flatten pages → items */
export function flattenTodoPages(
  data: ReturnType<typeof useTodosInfinite>['data']
) {
  return data?.pages.flatMap((p) => p.items) ?? [];
}
