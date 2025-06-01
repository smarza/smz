import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { GenericFeatureStore } from '../../../smz-store/generic-feature-store';
import { COUNTER_FEATURE_2_STORE_TOKEN, counterFeature2StoreProvider, CounterState } from './counter-feature-2-store.provider';

@Component({
  selector: 'app-counter-feature-2',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  providers: [counterFeature2StoreProvider],
  host: { class: 'flex flex-col gap-4' },
  template: `
  <div class="flex flex-col gap-2">
    <div class="text-3xl font-bold">Feature Store Demo</div>
    <div>Status: {{ store.status() }}</div>
    <div>Count: {{ store.state().count }}</div>
  </div>
  <div class="flex gap-2">
    <button pButton type="button" icon="pi pi-plus" (click)="increment()">Increment</button>
    <button pButton type="button" icon="pi pi-refresh" severity="info" (click)="reload()">Reload Random</button>
  </div>
  `
})
export class CounterFeature2Component {
  public readonly store: GenericFeatureStore<CounterState> = inject(COUNTER_FEATURE_2_STORE_TOKEN);

  increment() {
    const current = this.store.state().count;
    this.store.updateState({ count: current + 1 });
  }

  reload() {
    void this.store.reload();
  }
}
