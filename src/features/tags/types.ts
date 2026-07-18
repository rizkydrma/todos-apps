/**
 * Tipe Tag (katalog global). Admin write; member read untuk filter/assign.
 */

export type Tag = {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TagListResponse = {
  success: true;
  data: Tag[];
  requestId: string;
};

export type TagResponse = {
  success: true;
  data: Tag;
  requestId: string;
};

export type CreateTagBody = {
  name: string;
  color?: string;
};

export type UpdateTagBody = {
  name?: string;
  color?: string | null;
};
