/**
 * Tipe Users admin — selaras PublicUser OpenAPI + list meta.
 */
import type { PublicUser } from '@/features/auth/types';
import type { PaginationMeta } from '@/features/todos/types';

export type User = PublicUser;

export type UserListFilters = {
  page?: number;
  limit?: number;
  search?: string;
};

export type UserListResult = {
  items: User[];
  meta: PaginationMeta;
};

export type UserListResponse = {
  success: true;
  data: User[];
  meta: PaginationMeta;
  requestId: string;
};

export type PublicUserResponse = {
  success: true;
  data: User;
  requestId: string;
};

export type UpdateUserRoleBody = {
  role: 'user' | 'admin';
};

export type DeletedResponse = {
  success: true;
  data: { deleted: boolean };
  requestId: string;
};
