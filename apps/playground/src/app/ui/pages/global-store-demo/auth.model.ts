export interface UserInfo {
  id: number;
  name: string;
}

export interface AuthState {
  token: string | null;
  currentUser: UserInfo | null;
}
