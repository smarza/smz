import { TestBed } from '@angular/core/testing';
import { Injectable } from '@angular/core';
import { GenericFeatureStore } from '@smz-ui/store';
import { vi } from 'vitest';

interface TestState {
  count: number;
}

@Injectable()
class TestFeatureStore extends GenericFeatureStore<TestState> {
  constructor() {
    super({
      scopeName: 'ttl-store',
      initialState: { count: 0 },
      loaderFn: () => Promise.resolve({ count: 1 }),
      ttlMs: 1000,
    });
  }
}

describe('FeatureStore TTL pause', () => {
  let store: TestFeatureStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TestFeatureStore],
    });
    store = TestBed.inject(TestFeatureStore);
  });

  it('should not create TTL timer while paused', async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(global, 'setTimeout');

    store.pauseTtl();
    await store.reload();
    await vi.runAllTicks();

    expect(spy).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
