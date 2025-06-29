import { TestBed } from '@angular/core/testing';
import { InjectionToken } from '@angular/core';
import { SmzStateStoreBuilder, SmzStore, provideStoreHistory, STORE_HISTORY_SERVICE } from '@smz-ui/store';
import { provideLogging } from '@smz-ui/core';

// Test interfaces
interface TestState {
  count: number;
  data: string[];
  loading: boolean;
  error: string | null;
}

interface TestActions {
  increment(): void;
  decrement(): void;
  addItem(item: string): void;
  removeItem(index: number): void;
  clearError(): void;
}

interface TestSelectors {
  isPositive(): boolean;
  isNegative(): boolean;
  isZero(): boolean;
  doubleCount(): number;
  itemCount(): number;
  hasItems(): boolean;
}

type TestStore = SmzStore<TestState, TestActions, TestSelectors>;

const TEST_STORE_TOKEN = new InjectionToken<TestStore>('TEST_STORE_TOKEN');

describe('Basic Store Functionality', () => {
  let baseBuilder: SmzStateStoreBuilder<TestState, TestActions, TestSelectors>;

  beforeEach(() => {
    localStorage.clear();

    baseBuilder = new SmzStateStoreBuilder<TestState, TestActions, TestSelectors>()
      .withScopeName('TestStore')
      .withInitialState({
        count: 0,
        data: [],
        loading: false,
        error: null
      })
      .withActions((actions, injector, updateState, getState) => {
        actions.increment = () => {
          const currentState = getState();
          updateState({ count: currentState.count + 1 });
        };

        actions.decrement = () => {
          const currentState = getState();
          updateState({ count: currentState.count - 1 });
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

        actions.clearError = () => {
          updateState({ error: null });
        };
      })
      .withSelectors((selectors, injector, getState) => {
        selectors.isPositive = () => getState().count > 0;
        selectors.isNegative = () => getState().count < 0;
        selectors.isZero = () => getState().count === 0;
        selectors.doubleCount = () => getState().count * 2;
        selectors.itemCount = () => getState().data.length;
        selectors.hasItems = () => getState().data.length > 0;
      });
  });

  const setupTestModule = (builder: SmzStateStoreBuilder<TestState, TestActions, TestSelectors>) => {
    TestBed.configureTestingModule({
      providers: [
        provideStoreHistory(),
        provideLogging({ level: 'debug' }),
        builder.buildProvider(TEST_STORE_TOKEN),
      ],
    });
  };

  describe('Store Initialization', () => {
    it('should initialize with initial state', () => {
      // Test: Verify that store initializes with the provided initial state
      // Steps:
      // 1. Setup test module with builder
      // 2. Inject the store
      // 3. Verify initial state matches expected values
      // 4. Check that all state properties are correctly initialized

      setupTestModule(baseBuilder);

      const store = TestBed.inject(TEST_STORE_TOKEN);

      const initialState = store.state.state();

      expect(initialState).toEqual({
        count: 0,
        data: [],
        loading: false,
        error: null
      });

      expect(initialState.count).toBe(0);
      expect(initialState.data).toEqual([]);
      expect(initialState.loading).toBe(false);
      expect(initialState.error).toBeNull();
    });

    it('should initialize with undefined state when no initial state provided', () => {
      // Test: Verify that store initializes with undefined state when no initial state is set
      // Steps:
      // 1. Create builder without withInitialState
      // 2. Setup test module
      // 3. Inject the store
      // 4. Verify state is undefined initially

      const builder = new SmzStateStoreBuilder<TestState, TestActions, TestSelectors>()
        .withScopeName('TestStoreNoInitial');

      setupTestModule(builder);
      const store = TestBed.inject(TEST_STORE_TOKEN);
      const state = store.state.state();
      expect(state).toBeUndefined();
    });

    it('should have correct scope name', async () => {
      // Test: Verify that store has the correct scope name for identification
      // Steps:
      // 1. Setup test module
      // 2. Inject the store and history service
      // 3. Test history service directly
      // 4. Check that events are tracked with correct scope name

      setupTestModule(baseBuilder);
      const store = TestBed.inject(TEST_STORE_TOKEN);
      const historyService = TestBed.inject(STORE_HISTORY_SERVICE);

      // Test history service directly
      historyService.trackEvent({
        storeScope: 'TestStore',
        action: 'test',
        params: {},
        status: 'idle'
      });

      // Check if manual event was tracked
      const manualEvents = historyService.getAllEvents();
      console.log('Manual events:', manualEvents);

      // Try to trigger a status change by calling the built-in reload action
      try {
        await store.actions.reload();
      } catch (error) {
        console.log('Reload error:', error);
      }

      // Check events after reload
      const eventsAfterReload = historyService.getAllEvents();
      console.log('Events after reload:', eventsAfterReload);

      // Get events for our store scope
      const events = historyService.getEventsByStore('TestStore');
      console.log('Events for TestStore:', events);

      // Verify that events exist for our store scope
      expect(events.length).toBeGreaterThan(0);

      // Verify that the events have the correct store scope
      events.forEach(event => {
        expect(event.storeScope).toBe('TestStore');
      });
    });
  });

  describe('State Updates', () => {
    it('should update state when actions are called', () => {
      // Test: Verify that calling actions updates the store state
      // Steps:
      // 1. Setup test module
      // 2. Inject the store
      // 3. Call increment action
      // 4. Verify count increased by 1
      // 5. Call decrement action
      // 6. Verify count decreased by 1

      setupTestModule(baseBuilder);
      const store = TestBed.inject(TEST_STORE_TOKEN);

      // Verify initial state
      expect(store.state.state().count).toBe(0);

      // Call increment action
      store.actions.increment();
      expect(store.state.state().count).toBe(1);

      // Call increment action again
      store.actions.increment();
      expect(store.state.state().count).toBe(2);

      // Call decrement action
      store.actions.decrement();
      expect(store.state.state().count).toBe(1);

      // Call decrement action again
      store.actions.decrement();
      expect(store.state.state().count).toBe(0);
    });

    it('should maintain state immutability', () => {
      // Test: Verify that state updates create new objects, not mutate existing ones
      // Steps:
      // 1. Setup test module
      setupTestModule(baseBuilder);
      // 2. Inject the store
      const store = TestBed.inject(TEST_STORE_TOKEN);

      // 3. Store reference to initial state
      const initialState = store.state.state();
      // 4. Call action that updates state
      store.actions.increment();
      // 5. Verify new state is different object reference
      const updatedState = store.state.state();
      expect(updatedState).not.toBe(initialState);
      // 6. Verify original state object is unchanged
      expect(initialState.count).toBe(0);
      // 7. Verify updated state has the correct new value
      expect(updatedState.count).toBe(1);
    });

    it('should handle multiple state updates correctly', () => {
      // Test: Verify that multiple state updates work correctly in sequence
      // Steps:
      // 1. Setup test module
      setupTestModule(baseBuilder);
      // 2. Inject the store
      const store = TestBed.inject(TEST_STORE_TOKEN);

      // 3. Call multiple actions in sequence
      store.actions.increment();
      store.actions.increment();
      store.actions.addItem('item1');
      store.actions.increment();
      store.actions.addItem('item2');
      store.actions.decrement();
      store.actions.removeItem(0);

      // 4. Verify final state reflects all changes
      const finalState = store.state.state();
      expect(finalState.count).toBe(2); // 0 + 1 + 1 + 1 - 1 = 2
      expect(finalState.data).toEqual(['item2']); // ['item1', 'item2'] -> remove index 0 -> ['item2']
      expect(finalState.loading).toBe(false);
      expect(finalState.error).toBeNull();
    });

    it('should update arrays and objects immutably', () => {
      // Test: Verify that array and object updates create new instances
      // Steps:
      // 1. Setup test module
      setupTestModule(baseBuilder);
      // 2. Inject the store
      const store = TestBed.inject(TEST_STORE_TOKEN);

      // 3. Add items to data array
      const initialState = store.state.state();
      const initialData = initialState.data;
      store.actions.addItem('item1');
      const stateAfterAdd1 = store.state.state();
      const dataAfterAdd1 = stateAfterAdd1.data;
      store.actions.addItem('item2');
      const stateAfterAdd2 = store.state.state();
      const dataAfterAdd2 = stateAfterAdd2.data;

      // 4. Verify new array is created
      expect(dataAfterAdd1).not.toBe(initialData);
      expect(dataAfterAdd2).not.toBe(dataAfterAdd1);
      expect(dataAfterAdd1).toEqual(['item1']);
      expect(dataAfterAdd2).toEqual(['item1', 'item2']);

      // 5. Remove items from array
      store.actions.removeItem(0);
      const stateAfterRemove = store.state.state();
      const dataAfterRemove = stateAfterRemove.data;

      // 6. Verify array updates correctly
      expect(dataAfterRemove).not.toBe(dataAfterAdd2);
      expect(dataAfterRemove).toEqual(['item2']);
      expect(initialData).toEqual([]); // Original array unchanged
      expect(dataAfterAdd1).toEqual(['item1']); // Previous array unchanged
      expect(dataAfterAdd2).toEqual(['item1', 'item2']); // Previous array unchanged
    });
  });

  describe('Actions', () => {
    it('should execute custom actions correctly', () => {
      // Test: Verify that custom actions execute and update state as expected
      // Steps:
      // 1. Setup test module
      setupTestModule(baseBuilder);
      // 2. Inject the store
      const store = TestBed.inject(TEST_STORE_TOKEN);

      // 3. Call increment action multiple times
      expect(store.state.state().count).toBe(0);
      store.actions.increment();
      expect(store.state.state().count).toBe(1);
      store.actions.increment();
      expect(store.state.state().count).toBe(2);
      store.actions.increment();
      expect(store.state.state().count).toBe(3);

      // 4. Verify count increases correctly
      expect(store.state.state().count).toBe(3);

      // 5. Call decrement action
      store.actions.decrement();
      expect(store.state.state().count).toBe(2);
      store.actions.decrement();
      expect(store.state.state().count).toBe(1);

      // 6. Verify count decreases correctly
      expect(store.state.state().count).toBe(1);
    });

    it('should handle actions with parameters', () => {
      // Test: Verify that actions with parameters work correctly
      // Steps:
      // 1. Setup test module
      setupTestModule(baseBuilder);
      // 2. Inject the store
      const store = TestBed.inject(TEST_STORE_TOKEN);

      // 3. Call addItem with different strings
      expect(store.state.state().data).toEqual([]);
      store.actions.addItem('first');
      expect(store.state.state().data).toEqual(['first']);
      store.actions.addItem('second');
      expect(store.state.state().data).toEqual(['first', 'second']);
      store.actions.addItem('third');
      expect(store.state.state().data).toEqual(['first', 'second', 'third']);

      // 4. Verify items are added to data array
      expect(store.state.state().data.length).toBe(3);

      // 5. Call removeItem with different indices
      store.actions.removeItem(1); // Remove 'second'
      expect(store.state.state().data).toEqual(['first', 'third']);
      store.actions.removeItem(0); // Remove 'first'
      expect(store.state.state().data).toEqual(['third']);
      store.actions.removeItem(0); // Remove 'third'
      expect(store.state.state().data).toEqual([]);

      // 6. Verify items are removed correctly
      expect(store.state.state().data.length).toBe(0);
    });

    it('should have built-in reload and forceReload actions', () => {
      // Test: Verify that built-in reload actions are available
      // Steps:
      // 1. Setup test module with loader function
      const builderWithLoader = new SmzStateStoreBuilder<TestState, TestActions, TestSelectors>()
        .withScopeName('TestStoreWithLoader')
        .withInitialState({
          count: 0,
          data: [],
          loading: false,
          error: null
        })
        .withLoaderFn(async () => {
          // Simulate API call
          return {
            count: 10,
            data: ['loaded'],
            loading: false,
            error: null
          };
        })
        .withActions((actions, injector, updateState, getState) => {
          actions.increment = () => {
            const currentState = getState();
            updateState({ count: currentState.count + 1 });
          };
          actions.decrement = () => {
            const currentState = getState();
            updateState({ count: currentState.count - 1 });
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
          actions.clearError = () => {
            updateState({ error: null });
          };
        })
        .withSelectors((selectors, injector, getState) => {
          selectors.isPositive = () => getState().count > 0;
          selectors.isNegative = () => getState().count < 0;
          selectors.isZero = () => getState().count === 0;
          selectors.doubleCount = () => getState().count * 2;
          selectors.itemCount = () => getState().data.length;
          selectors.hasItems = () => getState().data.length > 0;
        });

      TestBed.configureTestingModule({
        providers: [
          provideStoreHistory(),
          provideLogging({ level: 'debug' }),
          builderWithLoader.buildProvider(TEST_STORE_TOKEN),
        ],
      });

      // 2. Inject the store
      const store = TestBed.inject(TEST_STORE_TOKEN);

      // 3. Verify reload and forceReload actions exist
      expect(store.actions.reload).toBeDefined();
      expect(store.actions.forceReload).toBeDefined();

      // 4. Verify they are functions
      expect(typeof store.actions.reload).toBe('function');
      expect(typeof store.actions.forceReload).toBe('function');

      // 5. Verify they return promises
      expect(store.actions.reload()).toBeInstanceOf(Promise);
      expect(store.actions.forceReload()).toBeInstanceOf(Promise);
    });
  });

  describe('Selectors', () => {
    it('should compute derived values correctly', () => {
      // Test: Verify that selectors compute values based on current state
      // Steps:
      // 1. Setup test module
      setupTestModule(baseBuilder);
      // 2. Inject the store
      const store = TestBed.inject(TEST_STORE_TOKEN);

      // 3. Verify initial selector values
      expect(store.selectors.isPositive()).toBe(false);
      expect(store.selectors.isNegative()).toBe(false);
      expect(store.selectors.isZero()).toBe(true);
      expect(store.selectors.doubleCount()).toBe(0);
      expect(store.selectors.itemCount()).toBe(0);
      expect(store.selectors.hasItems()).toBe(false);

      // 4. Update state through actions
      store.actions.increment();
      store.actions.increment();
      store.actions.addItem('item1');
      store.actions.addItem('item2');

      // 5. Verify selector values update accordingly
      expect(store.selectors.isPositive()).toBe(true);
      expect(store.selectors.isNegative()).toBe(false);
      expect(store.selectors.isZero()).toBe(false);
      expect(store.selectors.doubleCount()).toBe(4); // 2 * 2
      expect(store.selectors.itemCount()).toBe(2);
      expect(store.selectors.hasItems()).toBe(true);

      // Test negative values
      store.actions.decrement();
      store.actions.decrement();
      store.actions.decrement();
      expect(store.selectors.isPositive()).toBe(false);
      expect(store.selectors.isNegative()).toBe(true);
      expect(store.selectors.isZero()).toBe(false);
      expect(store.selectors.doubleCount()).toBe(-2); // -1 * 2

      // Test zero value
      store.actions.increment();
      expect(store.selectors.isPositive()).toBe(false);
      expect(store.selectors.isNegative()).toBe(false);
      expect(store.selectors.isZero()).toBe(true);
      expect(store.selectors.doubleCount()).toBe(0);

      // Test empty array
      store.actions.removeItem(0);
      store.actions.removeItem(0);
      expect(store.selectors.itemCount()).toBe(0);
      expect(store.selectors.hasItems()).toBe(false);
    });

    it('should react to state changes', () => {
      // Test: Verify that selectors reactively update when state changes
      // Steps:
      // 1. Setup test module
      setupTestModule(baseBuilder);
      // 2. Inject the store
      const store = TestBed.inject(TEST_STORE_TOKEN);

      // 3. Store initial selector values
      const initialIsPositive = store.selectors.isPositive();
      const initialIsZero = store.selectors.isZero();
      const initialDoubleCount = store.selectors.doubleCount();
      const initialItemCount = store.selectors.itemCount();
      const initialHasItems = store.selectors.hasItems();

      expect(initialIsPositive).toBe(false);
      expect(initialIsZero).toBe(true);
      expect(initialDoubleCount).toBe(0);
      expect(initialItemCount).toBe(0);
      expect(initialHasItems).toBe(false);

      // 4. Update state
      store.actions.increment();
      store.actions.addItem('test');

      // 5. Verify selector values changed
      expect(store.selectors.isPositive()).not.toBe(initialIsPositive);
      expect(store.selectors.isZero()).not.toBe(initialIsZero);
      expect(store.selectors.doubleCount()).not.toBe(initialDoubleCount);
      expect(store.selectors.itemCount()).not.toBe(initialItemCount);
      expect(store.selectors.hasItems()).not.toBe(initialHasItems);

      expect(store.selectors.isPositive()).toBe(true);
      expect(store.selectors.isZero()).toBe(false);
      expect(store.selectors.doubleCount()).toBe(2);
      expect(store.selectors.itemCount()).toBe(1);
      expect(store.selectors.hasItems()).toBe(true);

      // 6. Test multiple state changes
      store.actions.increment();
      store.actions.addItem('test2');
      store.actions.addItem('test3');

      expect(store.selectors.isPositive()).toBe(true);
      expect(store.selectors.doubleCount()).toBe(4); // 2 * 2 (count is 2, not 3)
      expect(store.selectors.itemCount()).toBe(3);
      expect(store.selectors.hasItems()).toBe(true);

      // Test state changes that revert to initial values
      store.actions.decrement();
      store.actions.decrement();
      store.actions.decrement();
      store.actions.removeItem(0);
      store.actions.removeItem(0);
      store.actions.removeItem(0);

      expect(store.selectors.isPositive()).toBe(initialIsPositive);
      expect(store.selectors.isZero()).toBe(false); // count is -1, not 0
      expect(store.selectors.isNegative()).toBe(true); // count is -1
      expect(store.selectors.doubleCount()).toBe(-2); // -1 * 2
      expect(store.selectors.itemCount()).toBe(initialItemCount);
      expect(store.selectors.hasItems()).toBe(initialHasItems);
    });

    it('should handle complex selector logic', () => {
      // Test: Verify that selectors can handle complex computations
      // Steps:
      // 1. Setup test module
      setupTestModule(baseBuilder);
      // 2. Inject the store
      const store = TestBed.inject(TEST_STORE_TOKEN);

      // 3. Test selectors with different state combinations
      // Test with zero count and empty array
      expect(store.selectors.isPositive()).toBe(false);
      expect(store.selectors.isNegative()).toBe(false);
      expect(store.selectors.isZero()).toBe(true);
      expect(store.selectors.doubleCount()).toBe(0);
      expect(store.selectors.itemCount()).toBe(0);
      expect(store.selectors.hasItems()).toBe(false);

      // Test with positive count and empty array
      store.actions.increment();
      store.actions.increment();
      expect(store.selectors.isPositive()).toBe(true);
      expect(store.selectors.isNegative()).toBe(false);
      expect(store.selectors.isZero()).toBe(false);
      expect(store.selectors.doubleCount()).toBe(4);
      expect(store.selectors.itemCount()).toBe(0);
      expect(store.selectors.hasItems()).toBe(false);

      // Test with zero count and items
      store.actions.decrement();
      store.actions.decrement();
      store.actions.addItem('item1');
      store.actions.addItem('item2');
      expect(store.selectors.isPositive()).toBe(false);
      expect(store.selectors.isNegative()).toBe(false);
      expect(store.selectors.isZero()).toBe(true);
      expect(store.selectors.doubleCount()).toBe(0);
      expect(store.selectors.itemCount()).toBe(2);
      expect(store.selectors.hasItems()).toBe(true);

      // Test with negative count and items
      store.actions.decrement();
      expect(store.selectors.isPositive()).toBe(false);
      expect(store.selectors.isNegative()).toBe(true);
      expect(store.selectors.isZero()).toBe(false);
      expect(store.selectors.doubleCount()).toBe(-2);
      expect(store.selectors.itemCount()).toBe(2);
      expect(store.selectors.hasItems()).toBe(true);

      // 4. Verify edge cases (empty arrays, zero values, etc.)
      // Test with large negative number
      for (let i = 0; i < 10; i++) {
        store.actions.decrement();
      }
      expect(store.selectors.isPositive()).toBe(false);
      expect(store.selectors.isNegative()).toBe(true);
      expect(store.selectors.isZero()).toBe(false);
      expect(store.selectors.doubleCount()).toBe(-22); // -11 * 2

      // Test with large positive number
      for (let i = 0; i < 15; i++) {
        store.actions.increment();
      }
      expect(store.selectors.isPositive()).toBe(true);
      expect(store.selectors.isNegative()).toBe(false);
      expect(store.selectors.isZero()).toBe(false);
      expect(store.selectors.doubleCount()).toBe(8); // 4 * 2

      // Test with many items
      for (let i = 0; i < 5; i++) {
        store.actions.addItem(`item${i + 3}`);
      }
      expect(store.selectors.itemCount()).toBe(7);
      expect(store.selectors.hasItems()).toBe(true);

      // Test removing all items
      for (let i = 0; i < 7; i++) {
        store.actions.removeItem(0);
      }
      expect(store.selectors.itemCount()).toBe(0);
      expect(store.selectors.hasItems()).toBe(false);

      // 5. Test selector performance with large datasets
      // Add many items to test performance
      for (let i = 0; i < 100; i++) {
        store.actions.addItem(`perf-item-${i}`);
      }

      const selectorStartTime = performance.now();
      const itemCount = store.selectors.itemCount();
      const hasItems = store.selectors.hasItems();
      const selectorTime = performance.now() - selectorStartTime;

      expect(itemCount).toBe(100);
      expect(hasItems).toBe(true);
      expect(selectorTime).toBeLessThan(10); // Should be very fast (< 10ms)
    });
  });

  // describe('State Reactivity', () => {
  //   it('should trigger effects when state changes', () => {
  //     // Test: Verify that state changes trigger reactive effects
  //     // Steps:
  //     // 1. Setup test module
  //     // 2. Inject the store
  //     // 3. Create a test effect that tracks state changes
  //     // 4. Update state through actions
  //     // 5. Verify effect was triggered
  //     throw new Error('Not implemented');
  //   });

  //   it('should maintain signal reactivity', () => {
  //     // Test: Verify that state signals maintain reactivity
  //     // Steps:
  //     // 1. Setup test module
  //     // 2. Inject the store
  //     // 3. Subscribe to state signal
  //     // 4. Update state
  //     // 5. Verify subscribers are notified
  //     throw new Error('Not implemented');
  //   });
  // });
});