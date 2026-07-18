/**
 * Query keys domain todos — invalidation terpusat.
 */
import type { TodoListFilters } from '../types';

export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (filters: TodoListFilters) => [...todoKeys.lists(), filters] as const,
  infinite: (filters: Omit<TodoListFilters, 'page'>) =>
    [...todoKeys.all, 'infinite', filters] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: string) => [...todoKeys.details(), id] as const,
};
