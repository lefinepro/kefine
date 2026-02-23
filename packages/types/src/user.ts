// User types shared across services
export interface User {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface CreateUserRequest {
  username: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
}

export type UpdateUserRequest = Partial<CreateUserRequest>;
