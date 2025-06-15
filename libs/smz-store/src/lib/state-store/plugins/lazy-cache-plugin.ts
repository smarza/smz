import { Injector, PLATFORM_ID } from '@angular/core';
import { ScopedLogger } from '@smz-ui/core';
import { isPlatformBrowser } from '@angular/common';
import { StateStore } from '../state-store';

const PLUGIN_NAME = 'LazyCache';

export function withLazyCache<T>(ttlMs: number) {
  return (store: StateStore<T>, logger: ScopedLogger, injector: Injector) => {
    const platformId = injector.get(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      logger.warn(`[${PLUGIN_NAME}] Skipping lazy cache on server`);
      return;
    }

    logger.debug(`[${PLUGIN_NAME}] plugin initialized with cache ttl: ${ttlMs}`);

    let lastFetch: number | null = null;

    const originalAfterReload = store.afterLoad.bind(store);
    store.afterLoad = async (wasSkipped: boolean) => {
      if (!wasSkipped) {
        lastFetch = Date.now();
        logger.debug(`[${PLUGIN_NAME}] Store is loaded, setting lastFetch to ${lastFetch}`);
      }

      return originalAfterReload(wasSkipped);
    };

    // Override beforeReload to check TTL
    const originalBeforeReload = store.beforeLoad.bind(store);
    store.beforeLoad = async () => {
      if (lastFetch === null) {
        logger.debug(`[${PLUGIN_NAME}] No last fetch timestamp available, proceeding with reload`);
        return originalBeforeReload();
      }

      const elapsed = Date.now() - lastFetch;
      logger.debug(`[${PLUGIN_NAME}] Cache check: elapsed=${elapsed}ms, ttl=${ttlMs}ms`);

      if (elapsed < ttlMs) {
        logger.info(`[${PLUGIN_NAME}] Cache not expired, skipping reload`);
        return false; // Skip the API call
      }

      return originalBeforeReload();
    };
  };
}