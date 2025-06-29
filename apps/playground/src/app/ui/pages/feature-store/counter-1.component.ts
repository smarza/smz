import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { COUNTER_1_STORE_TOKEN, CounterStore } from './counter-1-store.provider';

@Component({
  selector: 'app-counter-1',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  host: { class: 'flex flex-col gap-4' },
  template: `
  <div class="flex flex-col gap-2">
    <div class="text-3xl font-bold">Counter 1</div>
    <div>Status: {{ store.status.status() }}</div>

    <div class="flex gap-2">
      <button pButton type="button" label="Increment" icon="pi pi-plus" (click)="increment()"></button>
      <button pButton type="button" label="Decrement" icon="pi pi-minus" (click)="decrement()"></button>
      <button pButton type="button" label="Reload Random" icon="pi pi-refresh" severity="info" (click)="reloadRandom()"></button>
    </div>

    @if (store.status.isResolved()) {
      <div class="text-2xl font-bold">Count: {{ store.state.state().count }}</div>
      <div class="text-sm text-gray-600">
        <div>Is Positive: {{ store.selectors.isPositive() }}</div>
        <div>Is Negative: {{ store.selectors.isNegative() }}</div>
        <div>Is Zero: {{ store.selectors.isZero() }}</div>
        <div>Double Count: {{ store.selectors.doubleCount() }}</div>
      </div>
    }

    @if (store.status.isLoading()){
      <div>
      <p>Loading...</p>
      </div>
    }

    @if (store.status.isError()){
    <div class="flex flex-col gap-2">
      <div class="text-lg font-bold text-red-500">Error loading data</div>
      <div>{{ store.error.error()?.message }}</div>
      <button pButton type="button" label="Clear Error" (click)="store.actions.clearError()"></button>
    </div>
  }

  </div>
  `
})
export class Counter1Component implements OnInit, OnDestroy {
  public readonly store: CounterStore = inject(COUNTER_1_STORE_TOKEN);

  ngOnInit(): void {
    // Wake up the store to activate plugins
    this.store.controls.wakeUp();
  }

  ngOnDestroy(): void {
    // Put the store to sleep to clean up plugins
    this.store.controls.sleep();
  }

  increment() {
    this.store.actions.increment();
  }

  decrement() {
    this.store.actions.decrement();
  }

  async reloadRandom() {
    try {
      await this.store.actions.reloadRandom();
    } catch (error) {
      console.error('Failed to reload random count:', error);
    }
  }
}
