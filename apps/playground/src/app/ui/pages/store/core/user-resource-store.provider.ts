import {
  USER_RESOURCE_STORE_TOKEN,
  User,
  UserParams
} from './resource-store-tokens';
import { ResourceStoreBuilder } from './resource-store-builder';
import { UserApiService } from '../features/users/user.api';

export const userStoreProvider = (() => {
  const builder = new ResourceStoreBuilder<User, UserParams>()
    // 1) Inicializa params com { id: 1 }
    .withInitialParams({ id: 1 })
    // 2) Valor padrão de User enquanto carrega
    .withDefaultValue({ id: 0, name: 'Loading…', email: '' })
    // 3) Loader recebe (params, apiService) e chama o backend
    .withLoaderFn((params: UserParams, api: UserApiService) =>
      api.getUserById(params.id)
    )
    // 4) Declaramos que vamos injetar UserApiService na factory
    .addDependency(UserApiService)
    // 5) TTL opcional (por ex. 2 minutos)
    .withTtlMs(2 * 60 * 1000);

  return builder.buildProvider(USER_RESOURCE_STORE_TOKEN, [UserApiService]);
})();
