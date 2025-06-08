import { InjectionToken } from '@angular/core';
import {
  FeatureStoreBuilder,
  GenericFeatureStore,
} from '@smz-ui/store';

export interface CounterState {
  count: number;
}

export interface CounterStore extends GenericFeatureStore<CounterState, CounterStore> {
  increment(): void;
  decrement(): void;
}

const counterStoreBuilder = new FeatureStoreBuilder<CounterState, CounterStore>()
  .withInitialState({ count: 0 })
  .withLoaderFn(async () => ({ count: Math.floor(Math.random() * 10) }))
  .withAction('increment', (store: CounterStore) => async () => {
    store.updateState({ count: store.state().count + 1 });
  })
  .withAction('decrement', (store: CounterStore) => async () => {
    store.updateState({ count: store.state().count - 1 });
  });

export const COUNTER_FEATURE_1_STORE_TOKEN = new InjectionToken<CounterStore>('COUNTER_FEATURE_1_STORE_TOKEN');

export const counterFeature1StoreProvider = counterStoreBuilder.buildProvider(COUNTER_FEATURE_1_STORE_TOKEN);
