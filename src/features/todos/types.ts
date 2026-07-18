/**
 * Tipe domain Todo selaras OpenAPI Todo Service.
 * Dipakai todos.api + hooks React Query + UI list/form.
 */
import type { Category } from '@/features/categories/types';
import type { Tag } from '@/features/tags/types';

export type Priority = 'low' | 'medium' | 'high';

export type Todo = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  dueDate: string | null;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TodoWithRelations = Todo & {
  category: Category | null;
  tags: Tag[];
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/** Query GET /todos */
export type TodoListFilters = {
  status?: 'completed' | 'active';
  category?: string;
  tag?: string;
  priority?: Priority;
  search?: string;
  sort?:
    | 'createdAt'
    | '-createdAt'
    | 'dueDate'
    | '-dueDate'
    | 'priority'
    | '-priority';
  page?: number;
  limit?: number;
};

export type CreateTodoBody = {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string | null;
  categoryId?: string | null;
  tagIds?: string[];
};

export type UpdateTodoBody = {
  title?: string;
  description?: string | null;
  completed?: boolean;
  priority?: Priority;
  dueDate?: string | null;
  categoryId?: string | null;
  tagIds?: string[];
};

export type BatchTodoAction = 'complete-all' | 'delete-completed';

export type TodoListResult = {
  items: TodoWithRelations[];
  meta: PaginationMeta;
};

export type TodoListResponse = {
  success: true;
  data: TodoWithRelations[];
  meta: PaginationMeta;
  requestId: string;
};

export type TodoDetailResponse = {
  success: true;
  data: TodoWithRelations;
  requestId: string;
};

export type TodoMutationResponse = {
  success: true;
  data: Todo;
  requestId: string;
};

export type BatchResultResponse = {
  success: true;
  data: { affected: number };
  requestId: string;
};

export type DeletedResponse = {
  success: true;
  data: { deleted: boolean };
  requestId: string;
};
