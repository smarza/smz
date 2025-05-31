// src/app/features/users/user-resource.component.ts
import { Component, Inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { UserParams } from './core/resource-store-tokens';
import { User } from './core/resource-store-tokens';
import { GenericResourceStore } from './core/generic-resource-store';
import { USER_RESOURCE_STORE_TOKEN } from './core/resource-store-tokens';

@Component({
  selector: 'app-user-dynamic-resource',
  imports: [ButtonModule],
  template: `
  @if (store.isLoading()){
    <div>
    <p>Loading user…</p>
    </div>
  }
  @else if (store.isResolved()){
    @let user = store.value();
    <h2>{{ user.name }}</h2>
    <p>{{ user.email }}</p>
    <button pButton type="button" (click)="store.setParams({ id: user.id + 1 })">Load Next User</button>
  }
  @else if (store.isError()){
    <div>
    <p>Error loading user</p>
    <p>{{ store.errorMessage() }}</p>
    <button pButton type="button" (click)="store.reload()">Reload User</button>
    </div>
  }
  @else {
    <div>
    <p>No user selected</p>
    </div>
  }

  <p>Status: {{ store.status() }}</p>
  <button pButton type="button" (click)="store.setParams({ id: store.value().id + 1 })">Next User</button>
  `
})
export class UserDynamicResourceComponent {
  constructor(
    @Inject(USER_RESOURCE_STORE_TOKEN)
    public store: GenericResourceStore<User, UserParams>
  ) {
  }
}
