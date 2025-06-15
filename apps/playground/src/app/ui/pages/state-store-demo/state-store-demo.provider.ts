import { InjectionToken } from '@angular/core';
import { StateStoreBuilder, withLocalStoragePersistence, withAutoRefresh, withLazyCache, withErrorHandler, SmzStore } from '@smz-ui/store';

interface CounterState {
  count: number;
}

interface CounterActions {
  increment(): void;
  decrement(): void;
}

export type CounterStore = SmzStore<CounterState, CounterActions>;

const builder = new StateStoreBuilder<CounterState, CounterActions>()
  .withScopeName('CounterStore')
  .withInitialState({ count: 0 })
  .withLoaderFn(async () => {
    console.log('--------------------- API CALL ---------------------');
    if (Math.random() < 0.3) { // 30% chance to simulate an API error
      throw new Error('Simulated API error');
    }
    return { count: Math.floor(Math.random() * 10) };
  })
  .withPlugin(withLazyCache(9 * 1000))
  .withPlugin(withAutoRefresh(5 * 1000))
  .withPlugin(withLocalStoragePersistence('counter-demo'))
  .withPlugin(withErrorHandler((error, store) => {
    console.error('Error detected in store', error);
    console.log('store', store);
  }))
  .withActions((actions, env, updateState, getState) => {
    actions.increment = () => {
      updateState({ count: getState().count + 1 });
    };
    actions.decrement = () => {
      updateState({ count: getState().count - 1 });
    };
  });

export const STATE_STORE_DEMO_TOKEN = new InjectionToken<CounterStore>('STATE_STORE_DEMO_TOKEN');

export const stateStoreDemoProvider = builder.buildProvider(STATE_STORE_DEMO_TOKEN);