import { InjectionToken } from '@angular/core';
import {
  GlobalStoreBuilder,
  GenericGlobalStore,
} from '@smz-ui/store';
import { AuthApiService } from './auth.api';
import { User } from '../user-resource/user.model';

export interface AuthGlobalState {
  token: string | null;
  currentUser: User | null;
}

const authGlobalStoreBuilder = new GlobalStoreBuilder<AuthGlobalState, never>()
  .withInitialState({ token: null, currentUser: null })
  .addDependency(AuthApiService)
  .withLoaderFn((api: AuthApiService) => {
    console.log('******************* withLoaderFn', api);
    return api.fetchAuthData();
  })
  .withAutoRefresh(2 * 60 * 1000);

export const AUTH_GLOBAL_STORE_TOKEN = new InjectionToken<GenericGlobalStore<AuthGlobalState, never>>('AUTH_GLOBAL_STORE_TOKEN');

export const authGlobalStoreProvider = authGlobalStoreBuilder.buildProvider(AUTH_GLOBAL_STORE_TOKEN);