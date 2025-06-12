import { effect, Injector, PLATFORM_ID } from '@angular/core';
import { StateStore } from './state-store';
import { ScopedLogger } from '@smz-ui/core';
import { isPlatformBrowser } from '@angular/common';

const PLUGIN_NAME = 'TTL';

export function withTtl<T, S extends StateStore<T, unknown>>(ttlMs: number) {
  return (store: S, logger: ScopedLogger, injector: Injector) => {
    const platformId = injector.get(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      logger.warn(`[${PLUGIN_NAME}] Skipping TTL on server`);
      return;
    }

    logger.debug(`[${PLUGIN_NAME}] plugin initialized with ttlMs: ${ttlMs}`);

    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastFetch: number | null = null;

    const schedule = () => {
      if (ttlMs <= 0) {
        logger.debug(`[${PLUGIN_NAME}] TTL is disabled (ttlMs <= 0), skipping schedule`);
        return;
      }

      if (timer) {
        logger.debug(`[${PLUGIN_NAME}] Clearing existing TTL timer`);
        clearTimeout(timer);
        timer = null;
      }

      if (lastFetch === null) {
        logger.debug(`[${PLUGIN_NAME}] No lastFetch timestamp available, skipping schedule`);
        return;
      }

      const elapsed = Date.now() - lastFetch;
      const delay = ttlMs - elapsed;

      logger.debug(`[${PLUGIN_NAME}] TTL calculation: elapsed=${elapsed}ms, delay=${delay}ms`);

      if (delay <= 0) {
        logger.debug(`[${PLUGIN_NAME}] TTL expired immediately, reloading now`);
        store.reload();
      } else {
        logger.debug(`[${PLUGIN_NAME}] Scheduling reload in ${delay}ms`);
        timer = setTimeout(() => {
          logger.debug(`[${PLUGIN_NAME}] TTL timeout reached, reloading data`);
          store.reload();
        }, delay);
      }
    };

    effect(() => {
      // Serve para triggar o effect quando o state mudar
      const s = store.stateSignal(); // TODO: o ideal era o isLoaded() mas não está funcionando (computed não está funcionando para o effect)

      if (store.isLoaded()) {
        lastFetch = Date.now();
        logger.debug(`[${PLUGIN_NAME}] Store is loaded, setting lastFetch to ${lastFetch}`);
        schedule();
      } else {
        logger.debug(`[${PLUGIN_NAME}] Store is not loaded (${store.status()}), canceling timers`);
        if (timer) {
          clearTimeout(timer);
          timer = null;
          logger.debug(`[${PLUGIN_NAME}] TTL timer cleared`);
        }
      }
    });
  };
}
