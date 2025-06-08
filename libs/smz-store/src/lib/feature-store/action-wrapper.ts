/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * Utility to wrap store actions with status and error handling.
 */
export function wrapActionWithStatus<TStore extends {
  getStatusSignal: () => any;
  getErrorSignal: () => any;
  getActionStatusSignal?: (key: string) => any;
}>(
  store: TStore,
  action: (...args: any[]) => Promise<void>,
  key: string
): (...args: any[]) => Promise<void> {
  return async (...args: any[]) => {
    console.log('wrapActionWithStatus _+++++++++++++', key);
    console.log('store', store);
    console.log('action', action);
    console.log('args', args);
    const status = store.getActionStatusSignal?.(key) ?? store.getStatusSignal();
    status.set('loading');
    store.getErrorSignal().set(null);
    try {
      await action(...args);
      status.set('resolved');
    } catch (err) {
      const wrapped = err instanceof Error ? err : new Error(String(err));
      store.getErrorSignal().set(wrapped);
      status.set('error');
      throw wrapped;
    }
  };
}
