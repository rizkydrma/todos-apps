/**
 * Layer API resource /users.
 * Dipakai hook React Query (useUsers, useCreateUser).
 */
import apiClient from '@/api/client';
import type { User, CreateUserDto, UserListResponse } from '../types';

export const userApi = {
  /** GET /users — list + filter query params. */
  getUsers: async (params = {}) => {
    const { data } = await apiClient.get<UserListResponse>('/users', {
      params,
    });
    return data;
  },

  /** GET /users/:id — detail satu user. */
  getUserById: async (id: string) => {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return data;
  },

  /** POST /users — buat user baru. */
  createUser: async (payload: CreateUserDto) => {
    const { data } = await apiClient.post<User>('/users', payload);
    return data;
  },
};
