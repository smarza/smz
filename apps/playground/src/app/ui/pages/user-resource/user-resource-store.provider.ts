// src/app/core/user-resource-store.provider.ts
import { ResourceStoreBuilder } from '../../../smz-store/resource-store-builder';
import { GenericResourceStore } from '../../../smz-store/generic-resource-store';
import { InjectionToken } from '@angular/core';
import { User } from './user.model';
import { UserApiService } from './user.api';

/**
 * Aqui declaramos um token genérico para stores de usuário.
 * No module, vamos passar ao builder esse token para que
 * o Angular saiba “onde” injetar a instância criada dinamicamente.
 */
export interface UserParams {
  id: number;
}

/**
 * Em outras palavras: `UserResourceStore` (dinâmico) será
 * uma instância de GenericResourceStore<User, UserParams>.
 */
export const USER_RESOURCE_STORE_TOKEN = new InjectionToken<GenericResourceStore<User, UserParams>>(
  'USER_RESOURCE_STORE_TOKEN'
);

export const userStoreProvider = (() => {
  const builder = new ResourceStoreBuilder<User, UserParams>()
    // 1) Parâmetros iniciais do store: id = 1
    .withInitialParams({ id: 9 })
    // 2) Valor padrão enquanto o backend não responde
    // 3) Loader real: recebe (params, userApiService) e chama o backend
    .withLoaderFn((params: UserParams, api: UserApiService) =>
      api.getUserById(params.id).catch((httpErr: any) => {
        if (httpErr.status === 404) {
          throw new Error(`Usuário ${params.id} não existe.`);
        }
        throw new Error(httpErr.message ?? 'Erro desconhecido');
      })
    )
    .addDependency(UserApiService)
    // 4) TTL de 2 minutos (120000 ms)
    .withTtlMs(5000)
    .withName('UserResourceStore');

  // Registramos o provider, informando que UserApiService será injetado como dependência
  return builder.buildProvider(USER_RESOURCE_STORE_TOKEN, [UserApiService]);
})();
