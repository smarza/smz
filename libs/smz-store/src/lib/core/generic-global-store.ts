// src/app/core/generic-global-store.ts
import { GlobalStore } from './global-store';

/**
 * Concrete implementation that receives configuration values via constructor.
 * Used by the GlobalStoreBuilder to dynamically create stores.
 */
export class GenericGlobalStore<
  T extends Record<string, any>,
  P extends Record<string, any> | void,
> extends GlobalStore<T, P> {
  private readonly _initialParams: P;
  private readonly _loaderFn: (params: P) => Promise<Partial<T>>;
  private readonly _ttlMs: number;

  constructor(options: {
    initialState: T;
    initialParams: P;
    loaderFn: (params: P) => Promise<Partial<T>>;
    ttlMs?: number;
  }) {
    super(options.initialState);
    this._initialParams = options.initialParams;
    this._loaderFn = options.loaderFn;
    this._ttlMs = options.ttlMs ?? 0;
    // ensure paramsSignal starts with the provided value
    this.setParams(this._initialParams);
  }

  protected override getInitialParams(): P {
    return this._initialParams;
  }

  protected override loadFromApi(params: P): Promise<Partial<T>> {
    return this._loaderFn(params);
  }

  protected override getTtlMs(): number {
    return this._ttlMs;
  }
}
