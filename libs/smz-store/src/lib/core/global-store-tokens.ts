// src/app/core/global-store-tokens.ts
import { InjectionToken } from '@angular/core';
import { GenericGlobalStore } from './generic-global-store';

export interface AuthGlobalParams {
  // Example: maybe nothing for auth
}

export interface AuthState {
  currentUser: any | null;
  authToken: string | null;
  loading: boolean;
  error: string | null;
}

export const AUTH_GLOBAL_STORE_TOKEN = new InjectionToken<
  GenericGlobalStore<AuthState, AuthGlobalParams>
>('AUTH_GLOBAL_STORE_TOKEN');
