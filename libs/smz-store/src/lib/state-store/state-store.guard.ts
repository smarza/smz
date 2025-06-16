import { inject, InjectionToken } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SmzStore } from './base-state-store';
import { LOGGING_SERVICE } from '@smz-ui/core';

/**
 * Creates a guard that will check if the state store data is loaded and valid before activating the route.
 * The guard will:
 * 1. Check if the store is resolved
 * 2. If not resolved, try to reload the data
 * 3. Allow activation if data is valid
 * 4. Block activation if data is invalid or error occurs
 */
export function createStateStoreGuard<TState, TActions, TSelectors>(
  storeToken: InjectionToken<SmzStore<TState, TActions, TSelectors>>,
  redirectTo: string | undefined = undefined
): CanActivateFn {

  return async () => {
    const store = inject(storeToken) as SmzStore<TState, TActions, TSelectors>;
    const logger = inject(LOGGING_SERVICE).scoped('StateStoreGuard');
    const router = inject(Router);

    const handleErrorRedirect = (): void => {
      if (redirectTo) {
        router.navigateByUrl(redirectTo);
      }
    }

    // If store is already resolved, allow activation
    if (store.status.isResolved()) {
      logger.debug('Store is already resolved, allowing activation');
      return true;
    }

    // If store is in error state, block activation
    if (store.status.isError()) {
      logger.warn('Store is in error state, blocking activation', store.error.error());
      handleErrorRedirect();
      return false;
    }

    // Try to reload the data
    logger.debug('Store needs reload, attempting to load data');
    await store.actions.reload();

    // Check final state after reload
    if (store.status.isResolved()) {
      logger.debug('Store reloaded successfully, allowing activation');
      return true;
    }

    logger.warn('Store failed to load data, blocking activation', store.error.error());
    handleErrorRedirect();
    return false;
  };
}

