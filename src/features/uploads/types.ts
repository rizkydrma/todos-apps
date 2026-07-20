/**
 * Tipe endpoint /uploads/* (presigned R2).
 * Dipakai sebelum PATCH domain resource (mis. avatarKey di /auth/me).
 */

/** Body POST /uploads/get-single-url (file ≤ 50MB). */
export type GetSingleUploadUrlBody = {
  fileName: string;
  fileType: string;
  fileSize: number;
  /** Folder object di R2. Default backend: uploads. Avatar pakai "avatars". */
  folder?: string;
};

/** Data presigned single PUT. */
export type SingleUploadUrlData = {
  /** URL PUT binary ke R2 (presigned, berumur expiresIn detik). */
  uploadUrl: string;
  /** URL publik file setelah upload (CDN). */
  fileUrl: string;
  /** Object key — disimpan ke domain (mis. avatarKey). */
  key: string;
  expiresIn: number;
};

export type SingleUploadUrlResponse = {
  success: true;
  data: SingleUploadUrlData;
  requestId: string;
};
