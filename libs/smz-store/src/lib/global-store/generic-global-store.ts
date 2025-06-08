import { GlobalStore } from './global-store';

export class GenericGlobalStore<T, TStore> extends GlobalStore<T, TStore> {
  private readonly _initialState: T;
  private readonly _loaderFn: () => Promise<Partial<T>>;
  private readonly _ttlMs: number;

  constructor(options: {
    scopeName: string;
    initialState: T;
    loaderFn: () => Promise<Partial<T>>;
    ttlMs?: number;
  }) {
    super(options.scopeName);
    this._initialState = options.initialState;
    this._loaderFn = options.loaderFn;
    this._ttlMs = options.ttlMs ?? 0;
  }

  protected override getInitialState(): T {
    return this._initialState;
  }

  protected override loadFromApi(): Promise<Partial<T>> {
    return this._loaderFn();
  }

  protected override getTtlMs(): number {
    return this._ttlMs;
  }
}

