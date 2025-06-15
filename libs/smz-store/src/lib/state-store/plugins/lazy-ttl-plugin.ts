import { Injector, PLATFORM_ID } from '@angular/core';
import { ScopedLogger } from '@smz-ui/core';
import { isPlatformBrowser } from '@angular/common';
import { StateStore } from '../state-store';

const PLUGIN_NAME = 'LazyTtl';

export function withLazyTtl<T>(ttlMs: number) {
  return (store: StateStore<T>, logger: ScopedLogger, injector: Injector) => {
    const platformId = injector.get(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      logger.warn(`[${PLUGIN_NAME}] Skipping lazy TTL on server`);
      return;
    }

    logger.debug(`[${PLUGIN_NAME}] plugin initialized with ttlMs: ${ttlMs}`);

    let lastFetch: number | null = null;

    const originalAfterReload = store.afterReload.bind(store);
    store.afterReload = async (wasSkipped: boolean) => {
      if (!wasSkipped) {
        lastFetch = Date.now();
        logger.debug(`[${PLUGIN_NAME}] Store is loaded, setting lastFetch to ${lastFetch}`);
      }

      return originalAfterReload(wasSkipped);
    };

    // Override beforeReload to check TTL
    const originalBeforeReload = store.beforeReload.bind(store);
    store.beforeReload = async () => {
      if (lastFetch === null) {
        logger.debug(`[${PLUGIN_NAME}] No lastFetch timestamp available, proceeding with reload`);
        return originalBeforeReload();
      }

      const elapsed = Date.now() - lastFetch;
      logger.debug(`[${PLUGIN_NAME}] TTL check: elapsed=${elapsed}ms, ttl=${ttlMs}ms`);

      if (elapsed < ttlMs) {
        logger.info(`[${PLUGIN_NAME}] TTL not expired, skipping reload`);
        return false; // Skip the API call
      }

      return originalBeforeReload();
    };
  };
}