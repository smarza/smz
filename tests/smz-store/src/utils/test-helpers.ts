import { TestBed } from '@angular/core/testing';
import { InjectionToken } from '@angular/core';
import { SmzStateStoreBuilder, SmzStore, provideStoreHistory } from '@smz-ui/store';
import { provideLogging } from '@smz-ui/core';

/**
 * Common test interfaces for reuse across test files
 */
export interface CommonTestState {
  counter: number;
  data: string[];
  user: { name: string; age: number } | null;
  flags: { isActive: boolean; isVisible: boolean };
  metadata: { version: string; lastUpdated: Date | null };
}

export interface CommonTestActions {
  increment(): void;
  decrement(): void;
  addItem(item: string): void;
  removeItem(index: number): void;
  updateUser(user: { name: string; age: number }): void;
  clearUser(): void;
  toggleFlag(flagName: keyof CommonTestState['flags']): void;
}

export interface CommonTestSelectors {
  isPositive(): boolean;
  isNegative(): boolean;
  isZero(): boolean;
  hasData(): boolean;
  itemCount(): number;
  hasUser(): boolean;
  isActive(): boolean;
}

export type CommonTestStore = SmzStore<CommonTestState, CommonTestActions, CommonTestSelectors>;

/**
 * Common injection token for tests
 */
export const COMMON_STORE_TOKEN = new InjectionToken<CommonTestStore>('COMMON_STORE_TOKEN');

/**
 * Helper function to create a common test store builder
 */
export function createCommonTestBuilder(): SmzStateStoreBuilder<CommonTestState, CommonTestActions, CommonTestSelectors> {
  return new SmzStateStoreBuilder<CommonTestState, CommonTestActions, CommonTestSelectors>()
    .withScopeName('CommonTestStore')
    .withInitialState({
      counter: 0,
      data: [],
      user: null,
      flags: { isActive: false, isVisible: true },
      metadata: { version: '1.0.0', lastUpdated: null }
    })
    .withActions((actions, injector, updateState, getState) => {
      actions.increment = () => {
        const currentState = getState();
        updateState({ counter: currentState.counter + 1 });
      };

      actions.decrement = () => {
        const currentState = getState();
        updateState({ counter: currentState.counter - 1 });
      };

      actions.addItem = (item: string) => {
        const currentState = getState();
        updateState({ data: [...currentState.data, item] });
      };

      actions.removeItem = (index: number) => {
        const currentState = getState();
        const newData = currentState.data.filter((_, i) => i !== index);
        updateState({ data: newData });
      };

      actions.updateUser = (user: { name: string; age: number }) => {
        updateState({ user });
      };

      actions.clearUser = () => {
        updateState({ user: null });
      };

      actions.toggleFlag = (flagName: keyof CommonTestState['flags']) => {
        const currentState = getState();
        updateState({
          flags: {
            ...currentState.flags,
            [flagName]: !currentState.flags[flagName]
          }
        });
      };
    })
    .withSelectors((selectors, injector, getState) => {
      selectors.isPositive = () => getState().counter > 0;
      selectors.isNegative = () => getState().counter < 0;
      selectors.isZero = () => getState().counter === 0;
      selectors.hasData = () => getState().data.length > 0;
      selectors.itemCount = () => getState().data.length;
      selectors.hasUser = () => getState().user !== null;
      selectors.isActive = () => getState().flags.isActive;
    });
}

/**
 * Helper function to setup test module with common configuration
 */
export function setupCommonTestModule<TState, TActions, TSelectors>(
  builder: SmzStateStoreBuilder<TState, TActions, TSelectors>,
  token: InjectionToken<SmzStore<TState, TActions, TSelectors>>
): void {
  TestBed.configureTestingModule({
    providers: [
      provideStoreHistory(),
      provideLogging({ level: 'debug' }),
      builder.buildProvider(token),
    ],
  });
}

/**
 * Helper function to wait for async operations
 */
export function waitForAsync(ms = 50): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper function to wait for store to be loaded
 */
export async function waitForStoreLoad<TState, TActions, TSelectors>(
  store: SmzStore<TState, TActions, TSelectors>
): Promise<void> {
  // Wait for store to be loaded
  while (store.status.isIdle()) {
    await waitForAsync(10);
  }

  // Wait for loading to complete
  while (store.status.isLoading()) {
    await waitForAsync(10);
  }
}

/**
 * Helper function to create test data
 */
export function createTestData(count = 10): string[] {
  return Array.from({ length: count }, (_, i) => `item${i + 1}`);
}

/**
 * Helper function to create test users
 */
export function createTestUsers(count = 5): Array<{ name: string; age: number }> {
  return Array.from({ length: count }, (_, i) => ({
    name: `User ${i + 1}`,
    age: 20 + i * 5
  }));
}

/**
 * Helper function to create performance test data
 */
export function createPerformanceTestData(size: number): CommonTestState {
  return {
    counter: Math.floor(Math.random() * 1000),
    data: createTestData(size),
    user: { name: 'Performance User', age: 25 },
    flags: { isActive: true, isVisible: false },
    metadata: { version: '1.0.0', lastUpdated: new Date() }
  };
}

/**
 * Helper function to measure performance
 */
export function measurePerformance<T>(fn: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return { result, duration: end - start };
}

/**
 * Helper function to create error test scenarios
 */
export function createErrorTestScenarios() {
  return {
    networkError: new Error('Network error'),
    validationError: new Error('Validation failed'),
    timeoutError: new Error('Request timeout'),
    serverError: new Error('Internal server error'),
    customError: new Error('Custom error message'),
  };
}

/**
 * Helper function to check state immutability
 * Returns true if state is immutable (new state is different object)
 */
export function checkStateImmutability<T>(originalState: T, newState: T): boolean {
  return newState !== originalState;
}

/**
 * Helper function to check signal value
 * Returns the current signal value
 */
export function getSignalValue<T>(signal: () => T): T {
  return signal();
}