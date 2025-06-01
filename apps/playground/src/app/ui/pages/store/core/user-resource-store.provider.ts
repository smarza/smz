// src/app/core/user-resource-store.provider.ts
import {
  USER_RESOURCE_STORE_TOKEN,
  User,
  UserParams
} from './resource-store-tokens';
import { ResourceStoreBuilder } from '@smz-ui/store';
import { UserApiService } from '../features/users/user.api';

export const userStoreProvider = (() => {
  const builder = new ResourceStoreBuilder<User, UserParams>()
    // 1) Parâmetros iniciais do store: id = 1
    .withInitialParams({ id: 9 })
    // 2) Valor padrão enquanto o backend não responde
    .withDefaultValue({ id: 0, name: '', email: '' })
    // 3) Loader real: recebe (params, userApiService) e chama o backend
    // .withLoaderFn((params: UserParams, api: UserApiService) =>
    //   api.getUserById(params.id).catch((httpErr: any) => {
    //     if (httpErr.status === 404) {
    //       throw new Error(`Usuário ${params.id} não existe.`);
    //     }
    //     throw new Error(httpErr.message ?? 'Erro desconhecido');
    //   })
    // )
    .withLoaderFn((params: UserParams, api: UserApiService) =>
      api.getUserById(params.id)
    )
    .addDependency(UserApiService)
    // 4) TTL de 2 minutos (120000 ms)
    .withTtlMs(2 * 60 * 1000);

  // Registramos o provider, informando que UserApiService será injetado como dependência
  return builder.buildProvider(USER_RESOURCE_STORE_TOKEN, [UserApiService]);
})();
