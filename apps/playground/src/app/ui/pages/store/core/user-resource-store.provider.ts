// src/app/core/user-resource-store.provider.ts
import {
  USER_RESOURCE_STORE_TOKEN,
  User,
  UserParams
} from './resource-store-tokens';
import { ResourceStoreBuilder } from './resource-store-builder';
import { UserApiService } from '../features/users/user.api';

export const userStoreProvider = (() => {
  const builder = new ResourceStoreBuilder<User, UserParams>()
    // 1) Parâmetros iniciais do store: id = 1
    .withInitialParams({ id: 1 })
    // 2) Valor padrão enquanto o backend não responde
    .withDefaultValue({ id: 0, name: 'Loading…', email: '' })
    // 3) Loader real: recebe (params, userApiService) e chama o backend
    .withLoaderFn((params: UserParams, api: UserApiService) =>
      api.getUserById(params.id)
    )
    // 4) TTL de 2 minutos (120000 ms)
    .withTtlMs(2 * 60 * 1000);

  // Registramos o provider, informando que UserApiService será injetado como dependência
  return builder.buildProvider(USER_RESOURCE_STORE_TOKEN, [UserApiService]);
})();
