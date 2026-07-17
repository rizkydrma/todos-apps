/**
 * Query key factory untuk feature users (TanStack Query).
 *
 * Kenapa factory? Supaya invalidation konsisten:
 * - userKeys.lists() invalidasi semua list
 * - userKeys.list(filters) cache terpisah per filter
 *
 * Pola hierarki: all → lists → list(filters) → detail(id)
 */
export const userKeys = {
  /** Root key semua query users. */
  all: ['users'] as const,
  /** Semua list (tanpa filter spesifik). */
  lists: () => [...userKeys.all, 'list'] as const,
  /** Satu list dengan filter tertentu. */
  list: (filters: any = {}) => [...userKeys.lists(), filters] as const,
  /** Detail user by id. */
  detail: (id: string) => ['users', 'detail', id] as const,
} as const;
