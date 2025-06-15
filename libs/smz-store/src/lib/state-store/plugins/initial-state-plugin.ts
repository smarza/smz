import { Injector, PLATFORM_ID } from '@angular/core';
import { ScopedLogger } from '@smz-ui/core';
import { isPlatformBrowser } from '@angular/common';
import { StateStore, StateStorePlugin } from '../state-store';

const PLUGIN_NAME = 'INITIAL_STATE';

export function withInitialState<T>(initialState: T): StateStorePlugin<T, StateStore<T>> {

  const plugin = (store: StateStore<T>, logger: ScopedLogger, injector: Injector) => {
    const platformId = injector.get(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      logger.warn(`[${PLUGIN_NAME}] Skipping initial state on server`);
      return;
    }

    logger.debug(`[${PLUGIN_NAME}] Initial state enabled for key: ${initialState}`);

    const setInitialState = () => {
      try {
        if (store.state() === null) {
          logger.debug(`[${PLUGIN_NAME}] Setting initial state`, initialState);
          store.initializeState(initialState);
        }
      } catch (err) {
        logger.error(`[${PLUGIN_NAME}] Failed to set initial state`, err);
      }
    };

    setInitialState();
  };

  plugin.destroy = () => void 0;

  plugin.sleep = () => void 0;

  plugin.wakeUp = () => void 0;

  return plugin;
}
