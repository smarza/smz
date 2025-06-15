import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { STATE_STORE_DEMO_TOKEN, CounterStore } from './state-store-demo.provider';

@Component({
  selector: 'app-state-store-demo',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  host: { class: 'flex flex-col gap-4' },
  template: `
    <div class="flex flex-col gap-2">
      <div class="text-3xl font-bold">State Store Demo</div>
      <div>Status: {{ store.status.isLoaded() }}</div>
    </div>

    <div class="flex gap-2">
      <button pButton type="button" label="Increment" icon="pi pi-plus" (click)="store.actions.increment()"></button>
      <button pButton type="button" label="Decrement" icon="pi pi-minus" (click)="store.actions.decrement()"></button>
      <button pButton type="button" label="Reload" icon="pi pi-refresh" severity="info" (click)="store.actions.reload()"></button>
    </div>

    @if (store.status.isLoaded()) {
      <div class="text-2xl font-bold">Count: {{ store.state.state().count }}</div>
    }

    @if (store.status.isLoading()) {
      <p>Loading...</p>
    }

    @if (store.status.isError()) {
      <p class="text-red-500">Error: {{ store.error.error()?.message }}</p>
    }
  `
})
export class StateStoreDemoComponent {
  readonly store: CounterStore = inject(STATE_STORE_DEMO_TOKEN);
}