import { bench, describe } from 'vitest';
import { GenericResourceStore } from '@smz-ui/store';

class BenchStore extends GenericResourceStore<number, { id: number }> {
  constructor() {
    super({
      scopeName: 'bench-store',
      initialParams: { id: 0 },
      defaultValue: 0,
      loaderFn: async (params) => params.id,
      ttlMs: 5,
    });
  }
}

const store = new BenchStore();

describe('Store operation benchmarks', () => {
  bench('reload', async () => {
    store.reload();
    await Promise.resolve();
  });

  let counter = 0;
  bench('update params', () => {
    store.setParams({ id: ++counter });
  });

  bench('ttl reload', async () => {
    store.reload();
    await new Promise((r) => setTimeout(r, 6));
  });
});

