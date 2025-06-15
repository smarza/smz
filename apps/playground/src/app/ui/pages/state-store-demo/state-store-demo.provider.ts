import { InjectionToken } from '@angular/core';
import { SmzStateStoreBuilder, withLocalStoragePersistence, withAutoRefresh, withLazyCache, withErrorHandler, SmzStore } from '@smz-ui/store';
import { CounterApiService } from './counter-api.service';

interface CounterState {
  count: number;
}

interface CounterActions {
  increment(): void;
  decrement(): void;
}

interface CounterSelectors {
  isPositive(): boolean;
  isNegative(): boolean;
  isZero(): boolean;
  doubleCount(): number;
}

export type CounterStore = SmzStore<CounterState, CounterActions, CounterSelectors>;

const builder = new SmzStateStoreBuilder<CounterState, CounterActions, CounterSelectors>()
  .withScopeName('CounterStore')
  .withInitialState({ count: 0 })
  .withLoaderFn(async (injector) => injector.get(CounterApiService).getRandomCount())
  .withPlugin(withLazyCache(9 * 1000))
  .withPlugin(withAutoRefresh(5 * 1000))
  .withPlugin(withLocalStoragePersistence('counter-demo'))
  .withPlugin(withErrorHandler((error) => {
    console.log('Error detected in CounterStore', error);
    console.error('Error detected in CounterStore');
  }))
  .withActions((actions, env, updateState, getState) => {
    actions.increment = () => {
      updateState({ count: getState().count + 1 });
    };
    actions.decrement = () => {
      updateState({ count: getState().count - 1 });
    };
  })
  .withSelectors((selectors, env, getState) => {
    selectors.isPositive = () => getState().count > 0;
    selectors.isNegative = () => getState().count < 0;
    selectors.isZero = () => getState().count === 0;
    selectors.doubleCount = () => getState().count * 2;
  });

export const STATE_STORE_DEMO_TOKEN = new InjectionToken<CounterStore>('STATE_STORE_DEMO_TOKEN');

export const stateStoreDemoProvider = builder.buildProvider(STATE_STORE_DEMO_TOKEN);