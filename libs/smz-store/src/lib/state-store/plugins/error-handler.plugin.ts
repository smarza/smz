import { effect, Injector, PLATFORM_ID } from '@angular/core';
import { ScopedLogger } from '@smz-ui/core';
import { isPlatformBrowser } from '@angular/common';
import { StateStore, StateStorePlugin } from '../state-store';
import { StoreError } from '../error-handler';

const PLUGIN_NAME = 'ErrorHandler';

export type ErrorHandlerCallback = (error: StoreError, injector: Injector) => void;

export function withErrorHandler<TState>(onError: ErrorHandlerCallback): StateStorePlugin<TState, StateStore<TState>> {
  const plugin = (store: StateStore<TState>, logger: ScopedLogger, injector: Injector) => {
    logger.debug(`[${PLUGIN_NAME}] plugin initialized`);

    const platformId = injector.get(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      logger.warn(`[${PLUGIN_NAME}] Skipping error handler on server`);
      return;
    }

    effect(() => {
      const error = store.error();
      const isError = store.isError();

      if (isError && error) {
        logger.debug(`[${PLUGIN_NAME}] Store error detected`, error);
        onError(error, injector);
      }
    });
  };

  plugin.destroy = () => void 0;

  plugin.sleep = () => void 0;

  plugin.wakeUp = () => void 0;

  return plugin;
}
