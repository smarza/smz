// src/app/features/users/user-resource.component.ts
import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { User } from './user.model';
import { USER_RESOURCE_STORE_TOKEN, UserParams } from './user-resource-store.provider';
import { GenericResourceStore } from '../../../smz-store/generic-resource-store';

@Component({
  selector: 'app-user-resource',
  imports: [CommonModule, ButtonModule],
  host: { class: 'flex flex-col gap-4' },
  template: `
  <div class="flex flex-col gap-2">
    <div class="text-3xl font-bold">User Dynamic Resource</div>
    <div>Status: {{ store.status() }}</div>
  </div>

  <div class="flex gap-2">
    <button pButton type="button" icon="pi pi-user" severity="help" (click)="firstUser()">First User</button>
    @if (store.isResolved()) {
      <button pButton type="button" icon="pi pi-arrow-left" (click)="previousUser()">Previous User</button>
      <button pButton type="button" icon="pi pi-arrow-right" (click)="nextUser()">Next User</button>
      <button pButton type="button" icon="pi pi-refresh" severity="info" (click)="store.reload()">Reload User</button>
    }
  </div>

  @if (store.isLoading()){
    <div>
    <p>Loading user…</p>
    </div>
  }

  @if (store.isResolved()){
    @let user = store.value();
    <div class="flex flex-col gap-2 bg-gray-200 text-gray-800 p-2 rounded-md">
      <div>Id: {{ user.id }}</div>
      <div class="text-lg font-bold">Name: {{ user.name }}</div>
      <div>Email: {{ user.email }}</div>
    </div>
  }

  @if (store.isError()){
    <div class="flex flex-col gap-2">
      <div class="text-lg font-bold text-red-500">Error loading user</div>
      <div>{{ store.errorMessage() }}</div>
    </div>
  }
  `
})
export class UserResourceComponent {
  public readonly store: GenericResourceStore<User, UserParams> = inject(USER_RESOURCE_STORE_TOKEN);

  public nextUser() {
    this.store.setParams({ id: this.store.value().id + 1 });
  }

  public reloadUser() {
    this.store.reload();
  }

  public previousUser() {
    this.store.setParams({ id: this.store.value().id - 1 });
  }

  public firstUser() {
    this.store.setParams({ id: 1 });
  }
}
