import { ResourceStore } from './resource-store';

/**
 * Concrete class that "industrializes" any generic ResourceStore<T,P>.
 *
 * It simply implements the three abstractions of ResourceStore:
 *   1) getInitialParams()
 *   2) getDefaultValue()
 *   3) loadFromApi(params)
 *
 * All three behaviors are injected via the constructor as values so the
 * builder can create instances with different loaders, initialParams and
 * defaultValue.
 */
export class GenericResourceStore<T, P extends Record<string, any> | void>
  extends ResourceStore<T, P>
{
  // 1) Store configuration values received by the constructor
  private readonly _initialParams: P;
  private readonly _defaultValue: T;
  private readonly _loaderFn: (params: P) => Promise<T>;
  private readonly _ttlMs: number;

  constructor(options: {
    scopeName: string;
    initialParams: P;
    defaultValue: T;
    loaderFn: (params: P) => Promise<T>;
    ttlMs?: number;
  }) {
    // Calls the ResourceStore constructor (which already sets up signals, effects and logger)
    super(options.scopeName);
    this._initialParams = options.initialParams;
    this._defaultValue = options.defaultValue;
    this._loaderFn = options.loaderFn;
    this._ttlMs = options.ttlMs ?? 0;
  }

  /** 1) Initial parameter that drives the resource */
  protected override getInitialParams(): P {
    return this._initialParams;
  }

  /** 2) Default value exposed by the computed value until the loader returns something concrete */
  protected override getDefaultValue(): T {
    return this._defaultValue;
  }

  /** 3) The actual function that performs the API call (can be any Promise<T>) */
  protected override loadFromApi(params: P): Promise<T> {
    return this._loaderFn(params);
  }

  /** 4) If TTL (revalidation) is desired, configure it in the builder; by default it is zero */
  protected override getTtlMs(): number {
    return this._ttlMs;
  }

  /**
   * Note: everything else (status, value, error signals, logging effects, TTL, etc)
   * is already implemented in the ResourceStore superclass. Here we only need
   * to provide the abstract functions.
   */
}
