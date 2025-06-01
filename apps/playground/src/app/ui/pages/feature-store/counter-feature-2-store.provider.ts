import { InjectionToken } from '@angular/core';
import {
  FeatureStoreBuilder,
  GenericFeatureStore,
} from '@smz-ui/store';

export interface CounterState {
  count: number;
}

export const COUNTER_FEATURE_2_STORE_TOKEN = new InjectionToken<GenericFeatureStore<CounterState>>('COUNTER_FEATURE_2_STORE_TOKEN');

export const counterFeature2StoreProvider = (() => {
  const builder = new FeatureStoreBuilder<CounterState>()
    .withName('CounterFeature2Store')
    .withInitialState({ count: 0 })
    .withLoaderFn(async () => {
      // Simulate async fetch of a random starting count
      return { count: Math.floor(Math.random() * 10) };
    })
    .withTtlMs(1 * 10 * 1000); // 10 seconds

  return builder.buildProvider(COUNTER_FEATURE_2_STORE_TOKEN);
})();
