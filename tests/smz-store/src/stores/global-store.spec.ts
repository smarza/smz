import { TestBed } from '@angular/core/testing';
import { GenericGlobalStore, GlobalStoreBuilder, provideStoreHistory } from '@smz-ui/store';
import { InjectionToken } from '@angular/core';
import { provideLogging } from '@smz-ui/core';
import { beforeEach } from 'vitest';

interface TestState {
  count: number;
  name: string;
}

// Test-specific subclass that exposes persistState for testing
class TestableGlobalStore<T, TStore> extends GenericGlobalStore<T, TStore> {
  public override persistState(state: T): void {
    super.persistState(state);
  }
}

describe('GlobalStore', () => {
  let store: TestableGlobalStore<TestState, never>;
  let testCount = 0;

  beforeEach(() => {
    testCount++;
    localStorage.clear();

    const STORE_TOKEN = `STORE_${testCount}_TOKEN`;
    const STORE_INJECTION_TOKEN = new InjectionToken<TestableGlobalStore<TestState, never>>(STORE_TOKEN);

    TestBed.configureTestingModule({
      providers: [
        provideStoreHistory(),
        provideLogging({ level: 'debug' }),
        new GlobalStoreBuilder<TestState, never>()
          .withInitialState({ count: 0, name: 'initial' })
          .withPersistToLocalStorage(true)
          .withLoaderFn(() => Promise.resolve({ count: 1, name: 'loaded' }))
          .buildProvider(STORE_INJECTION_TOKEN)
        ],
    });

    store = TestBed.inject(STORE_INJECTION_TOKEN) as TestableGlobalStore<TestState, never>;
  });

  it('should initialize with the initial state', () => {
    expect(store.state()).toEqual({ count: 0, name: 'initial' });
  });

  it('should update state when reload is called', async () => {
    await store.reload();
    expect(store.state()).toEqual({ count: 1, name: 'loaded' });
  });

  it('should update state partially', () => {
    store.updateState({ count: 5 });
    expect(store.state().count).toEqual(5);
  });

  it('should call persistState after state update', () => {
    const persistStateSpy = vi.spyOn(store, 'persistState');

    store.updateState({ count: 50, name: 'updated' });

    // Change detection to flush the Service Effects
    TestBed.tick();

    expect(persistStateSpy).toHaveBeenCalled();

    expect(persistStateSpy).toHaveBeenLastCalledWith(expect.objectContaining({
      count: 50,
      name: 'updated'
    }));
  });
});