import { effect, Injector, PLATFORM_ID } from '@angular/core';
import { StateStore } from '../state-store';
import { ScopedLogger } from '@smz-ui/core';
import { isPlatformBrowser } from '@angular/common';

const PLUGIN_NAME = 'AutoRefresh';

export function withAutoRefresh<T>(pollingIntervalMs: number) {
  return (store: StateStore<T>, logger: ScopedLogger, injector: Injector) => {
    const platformId = injector.get(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      logger.warn(`[${PLUGIN_NAME}] Skipping auto refresh on server`);
      return;
    }

    logger.debug(`[${PLUGIN_NAME}] plugin initialized with interval: ${pollingIntervalMs}`);

    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastFetch: number | null = null;

    const schedule = () => {
      if (pollingIntervalMs <= 0) {
        logger.debug(`[${PLUGIN_NAME}] Auto refresh is disabled (interval <= 0), skipping schedule`);
        return;
      }

      if (timer) {
        logger.debug(`[${PLUGIN_NAME}] Clearing existing auto refresh timer`);
        clearTimeout(timer);
        timer = null;
      }

      if (lastFetch === null) {
        logger.debug(`[${PLUGIN_NAME}] No last fetch timestamp available, skipping schedule`);
        return;
      }

      const elapsed = Date.now() - lastFetch;
      const delay = pollingIntervalMs - elapsed;

      logger.debug(`[${PLUGIN_NAME}] Auto refresh calculation: elapsed=${elapsed}ms, delay=${delay}ms`);

      if (delay <= 0) {
        logger.debug(`[${PLUGIN_NAME}] Auto refresh interval expired immediately, reloading now`);
        store.reload();
      } else {
        logger.debug(`[${PLUGIN_NAME}] Scheduling auto refresh in ${delay}ms`);
        timer = setTimeout(() => {
          logger.info(`[${PLUGIN_NAME}] Auto refresh timeout reached, reloading data`);
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
          logger.debug(`[${PLUGIN_NAME}] Auto refresh timer cleared`);
        }
      }
    });
  };
}
