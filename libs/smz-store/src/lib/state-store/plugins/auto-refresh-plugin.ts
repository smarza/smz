import { effect, Injector, PLATFORM_ID } from '@angular/core';
import { StateStore, StateStorePlugin } from '../state-store';
import { ScopedLogger } from '@smz-ui/core';
import { isPlatformBrowser } from '@angular/common';

// TODO: melhorar a arquitetura dos plugins para que os ciclos de vida sejam tratados de forma mais robusta incluindo o controle de status

const PLUGIN_NAME = 'AutoRefresh';

export function withAutoRefresh<TState>(pollingIntervalMs: number): StateStorePlugin<TState, StateStore<TState>> {
  let destroyRef = () => void 0;
  let sleep = () => void 0;
  let wakeUp = () => void 0;
  let status: 'idle' | 'running' | 'paused' = 'idle';

  const plugin = (store: StateStore<TState>, logger: ScopedLogger, injector: Injector) => {
    const platformId = injector.get(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      logger.warn(`[${PLUGIN_NAME}] Skipping auto refresh on server`);
      return;
    }

    logger.debug(`[${PLUGIN_NAME}] plugin initialized with interval: ${pollingIntervalMs}`);

    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastFetch: number | null = null;

    const tryLoad = async () => {
      try {
        if (store.isLoading()) {
          logger.warn(`[${PLUGIN_NAME}] Store is loading, skipping reload`);
          return;
        }

        await store.reload();
      } catch (err) {
        logger.error(`[${PLUGIN_NAME}] Error reloading store`, err);
      }
    };

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
        tryLoad();
      } else {
        logger.debug(`[${PLUGIN_NAME}] Scheduling auto refresh in ${delay}ms`);
        timer = setTimeout(() => {
          logger.info(`[${PLUGIN_NAME}] Auto refresh timeout reached, reloading data`);
          tryLoad();
        }, delay);
      }
    };

    effect(() => {
      if (status === 'paused') {
        return;
      }

      // Serve para triggar o effect quando o state mudar
      store.stateSignal(); // TODO: o ideal era o isLoaded() mas não está funcionando (computed não está funcionando para o effect)

      if (store.isLoaded()) {
        lastFetch = Date.now();
        logger.debug(`[${PLUGIN_NAME}] Store is loaded, setting lastFetch to ${lastFetch}`);
        schedule();
      } else {
        logger.warn(`[${PLUGIN_NAME}] Store is not loaded (${store.status()}), canceling timers`);
        if (timer) {
          clearTimeout(timer);
          timer = null;
          logger.debug(`[${PLUGIN_NAME}] Auto refresh timer cleared`);
        }
      }

      destroyRef = (() => {
        logger.debug(`[${PLUGIN_NAME}] Auto refresh plugin destroyed`);
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      });

      sleep = () => {
        logger.warn(`[${PLUGIN_NAME}] Auto refresh plugin sleeping`);
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        status = 'paused';
      };

      wakeUp = () => {
        logger.warn(`[${PLUGIN_NAME}] Auto refresh plugin waking up`);
        schedule();
        status = 'idle';
      };
    });
  };

  plugin.destroy = () => destroyRef();

  plugin.sleep = () => sleep();

  plugin.wakeUp = () => wakeUp();

  return plugin;
}
