// src/app/features/users/user-resource.component.ts
import { Component, inject } from '@angular/core';
import { UserResourceStore } from './features/users/user.resource-store';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-user-resource',
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
    <button pButton type="button" (click)="store.setSelectedUserId(user.id + 1)">Load Next User</button>
  }
  @else if (store.isError()){
    <div>
    <p>Error loading user</p>
    <p>{{ store.errorMessage() }}</p>
    <button pButton type="button" (click)="store.reloadUser()">Reload User</button>
    </div>
  }
  @else {
    <div>
    <p>No user selected</p>
    </div>
  }

  <p>Status: {{ store.status() }}</p>
  <button pButton type="button" (click)="store.setSelectedUserId(store.value().id + 1)">Next User</button>
  `
})
export class UserResourceComponent {
  public store = inject(UserResourceStore);
}
