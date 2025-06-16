import { inject, InjectionToken } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { SmzStore } from './base-state-store';
import { LOGGING_SERVICE } from '@smz-ui/core';

/**
 * Creates a resolver that will reload the state store data before activating the route.
 * The resolver will:
 * 1. Reload the store data
 * 2. Resolve with true if successful
 * 3. Reject with the store error if failed
 */
export function createStateStoreResolver<TState, TActions, TSelectors>(
  storeToken: InjectionToken<SmzStore<TState, TActions, TSelectors>>,
  redirectTo: string | undefined = undefined
): ResolveFn<boolean> {
  return async () => {
    const store = inject(storeToken) as SmzStore<TState, TActions, TSelectors>;
    const logger = inject(LOGGING_SERVICE).scoped('StateStoreResolver');
    const router = inject(Router);

    const handleErrorRedirect = (): void => {
      if (redirectTo) {
        router.navigateByUrl(redirectTo);
      }
    }

    logger.debug('The Resolver is calling the store to reload');
    await store.actions.reload();

    if (store.status.isResolved()) {
      logger.debug('The store is resolved');
      return true;
    }

    logger.warn('The store is not resolved', store.error.error());
    handleErrorRedirect();
    return false;
  };
}