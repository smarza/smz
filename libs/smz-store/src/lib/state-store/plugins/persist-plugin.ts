import { effect, Injector, PLATFORM_ID } from '@angular/core';
import { ScopedLogger } from '@smz-ui/core';
import { isPlatformBrowser } from '@angular/common';
import { StateStore } from '../state-store';

const PLUGIN_NAME = 'LOCAL_STORAGE_PERSISTENCE';

export function withLocalStoragePersistence<T>(key: string) {
  return (store: StateStore<T>, logger: ScopedLogger, injector: Injector) => {
    const platformId = injector.get(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      logger.warn(`[${PLUGIN_NAME}] Skipping persistence on server`);
      return;
    }

    logger.debug(`[${PLUGIN_NAME}] Persistence enabled for key: ${key}`);

    const storageKey = `smz-state-${key}`;

    const load = () => {
      try {
        const persisted = localStorage.getItem(storageKey);
        if (persisted) {
          store.initializeState(JSON.parse(persisted));
        }
      } catch (err) {
        logger.error(`[${PLUGIN_NAME}] Failed to load persisted state`, err);
      }
    };

    load();

    effect(() => {
      // Serve para triggar o effect quando o state mudar
      const s = store.stateSignal(); // TODO: o ideal era o isLoaded() mas não está funcionando (computed não está funcionando para o effect)

      const state = store.state();
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (err) {
        logger.error(`[${PLUGIN_NAME}] Failed to persist state`, err);
      }
    });
  };
}
