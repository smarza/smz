import { TestBed } from '@angular/core/testing';
import { provideStoreHistory, SmzStateStoreBuilder, SmzStore } from '@smz-ui/store';
import { InjectionToken } from '@angular/core';
import { provideLogging } from '@smz-ui/core';
import { beforeEach } from 'vitest';

interface TestState {
  count: number;
}

interface TestActions {
  increment(): void;
  decrement(): void;
}

interface TestSelectors {
  isPositive(): boolean;
  isNegative(): boolean;
  isZero(): boolean;
  doubleCount(): number;
}

type TestStore = SmzStore<TestState, TestActions, TestSelectors>;

const baseBuilder = new SmzStateStoreBuilder<TestState, TestActions, TestSelectors>()
  .withScopeName('TestStore')
  .withLoaderFn(async () => Promise.resolve({ count: 1 }));

const TEST_STORE_TOKEN = new InjectionToken<TestStore>('TEST_STORE_TOKEN');

const mockStore = (builder: SmzStateStoreBuilder<TestState, TestActions, TestSelectors>) => {
  TestBed.configureTestingModule({
    providers: [
      provideStoreHistory(),
      provideLogging({ level: 'debug' }),
      builder.buildProvider(TEST_STORE_TOKEN),
      ],
  });
};

describe('GlobalStore', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with no state', () => {
    mockStore(baseBuilder);
    const store = TestBed.inject(TEST_STORE_TOKEN);
    expect(store.state.state()).toBeUndefined();
  });

  it('should initialize with the initial state', () => {
    const builder = baseBuilder.withInitialState({ count: 0 });
    mockStore(builder);
    const store = TestBed.inject(TEST_STORE_TOKEN);
    expect(store.state.state().count).toEqual(0);
  });

  it('should have state after calling forceReload', async () => {
    const randomCount = Math.floor(Math.random() * 100);
    const builder = baseBuilder.withLoaderFn(async () => Promise.resolve({ count: randomCount }));
    mockStore(builder);
    const store = TestBed.inject(TEST_STORE_TOKEN);
    await store.actions.forceReload();
    expect(store.state.state().count).toEqual(randomCount);
  });

  it('should have state after calling reload', async () => {
    const randomCount = Math.floor(Math.random() * 100);
    const builder = baseBuilder.withLoaderFn(async () => Promise.resolve({ count: randomCount }));
    mockStore(builder);
    const store = TestBed.inject(TEST_STORE_TOKEN);
    await store.actions.reload();
    expect(store.state.state().count).toEqual(randomCount);
  });

});