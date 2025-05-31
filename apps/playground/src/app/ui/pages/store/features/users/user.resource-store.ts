// src/app/features/user/user.resource-store.ts
import { Injectable } from '@angular/core';
import { ResourceStore } from '../../core/resource-store';
import { UserApiService } from './user.api';
import { User } from './user.model';

interface UserParams
{
  id: number;
}

@Injectable({ providedIn: 'root' })
export class UserResourceStore extends ResourceStore<User, UserParams>
{
  constructor(private api: UserApiService)
  {
    super();
  }

  /** 1) Parâmetros iniciais: queremos começar carregando o usuário com ID = 1 */
  protected getInitialParams(): UserParams
  {
    return { id: 1 };
  }

  /** 2) Valor padrão exibido enquanto o real não chega (forme imutável) */
  protected getDefaultValue(): User
  {
    return { id: 0, name: 'Loading…', email: '' };
  }

  /** 3) Chamada real ao UserApiService que retorna Promise<User>  */
  protected loadFromApi(params: UserParams): Promise<User>
  {
    return this.api.getUserById(params.id);
  }

  /**
   * Conveniência: troque rapidamente qual usuário está selecionado.
   * Exemplo: store.setSelectedUserId(5)
   */
  setSelectedUserId(id: number): void
  {
    this.setParams({ id });
  }

  /** Exemplo: recarregar automaticamente 2 minutos após cada fetch bem-sucedido */
  protected override getTtlMs(): number
  {
    return 2 * 60 * 1000; // 120 000 ms
  }

  /**
   * opcional: recarregar o mesmo ID sem alterá-lo
   * (por exemplo, após um timeout ou clique em “Recarregar”)
   */
  reloadUser(): void
  {
    this.reload();
  }
}
