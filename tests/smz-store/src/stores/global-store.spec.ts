import { TestBed } from '@angular/core/testing';
import { GlobalStore } from '@smz-ui/store';
import { Injectable } from '@angular/core';

interface TestState {
  count: number;
  name: string;
}

@Injectable()
class TestGlobalStore extends GlobalStore<TestState> {
  constructor() {
    super('test-store');
  }

  protected override getInitialState(): TestState {
    return { count: 0, name: 'initial' };
  }

  protected override loadFromApi(): Promise<Partial<TestState>> {
    return Promise.resolve({ count: 1, name: 'loaded' });
  }
}

describe('GlobalStore', () => {
  let store: TestGlobalStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TestGlobalStore,
        { provide: 'SCOPE_NAME', useValue: 'test-store' }
      ],
    });
    store = TestBed.inject(TestGlobalStore);
  });

  it('should initialize with the initial state', () => {
    expect(store.state()).toEqual({ count: 0, name: 'initial' });
  });

  it('should update state when reload is called', async () => {
    await store.reload();
    expect(store.state()).toEqual({ count: 1, name: 'loaded' });
  });

  it('should handle errors during reload', async () => {
    @Injectable()
    class ErrorTestStore extends GlobalStore<TestState> {
      constructor() {
        super('error-store');
      }

      protected override getInitialState(): TestState {
        return { count: 0, name: 'initial' };
      }

      protected override loadFromApi(): Promise<Partial<TestState>> {
        return Promise.reject(new Error('Test error'));
      }
    }

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ErrorTestStore,
        { provide: 'SCOPE_NAME', useValue: 'error-store' }
      ],
    });
    const errorStore = TestBed.inject(ErrorTestStore);
    await errorStore.reload();
    expect(errorStore.error()).toBeInstanceOf(Error);
    expect(errorStore.error()?.message).toBe('Test error');
    expect(errorStore.status()).toBe('error');
  });

  it('should update state partially', () => {
    store.updateState({ count: 5 });
    expect(store.state()).toEqual({ count: 5, name: 'initial' });
  });
}); 