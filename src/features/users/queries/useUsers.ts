/**
 * Hook list users (React Query useQuery).
 * Data di-cache dengan key userKeys.list(filters).
 * staleTime 5 menit: tidak re-fetch otomatis dalam window itu.
 */
import { useQuery } from '@tanstack/react-query';
import { userKeys } from './keys';
import { userApi } from '../api/user.api';

export const useUsers = (filters = {}) => {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => userApi.getUsers(filters),
    staleTime: 5 * 60 * 1000,
  });
};
