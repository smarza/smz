// src/app/features/user/user.resource-store.ts
import { Injectable } from '@angular/core';
import { ResourceStore } from '../../core/resource-store';
import { UserApiService } from './user.api';
import { User } from './user.model';

interface UserParams {
  id: number;
}

@Injectable({ providedIn: 'root' })
export class UserResourceStore extends ResourceStore<User, UserParams> {
  constructor(private api: UserApiService) {
    super();
  }

  /** 1) We want to start by loading user with ID = 1 initially */
  protected getInitialParams(): UserParams {
    return { id: 1 };
  }

  /** 2) Until the real User loads, we expose this “placeholder” user */
  protected getDefaultValue(): User {
    return { id: 0, name: 'Loading…', email: '' };
  }

  /** 3) The actual API call that returns a Promise<User> */
  protected loadFromApi(params: UserParams): Promise<User> {
    return this.api.getUserById(params.id);
  }

  /** Convenience: change the selected user ID */
  setSelectedUserId(id: number): void {
    this.setParams({ id });
  }
}
