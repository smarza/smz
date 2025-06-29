import { InjectionToken } from '@angular/core';
import {
  SmzStateStoreBuilder,
  SmzStore,
  withLocalStoragePersistence,
  withAutoRefresh,
  withLazyCache,
  withErrorHandler
} from '@smz-ui/store';

// Define the state interface
interface CounterState {
  count: number;
  loading: boolean;
  error: string | null;
}

// Define the actions interface
interface CounterActions {
  increment(): void;
  clearError(): void;
  reloadRandom(): Promise<void>;
}

// Define the selectors interface
interface CounterSelectors {
  isPositive(): boolean;
  isNegative(): boolean;
  isZero(): boolean;
  doubleCount(): number;
  isLoading(): boolean;
  hasError(): boolean;
  getError(): string | null;
}

// Export the store type
export type CounterStore = SmzStore<CounterState, CounterActions, CounterSelectors>;

// Create the builder instance
const builder = new SmzStateStoreBuilder<CounterState, CounterActions, CounterSelectors>()
  .withScopeName('Counter2Store')
  .withInitialState({
    count: 0,
    loading: false,
    error: null
  })
  .withLoaderFn(async () => {
    return { count: Math.floor(Math.random() * 10) };
  })
  .withPlugin(withLazyCache(5 * 60 * 1000)) // 5 minutes cache
  .withPlugin(withAutoRefresh(10 * 1000)) // 10 seconds refresh (as in original)
  .withPlugin(withLocalStoragePersistence('counter-2-store'))
  .withPlugin(withErrorHandler((error) => {
    console.error('Counter 2 Store Error:', error);
  }))
  .withActions((actions, injector, updateState, getState) => {
    actions.increment = () => {
      const currentState = getState();
      updateState({ count: currentState.count + 1 });
    };

    actions.clearError = () => {
      updateState({ error: null });
    };

    actions.reloadRandom = async () => {
      updateState({ loading: true, error: null });
      try {
        const randomCount = Math.floor(Math.random() * 10);
        updateState({ count: randomCount, loading: false });
      } catch (error) {
        updateState({
          error: error instanceof Error ? error.message : 'Failed to reload random count',
          loading: false
        });
        throw error;
      }
    };
  })
  .withSelectors((selectors, injector, getState) => {
    selectors.isPositive = () => getState().count > 0;

    selectors.isNegative = () => getState().count < 0;

    selectors.isZero = () => getState().count === 0;

    selectors.doubleCount = () => getState().count * 2;

    selectors.isLoading = () => getState().loading;

    selectors.hasError = () => getState().error !== null;

    selectors.getError = () => getState().error;
  });

// Create injection token
export const COUNTER_2_STORE_TOKEN = new InjectionToken<CounterStore>('COUNTER_2_STORE_TOKEN');

// Export the provider
export const counter2StoreProvider = builder.buildProvider(COUNTER_2_STORE_TOKEN);