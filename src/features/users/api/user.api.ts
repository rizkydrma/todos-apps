/**
 * Layer API /users (admin).
 */
import apiClient from '@/api/client';
import type {
  DeletedResponse,
  PublicUserResponse,
  UpdateUserRoleBody,
  User,
  UserListFilters,
  UserListResponse,
  UserListResult,
} from '../types';

export const userApi = {
  list: async (params: UserListFilters = {}): Promise<UserListResult> => {
    const { data } = await apiClient.get<UserListResponse>('/users', {
      params,
    });
    if (!data?.success || !Array.isArray(data.data) || !data.meta) {
      throw new Error('Invalid user list response');
    }
    return { items: data.data, meta: data.meta };
  },

  getById: async (id: string): Promise<User> => {
    const { data } = await apiClient.get<PublicUserResponse>(`/users/${id}`);
    if (!data?.success || !data.data?.id) {
      throw new Error('Invalid user response');
    }
    return data.data;
  },

  updateRole: async (id: string, body: UpdateUserRoleBody): Promise<User> => {
    const { data } = await apiClient.patch<PublicUserResponse>(
      `/users/${id}`,
      body
    );
    if (!data?.success || !data.data?.id) {
      throw new Error('Invalid user update response');
    }
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<DeletedResponse>(`/users/${id}`);
    if (!data?.success || !data.data?.deleted) {
      throw new Error('Invalid delete user response');
    }
  },
};
