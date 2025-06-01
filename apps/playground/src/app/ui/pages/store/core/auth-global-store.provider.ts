// src/app/core/auth-global-store.provider.ts
import { GlobalStoreBuilder } from '@smz-ui/store';
import {
  AUTH_GLOBAL_STORE_TOKEN,
  AuthState,
  AuthGlobalParams,
} from '@smz-ui/store';
import { AuthApiService } from '../features/auth/auth.api';

export const authStoreProvider = (() => {
  const builder = new GlobalStoreBuilder<AuthState, AuthGlobalParams>()
    .withInitialState({
      currentUser: null,
      authToken: null,
      loading: false,
      error: null,
    })
    .withInitialParams({})
    .withLoaderFn(async (_params: AuthGlobalParams, api: AuthApiService) => {
      // pretend we load profile
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { currentUser: null, authToken: null };
      }
      const { user } = await api.login({
        username: 'refresh',
        password: token,
      });
      return { currentUser: user, authToken: token };
    })
    .addDependency(AuthApiService)
    .withTtlMs(5 * 60 * 1000);
  return builder.buildProvider(AUTH_GLOBAL_STORE_TOKEN, [AuthApiService]);
})();
