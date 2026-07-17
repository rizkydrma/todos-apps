export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: any = {}) => [...userKeys.lists(), filters] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
} as const;
