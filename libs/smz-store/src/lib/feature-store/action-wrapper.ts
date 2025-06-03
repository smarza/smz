/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * Utility to wrap store actions with status and error handling.
 */
export function wrapActionWithStatus<TStore extends { getStatusSignal: () => any; getErrorSignal: () => any }>(
  store: TStore,
  action: (...args: any[]) => Promise<void>
): (...args: any[]) => Promise<void> {
  return async (...args: any[]) => {
    store.getStatusSignal().set('loading');
    store.getErrorSignal().set(null);
    try {
      await action(...args);
      store.getStatusSignal().set('resolved');
    } catch (err) {
      const wrapped = err instanceof Error ? err : new Error(String(err));
      store.getErrorSignal().set(wrapped);
      store.getStatusSignal().set('error');
      throw wrapped;
    }
  };
} 