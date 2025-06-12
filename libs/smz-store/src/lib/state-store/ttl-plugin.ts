import { effect } from '@angular/core';
import { StateStore } from './state-store';

export function withTtl<T, S extends StateStore<T, any>>(ttlMs: number) {
  return (store: S) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastFetch: number | null = null;

    const schedule = () => {
      if (ttlMs <= 0) return;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (lastFetch === null) return;
      const elapsed = Date.now() - lastFetch;
      const delay = ttlMs - elapsed;
      if (delay <= 0) {
        store.reload();
      } else {
        timer = setTimeout(() => {
          store.reload();
        }, delay);
      }
    };

    effect(() => {
      if (store.isResolved()) {
        lastFetch = Date.now();
        schedule();
      } else {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      }
    });
  };
}
