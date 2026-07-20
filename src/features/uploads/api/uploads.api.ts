/**
 * Layer API upload R2 — presign + PUT binary.
 * Alur avatar: getSingleUrl → putToPresignedUrl → PATCH /auth/me { avatarKey: key }.
 *
 * PUT ke R2 memakai fetch mentah (host berbeda), bukan apiClient Todo Service.
 */
import apiClient from '@/api/client';
import type {
  GetSingleUploadUrlBody,
  SingleUploadUrlData,
  SingleUploadUrlResponse,
} from '../types';

export const uploadsApi = {
  /**
   * Minta presigned PUT URL untuk satu file ≤ 50MB.
   * Client lalu PUT binary ke data.uploadUrl, lalu simpan data.key ke domain API.
   */
  getSingleUrl: async (
    body: GetSingleUploadUrlBody
  ): Promise<SingleUploadUrlData> => {
    const { data } = await apiClient.post<SingleUploadUrlResponse>(
      '/uploads/get-single-url',
      body
    );
    if (
      !data?.success ||
      !data.data?.uploadUrl ||
      !data.data?.key ||
      !data.data?.fileUrl
    ) {
      throw new Error('Invalid get-single-url response');
    }
    return data.data;
  },

  /**
   * Upload binary ke presigned URL (R2).
   * Content-Type harus sama dengan fileType saat getSingleUrl.
   */
  putToPresignedUrl: async (params: {
    uploadUrl: string;
    body: Blob;
    contentType: string;
  }): Promise<void> => {
    const res = await fetch(params.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': params.contentType,
      },
      body: params.body,
    });
    if (!res.ok) {
      throw new Error(`Upload ke R2 gagal (${res.status})`);
    }
  },
};
