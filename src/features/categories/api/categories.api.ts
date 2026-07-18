/**
 * Layer HTTP /categories.
 * GET: semua user terautentikasi. Write: admin.
 */
import apiClient from '@/api/client';
import type {
  Category,
  CategoryListResponse,
  CategoryResponse,
  CreateCategoryBody,
  UpdateCategoryBody,
} from '../types';
import type { DeletedResponse } from '@/features/todos/types';

function unwrap(body: CategoryResponse): Category {
  if (!body?.success || !body.data?.id) {
    throw new Error('Invalid category response');
  }
  return body.data;
}

export const categoriesApi = {
  list: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<CategoryListResponse>('/categories');
    if (!data?.success || !Array.isArray(data.data)) {
      throw new Error('Invalid category list response');
    }
    return data.data;
  },

  create: async (body: CreateCategoryBody): Promise<Category> => {
    const { data } = await apiClient.post<CategoryResponse>(
      '/categories',
      body
    );
    return unwrap(data);
  },

  update: async (id: string, body: UpdateCategoryBody): Promise<Category> => {
    const { data } = await apiClient.patch<CategoryResponse>(
      `/categories/${id}`,
      body
    );
    return unwrap(data);
  },

  remove: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<DeletedResponse>(
      `/categories/${id}`
    );
    if (!data?.success || !data.data?.deleted) {
      throw new Error('Invalid delete category response');
    }
  },
};
