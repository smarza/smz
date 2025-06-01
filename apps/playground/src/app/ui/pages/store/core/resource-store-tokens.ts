// src/app/core/resource-store-tokens.ts
import { InjectionToken } from '@angular/core';
import { GenericResourceStore } from '@smz-ui/store';

/**
 * Aqui declaramos um token genérico para stores de usuário.
 * No module, vamos passar ao builder esse token para que
 * o Angular saiba “onde” injetar a instância criada dinamicamente.
 */
export interface UserParams {
  id: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

/**
 * Em outras palavras: `UserResourceStore` (dinâmico) será
 * uma instância de GenericResourceStore<User, UserParams>.
 */
export const USER_RESOURCE_STORE_TOKEN = new InjectionToken<GenericResourceStore<User, UserParams>>(
  'USER_RESOURCE_STORE_TOKEN'
);
