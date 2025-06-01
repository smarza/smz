import { InjectionToken } from '@angular/core';
import { GlobalStoreBuilder } from '../../../smz-store/global-store-builder';
import { GenericGlobalStore } from '../../../smz-store/generic-global-store';
import { AuthState } from './auth.model';
import { AuthApiService } from './auth.api';

export const AUTH_GLOBAL_STORE_TOKEN = new InjectionToken<GenericGlobalStore<AuthState>>('AUTH_GLOBAL_STORE_TOKEN');

export const authGlobalStoreProvider = (() => {
  const builder = new GlobalStoreBuilder<AuthState>()
    .withInitialState({ token: null, currentUser: null })
    .withLoaderFn((api: AuthApiService) => api.fetchAuthData())
    .addDependency(AuthApiService)
    .withTtlMs(3000);

  return builder.buildProvider(AUTH_GLOBAL_STORE_TOKEN, [AuthApiService]);
})();
