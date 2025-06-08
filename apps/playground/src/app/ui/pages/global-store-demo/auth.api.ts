import { Injectable } from '@angular/core';
import { AuthGlobalState } from './auth-global-store.provider';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  async fetchAuthData(): Promise<Partial<AuthGlobalState>> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      token: 'token-' + Math.random().toString(36).substring(2, 8),
      currentUser: { id: 1, name: 'Demo User', email: 'demo@user.com' },
    };
  }
}
