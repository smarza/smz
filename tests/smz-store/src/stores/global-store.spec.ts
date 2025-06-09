import { TestBed } from '@angular/core/testing';
import { GenericGlobalStore, GlobalStore, GlobalStoreBuilder, provideStoreHistory } from '@smz-ui/store';
import { Injectable, InjectionToken } from '@angular/core';
import { provideLogging } from '@smz-ui/core';

interface TestState {
  count: number;
  name: string;
}

const storeBuilder = new GlobalStoreBuilder<TestState, never>()
  .withInitialState({ count: 0, name: 'initial' })
  .withLoaderFn(() => Promise.resolve({ count: 1, name: 'loaded' }));

const STORE_TOKEN = new InjectionToken<GenericGlobalStore<TestState, never>>('STORE_TOKEN');

const storeProvider = storeBuilder.buildProvider(STORE_TOKEN);

describe('GlobalStore', () => {
  let store: GenericGlobalStore<TestState, never>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideStoreHistory(),
        provideLogging({
          level: 'debug',
          restrictedScopes: undefined
        }),
        storeProvider
      ],
    });
    store = TestBed.inject(STORE_TOKEN);
  });

  it('should initialize with the initial state', () => {
    console.log('store.state() 1', store.state());
    expect(store.state()).toEqual({ count: 1, name: 'loaded' });
  });

  it('should update state when reload is called', async () => {
    await store.reload();
    console.log('store.state() 2', store.state());
    expect(store.state()).toEqual({ count: 1, name: 'loaded' });
  });

  // it('should handle errors during reload', async () => {
  //   @Injectable()
  //   class ErrorTestStore extends GlobalStore<TestState> {
  //     constructor() {
  //       super('error-store');
  //     }

  //     protected override getInitialState(): TestState {
  //       return { count: 0, name: 'initial' };
  //     }

  //     protected override loadFromApi(): Promise<Partial<TestState>> {
  //       return Promise.reject(new Error('Test error'));
  //     }
  //   }

  //   TestBed.resetTestingModule();
  //   TestBed.configureTestingModule({
  //     providers: [
  //       ErrorTestStore,
  //       { provide: 'SCOPE_NAME', useValue: 'error-store' }
  //     ],
  //   });
  //   const errorStore = TestBed.inject(ErrorTestStore);
  //   await errorStore.reload();
  //   expect(errorStore.error()).toBeInstanceOf(Error);
  //   expect(errorStore.error()?.message).toBe('Test error');
  //   expect(errorStore.status()).toBe('error');
  // });

  it('should update state partially', () => {
    store.updateState({ count: 5 });
    expect(store.state().count).toEqual(5);
  });
});