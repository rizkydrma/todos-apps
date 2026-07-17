/**
 * Tipe domain Users (admin list / CRUD).
 * Beda dari PublicUser di auth — ini model resource /users di API.
 */

/** Representasi user di list/detail users. */
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

/** Payload create user (admin). */
export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}

/** Response list users + optional meta total. */
export interface UserListResponse {
  data: User[];
  meta?: { total: number };
}
