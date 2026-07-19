/**
 * Layer HTTP /todos — unwrap envelope OpenAPI.
 * Dipakai hooks React Query, bukan screen langsung.
 */
import apiClient from '@/api/client';
import type {
  CreateTodoBody,
  DeletedResponse,
  Todo,
  TodoDetailResponse,
  TodoListFilters,
  TodoListResponse,
  TodoListResult,
  TodoMutationResponse,
  TodoWithRelations,
  UpdateTodoBody,
} from '../types';

function unwrapList(body: TodoListResponse): TodoListResult {
  if (!body?.success || !Array.isArray(body.data) || !body.meta) {
    throw new Error('Invalid todo list response');
  }
  return { items: body.data, meta: body.meta };
}

function unwrapTodo(
  body: TodoMutationResponse | TodoDetailResponse
): Todo | TodoWithRelations {
  if (!body?.success || !body.data?.id) {
    throw new Error('Invalid todo response');
  }
  return body.data;
}

export const todosApi = {
  /** GET /todos — paginated + filters */
  list: async (filters: TodoListFilters = {}): Promise<TodoListResult> => {
    const { data } = await apiClient.get<TodoListResponse>('/todos', {
      params: filters,
    });
    return unwrapList(data);
  },

  /** GET /todos/:id */
  getById: async (id: string): Promise<TodoWithRelations> => {
    const { data } = await apiClient.get<TodoDetailResponse>(`/todos/${id}`);
    return unwrapTodo(data) as TodoWithRelations;
  },

  /** POST /todos */
  create: async (body: CreateTodoBody): Promise<Todo> => {
    const { data } = await apiClient.post<TodoMutationResponse>('/todos', body);
    return unwrapTodo(data) as Todo;
  },

  /** PATCH /todos/:id */
  update: async (id: string, body: UpdateTodoBody): Promise<Todo> => {
    const { data } = await apiClient.patch<TodoMutationResponse>(
      `/todos/${id}`,
      body
    );
    return unwrapTodo(data) as Todo;
  },

  /** DELETE /todos/:id */
  remove: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<DeletedResponse>(`/todos/${id}`);
    if (!data?.success || !data.data?.deleted) {
      throw new Error('Invalid delete todo response');
    }
  },
};
