import { Injector, PLATFORM_ID } from '@angular/core';
import { ScopedLogger } from '@smz-ui/core';
import { isPlatformBrowser } from '@angular/common';
import { StateStore } from '../state-store';

const PLUGIN_NAME = 'INITIAL_STATE';

export function withInitialState<T>(initialState: T) {
  return (store: StateStore<T>, logger: ScopedLogger, injector: Injector) => {
    const platformId = injector.get(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      logger.warn(`[${PLUGIN_NAME}] Skipping initial state on server`);
      return;
    }

    logger.debug(`[${PLUGIN_NAME}] Initial state enabled for key: ${initialState}`);

    const setInitialState = () => {
      try {
        if (store.state() === null) {
          store.initializeState(initialState);
        }
      } catch (err) {
        logger.error(`[${PLUGIN_NAME}] Failed to set initial state`, err);
      }
    };

    setInitialState();
  };
}
