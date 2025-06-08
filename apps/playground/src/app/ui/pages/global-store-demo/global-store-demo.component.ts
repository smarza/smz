import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { GenericGlobalStore } from '@smz-ui/store';
import { AUTH_GLOBAL_STORE_TOKEN, AuthGlobalState } from './auth-global-store.provider';

@Component({
  selector: 'app-global-store-demo',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  host: { class: 'flex flex-col gap-4' },
  template: `
    <div class="flex flex-col gap-2">
      <div class="text-3xl font-bold">Global Store Demo</div>
      <div>Status: {{ store.status() }}</div>
    </div>

    <div class="flex gap-2">
      <button pButton type="button" label="Reload" icon="pi pi-refresh" (click)="store.reload()"></button>
      <button pButton type="button" label="Clear" icon="pi pi-times" severity="danger" (click)="clear()"></button>
    </div>

    @if (store.isLoading()) {
      <p>Loading authentication...</p>
    }

    @if (store.isResolved()) {
      @let data = store.state();
      <div class="flex flex-col gap-2 bg-gray-200 text-gray-800 p-2 rounded-md">
        <div>Token: {{ data.token }}</div>
        <div>User: {{ data.currentUser?.name }}</div>
        <div>Email: {{ data.currentUser?.email }}</div>
      </div>
    }

    @if (store.isError()) {
      <div class="text-red-500">Error: {{ store.error()?.message }}</div>
    }
  `
})
export class GlobalStoreDemoComponent {
  readonly store: GenericGlobalStore<AuthGlobalState, never> = inject(AUTH_GLOBAL_STORE_TOKEN);

  clear() {
    this.store.updateState({ token: null, currentUser: null });
  }
}
