export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}

export interface UserListResponse {
  data: User[];
  meta?: { total: number };
}
