// src/app/features/auth/auth.model.ts
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Credentials {
  username: string;
  password: string;
}

export interface AuthStateModel {
  currentUser: User | null;
  authToken: string | null;
  loading: boolean;
  error: string | null;
}
