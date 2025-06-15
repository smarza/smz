import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { STATE_STORE_DEMO_TOKEN, CounterStore } from './state-store-demo.provider';

@Component({
  selector: 'app-state-store-demo',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule],
  host: { class: 'flex flex-col gap-4' },
  template: `
    <div class="flex flex-col gap-2">
      <div class="text-3xl font-bold">State Store Demo</div>
      <div>Status: {{ store.status.status() }}</div>
    </div>

    <div class="flex gap-2">
      <button pButton type="button" label="Increment" icon="pi pi-plus" (click)="store.actions.increment()"></button>
      <button pButton type="button" label="Decrement" icon="pi pi-minus" (click)="store.actions.decrement()"></button>
      <button pButton type="button" label="Reload" icon="pi pi-refresh" severity="info" (click)="store.actions.reload()"></button>
      <button pButton type="button" label="Force Reload" icon="pi pi-refresh" severity="warn" (click)="store.actions.forceReload()"></button>
    </div>

    @if (store.status.isLoaded()) {
      <div class="text-2xl font-bold">Count: {{ store.state.state().count }}</div>
    }

    @if (store.status.isLoading()) {
      <p>Loading...</p>
    }

    @if (store.status.isError()) {
      <div class="flex flex-col gap-2 p-4 border border-red-200 rounded-lg bg-red-50">
        <div class="flex items-center gap-2">
          <i class="pi pi-exclamation-triangle text-red-500"></i>
          <span class="font-semibold text-red-700">Error occurred</span>
        </div>
        <div class="text-red-600">{{ store.error.error()?.message }}</div>
        @if (store.error.error()?.storeName) {
          <div class="text-sm text-red-500">Store: {{ store.error.error()?.storeName }}</div>
        }
        @if (store.error.error()?.timestamp) {
          <div class="text-sm text-red-500">Time: {{ store.error.error()?.timestamp | date:'medium' }}</div>
        }
        @if (store.error.error()?.originalError) {
          <div class="mt-2 p-2 bg-red-100 rounded text-sm">
            <div class="font-medium text-red-700 mb-1">Original Error:</div>
            <pre class="text-red-600 whitespace-pre-wrap">{{ store.error.error()?.originalError | json }}</pre>
          </div>
        }
      </div>
    }

    @if (store.status.isLoaded()) {
      <p-card header="Selectors Demo" styleClass="w-full">
        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <div class="font-bold">State Checks:</div>
              <div class="flex items-center gap-2">
                <i class="pi" [class.pi-check-circle]="store.selectors.isPositive()" [class.pi-times-circle]="!store.selectors.isPositive()"
                   [class.text-green-500]="store.selectors.isPositive()" [class.text-red-500]="!store.selectors.isPositive()"></i>
                <span>Is Positive</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="pi" [class.pi-check-circle]="store.selectors.isNegative()" [class.pi-times-circle]="!store.selectors.isNegative()"
                   [class.text-green-500]="store.selectors.isNegative()" [class.text-red-500]="!store.selectors.isNegative()"></i>
                <span>Is Negative</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="pi" [class.pi-check-circle]="store.selectors.isZero()" [class.pi-times-circle]="!store.selectors.isZero()"
                   [class.text-green-500]="store.selectors.isZero()" [class.text-red-500]="!store.selectors.isZero()"></i>
                <span>Is Zero</span>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <div class="font-bold">Computed Values:</div>
              <div class="flex items-center gap-2">
                <i class="pi pi-calculator text-blue-500"></i>
                <span>Double Count: {{ store.selectors.doubleCount() }}</span>
              </div>
            </div>
          </div>
        </div>
      </p-card>
    }
  `
})
export class StateStoreDemoComponent {
  readonly store: CounterStore = inject(STATE_STORE_DEMO_TOKEN);
}