import { InjectionToken } from '@angular/core';
import {
  GlobalStoreBuilder,
  GenericGlobalStore,
} from '@smz-ui/store';
import { AuthState } from './auth.model';
import { AuthApiService } from './auth.api';

export const AUTH_GLOBAL_STORE_TOKEN = new InjectionToken<GenericGlobalStore<AuthState>>('AUTH_GLOBAL_STORE_TOKEN');

export const authGlobalStoreProvider = (() => {
  const builder = new GlobalStoreBuilder<AuthState>()
    .withInitialState({ token: null, currentUser: null })
    .withLoaderFn((api: AuthApiService) => api.fetchAuthData())
    .addDependency(AuthApiService)
    .withTtlMs(2 * 60 * 1000) // 2 minutes
    .withName('AuthGlobalStore');

  return builder.buildProvider(AUTH_GLOBAL_STORE_TOKEN, [AuthApiService]);
})();
