import { GlobalStore } from './global-store';

export class GenericGlobalStore<T, TStore> extends GlobalStore<T, TStore> {
  public readonly id = Math.random().toString(36).substring(2, 15);
  private readonly _initialState: T;
  private readonly _loaderFn: () => Promise<Partial<T>>;
  private readonly _ttlMs: number;
  private readonly _persistToLocalStorage: boolean;

  constructor(options: {
    scopeName: string;
    initialState: T;
    loaderFn: () => Promise<Partial<T>>;
    ttlMs?: number;
    persistToLocalStorage?: boolean;
  }) {
    super(options.scopeName);
    this._initialState = options.initialState;
    this._loaderFn = options.loaderFn;
    this._ttlMs = options.ttlMs ?? 0;
    this._persistToLocalStorage = options.persistToLocalStorage ?? false;
  }

  public override initializeState(): void {

    // Load persisted state if enabled
    if (this._persistToLocalStorage) {
      const persistedState = this.loadPersistedState();
      if (persistedState) {
        this.updateState(persistedState);
        return;
      }
    }

    this.updateState(this._initialState);
  }

  protected override loadFromApi(): Promise<Partial<T>> {
    return this._loaderFn();
  }

  protected override getTtlMs(): number {
    return this._ttlMs;
  }

  private getStorageKey(): string {
    return `smz-store-${this.scopeName}`;
  }

  protected override persistState(state: T): void {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(state));
    } catch (error) {
      this.logger.error('Failed to persist state to localStorage', error);
    }
  }

  protected override loadPersistedState(): T | null {
    try {
      const persisted = localStorage.getItem(this.getStorageKey());
      return persisted ? JSON.parse(persisted) : null;
    } catch (error) {
      this.logger.error('Failed to load persisted state from localStorage', error);
      return null;
    }
  }

  protected override clearPersistedState(): void {
    localStorage.removeItem(this.getStorageKey());
  }
}

