import apiClient from '@/api/client';
import type { User, CreateUserDto, UserListResponse } from '../types';

export const userApi = {
  getUsers: async (params = {}) => {
    const { data } = await apiClient.get<UserListResponse>('/users', {
      params,
    });
    return data;
  },

  getUserById: async (id: string) => {
    const { data } = await apiClient.get<User>('/users/${id');
    return data;
  },

  createUser: async (payload: CreateUserDto) => {
    const { data } = await apiClient.post<User>('/users', payload);
    return data;
  },
};
