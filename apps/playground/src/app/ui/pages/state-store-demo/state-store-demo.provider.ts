import { InjectionToken } from '@angular/core';
import { StateStoreBuilder, withLocalStoragePersistence, withProactivePolling, withLazyTtl, BaseStateStore, withErrorHandler } from '@smz-ui/store';

export interface CounterState {
  count: number;
}

export interface CounterStore extends BaseStateStore<CounterState> {
  increment(): void;
  decrement(): void;
}

const builder = new StateStoreBuilder<CounterState, CounterStore>()
  .withScopeName('CounterStore')
  .withInitialState({ count: 0 })
  .withLoaderFn(async () => {
    console.log('--------------------- API CALL ---------------------');
    // if (Math.random() < 0.3) { // 30% chance to simulate an API error
    //   throw new Error('Simulated API error');
    // }
    return { count: Math.floor(Math.random() * 10) };
  })
  .withPlugin(withLazyTtl<CounterState, CounterStore>(9 * 1000))
  .withPlugin(withProactivePolling<CounterState, CounterStore>(5 * 1000))
  .withPlugin(withLocalStoragePersistence<CounterState, CounterStore>('counter-demo'))
  .withPlugin(withErrorHandler<CounterState, CounterStore>((error, store) => {
    console.error('Error detected in store', error);
    console.log('store', store);
  }))
  .withActions((store: CounterStore) => {
    store.increment = () => {
      store.updateState({ count: store.state().count + 1 });
    };
    store.decrement = () => {
      store.updateState({ count: store.state().count - 1 });
    };
  });

export const STATE_STORE_DEMO_TOKEN = new InjectionToken<CounterStore>('STATE_STORE_DEMO_TOKEN');

export const stateStoreDemoProvider = builder.buildProvider(STATE_STORE_DEMO_TOKEN);