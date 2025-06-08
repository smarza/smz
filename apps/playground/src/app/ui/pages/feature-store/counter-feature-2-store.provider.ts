import { InjectionToken } from '@angular/core';
import {
  FeatureStoreBuilder,
  GenericFeatureStore,
} from '@smz-ui/store';

export interface CounterState {
  count: number;
}

const counterStoreBuilder = new FeatureStoreBuilder<CounterState, never>()
  .withInitialState({ count: 0 })
  .withLoaderFn(async () => ({ count: Math.floor(Math.random() * 10) }))
  .withAutoRefresh(1 * 10 * 1000);

export const COUNTER_FEATURE_2_STORE_TOKEN = new InjectionToken<GenericFeatureStore<CounterState, never>>('COUNTER_FEATURE_2_STORE_TOKEN');

export const counterFeature2StoreProvider = counterStoreBuilder.buildProvider(COUNTER_FEATURE_2_STORE_TOKEN);