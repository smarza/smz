import { InjectionToken } from '@angular/core';
import { StateStoreBuilder, StateStore, withLocalStoragePersistence, withTtl } from '@smz-ui/store';

export interface CounterState {
  count: number;
}

export interface CounterStore extends StateStore<CounterState, CounterStore> {
  increment(): void;
  decrement(): void;
}

const builder = new StateStoreBuilder<CounterState, CounterStore>()
  .withScopeName('CounterStore')
  .withInitialState({ count: 0 })
  .withLoaderFn(async () => ({ count: Math.floor(Math.random() * 10) }))
  .withPlugin(withTtl<CounterState, CounterStore>(10 * 1000))
  .withPlugin(withLocalStoragePersistence<CounterState, CounterStore>('counter-demo'))
  .withPlugin((store: CounterStore) => {
    store.increment = () => {
      store.updateState({ count: store.state().count + 1 });
    };
    store.decrement = () => {
      store.updateState({ count: store.state().count - 1 });
    };
  });

export const STATE_STORE_DEMO_TOKEN = new InjectionToken<CounterStore>('STATE_STORE_DEMO_TOKEN');

export const stateStoreDemoProvider = builder.buildProvider(STATE_STORE_DEMO_TOKEN);