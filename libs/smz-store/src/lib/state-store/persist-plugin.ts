import { effect } from '@angular/core';
import { StateStore } from './state-store';

export function withLocalStoragePersistence<T, S extends StateStore<T, any>>(key: string) {
  return (store: S) => {
    const storageKey = `smz-state-${key}`;

    const load = () => {
      try {
        const persisted = localStorage.getItem(storageKey);
        if (persisted) {
          store.updateState(JSON.parse(persisted));
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load persisted state', err);
      }
    };

    load();

    effect(() => {
      const state = store.state();
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to persist state', err);
      }
    });
  };
}
