/**
 * Tipe Category (katalog global). Admin write; member read untuk filter/assign.
 */

export type Category = {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CategoryListResponse = {
  success: true;
  data: Category[];
  requestId: string;
};

export type CategoryResponse = {
  success: true;
  data: Category;
  requestId: string;
};

export type CreateCategoryBody = {
  name: string;
  color?: string;
};

export type UpdateCategoryBody = {
  name?: string;
  color?: string | null;
};
