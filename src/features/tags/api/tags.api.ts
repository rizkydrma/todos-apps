/**
 * Layer HTTP /tags.
 * GET: semua user terautentikasi. Write: admin.
 */
import apiClient from '@/api/client';
import type { DeletedResponse } from '@/features/todos/types';
import type {
  CreateTagBody,
  Tag,
  TagListResponse,
  TagResponse,
  UpdateTagBody,
} from '../types';

function unwrap(body: TagResponse): Tag {
  if (!body?.success || !body.data?.id) {
    throw new Error('Invalid tag response');
  }
  return body.data;
}

export const tagsApi = {
  list: async (): Promise<Tag[]> => {
    const { data } = await apiClient.get<TagListResponse>('/tags');
    if (!data?.success || !Array.isArray(data.data)) {
      throw new Error('Invalid tag list response');
    }
    return data.data;
  },

  create: async (body: CreateTagBody): Promise<Tag> => {
    const { data } = await apiClient.post<TagResponse>('/tags', body);
    return unwrap(data);
  },

  update: async (id: string, body: UpdateTagBody): Promise<Tag> => {
    const { data } = await apiClient.patch<TagResponse>(`/tags/${id}`, body);
    return unwrap(data);
  },

  remove: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<DeletedResponse>(`/tags/${id}`);
    if (!data?.success || !data.data?.deleted) {
      throw new Error('Invalid delete tag response');
    }
  },
};
