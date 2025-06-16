import { InjectionToken } from '@angular/core';
import { SmzStateStoreBuilder, withLocalStoragePersistence, withAutoRefresh, withLazyCache, withErrorHandler, SmzStore } from '@smz-ui/store';
import { CounterApiService } from './counter-api.service';
import { CustomErrorHandlerService } from './custom-error-handler';

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
  .withPlugin(withErrorHandler((error, injector) => injector.get(CustomErrorHandlerService).handleError(error)))
  .withActions((actions, injector, updateState, getState) => {

    // Increment count by 1
    actions.increment = () => {
      updateState({ count: getState().count + 1 });
    };

    // Decrement count by 1
    actions.decrement = () => {
      updateState({ count: getState().count - 1 });
    };

  })
  .withSelectors((selectors, injector, getState) => {
    // Check if count is positive
    selectors.isPositive = () => getState().count > 0;

    // Check if count is negative
    selectors.isNegative = () => getState().count < 0;

    // Check if count is zero
    selectors.isZero = () => getState().count === 0;

    // Double the count
    selectors.doubleCount = () => getState().count * 2;
  });

export const STATE_STORE_DEMO_TOKEN = new InjectionToken<CounterStore>('STATE_STORE_DEMO_TOKEN');

export const stateStoreDemoProvider = builder.buildProvider(STATE_STORE_DEMO_TOKEN);