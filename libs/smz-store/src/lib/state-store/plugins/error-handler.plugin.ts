import { effect, Injector, PLATFORM_ID } from '@angular/core';
import { ScopedLogger } from '@smz-ui/core';
import { StateStore } from '../state-store';
import { BaseStateStore } from '../base-state-store';
import { isPlatformBrowser } from '@angular/common';

const PLUGIN_NAME = 'ErrorHandler';

export type ErrorHandlerCallback = (error: Error, store: BaseStateStore<any>) => void;

export function withErrorHandler<T, S extends BaseStateStore<T>>(onError: ErrorHandlerCallback) {
  return (store: StateStore<T, S>, logger: ScopedLogger, injector: Injector) => {
    logger.debug(`[${PLUGIN_NAME}] plugin initialized`);

    const platformId = injector.get(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      logger.warn(`[${PLUGIN_NAME}] Skipping lazy TTL on server`);
      return;
    }

    effect(() => {
      const error = store.error();
      const status = store.status();

      if (status === 'error' && error) {
        logger.debug(`[${PLUGIN_NAME}] Store error detected`, error);
        onError(error, store);
      }
    });
  };
}
