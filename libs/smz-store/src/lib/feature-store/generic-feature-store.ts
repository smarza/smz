import { FeatureStore } from './feature-store';

export class GenericFeatureStore<TState, TStore> extends FeatureStore<TState, TStore> {
  private readonly _initialState: TState;
  private readonly _loaderFn: () => Promise<Partial<TState>>;
  private readonly _ttlMs: number;

  constructor(options: { scopeName: string; initialState: TState; loaderFn: () => Promise<Partial<TState>>; ttlMs?: number }) {
    super(options.scopeName);
    this._initialState = options.initialState;
    this._loaderFn = options.loaderFn;
    this._ttlMs = options.ttlMs ?? 0;
  }

  protected override getInitialState(): TState {
    return this._initialState;
  }

  protected override loadFromApi(): Promise<Partial<TState>> {
    return this._loaderFn();
  }

  protected override getTtlMs(): number {
    return this._ttlMs;
  }
}
