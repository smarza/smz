// src/app/core/global-store.ts
import {
  Injectable,
  signal,
  computed,
  effect,
  Signal,
  WritableSignal,
} from '@angular/core';
import { resource, ResourceRef } from '@angular/core';
import { ResourceStatus } from '@angular/core';
import { BaseStore } from './base-store';

/**
 * Generic base class for application wide stores that maintain a state object T.
 * Optionally loads additional data from an API based on parameter object P.
 *
 * T = shape of the entire state model (e.g. AuthStateModel)
 * P = params object that drives API loading. Use P = void if no params.
 */
@Injectable({ providedIn: 'root' })
export abstract class GlobalStore<
  T extends Record<string, any>,
  P extends Record<string, any> | void,
> extends BaseStore<T> {
  // 1) params for the API loader
  protected readonly paramsSignal: WritableSignal<P> = signal<P>(
    this._deepFreezeParams(this.getInitialParams()),
  );

  // 2) resource used to load partial state from an API
  protected readonly resourceRef: ResourceRef<Partial<T>> = resource<
    Partial<T>,
    P
  >({
    params: () => this.paramsSignal(),
    loader: async ({ params }) => {
      const logger = this.logger;
      logger.info(
        `${this.constructor.name}: loader invoked with params=`,
        params,
      );
      try {
        const result = await this.loadFromApi(params as P);
        this._updateLastFetch();
        return Object.freeze(result as Partial<T>);
      } catch (err: unknown) {
        const wrapped: Error =
          err instanceof Error
            ? err
            : new Error(
                typeof err === 'object' ? JSON.stringify(err) : String(err),
              );
        logger.error(`${this.constructor.name}: loader error`, wrapped);
        this.errorSignal.set(wrapped);
        return {} as Partial<T>;
      }
    },
    defaultValue: {} as Partial<T>,
  });

  // 3) raw signals from resource
  private readonly valueRaw: Signal<Partial<T>> = computed(() =>
    this.resourceRef.value(),
  );
  private readonly statusRaw: Signal<ResourceStatus> = computed(() =>
    this.resourceRef.status(),
  );

  // 4) error signal
  private readonly errorSignal: WritableSignal<Error | null> =
    signal<Error | null>(null);

  /** Combined status taking errorSignal into account */
  readonly status: Signal<ResourceStatus> = computed(() =>
    this.errorSignal() ? 'error' : this.statusRaw(),
  );
  readonly isLoading: Signal<boolean> = computed(
    () => this.status() === 'loading',
  );
  readonly isError: Signal<boolean> = computed(() => this.status() === 'error');
  readonly isResolved: Signal<boolean> = computed(
    () => this.status() === 'resolved',
  );
  readonly error: Signal<Error | null> = computed(() => this.errorSignal());
  readonly errorMessage: Signal<string | null> = computed(() => {
    const e = this.errorSignal();
    return e ? e.message : null;
  });

  /** TTL handling */
  private lastFetchTimestamp: number | null = null;
  private ttlTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(initialState: T) {
    super(initialState);

    // whenever the API returns data successfully, merge into state
    effect(() => {
      const partial = this.valueRaw();
      const status = this.statusRaw();
      if (status === 'resolved' && !this.errorSignal()) {
        if (Object.keys(partial).length > 0) {
          this.setState(partial);
        }
      }
    });

    // when error occurs cancel TTL timer
    effect(() => {
      if (this.errorSignal()) {
        this._clearTtlTimer();
      }
    });

    // schedule reload when resolved
    effect(() => {
      if (this.isResolved()) {
        this._scheduleTtlReload();
      } else {
        this._clearTtlTimer();
      }
    });
  }

  /** subclasses must provide initial params */
  protected abstract getInitialParams(): P;
  /** API call returning a partial state to merge */
  protected abstract loadFromApi(params: P): Promise<Partial<T>>;
  /** override to enable TTL */
  protected getTtlMs(): number {
    return 0;
  }

  /** external api */
  setParams(newParams: P): void {
    this._clearTtlTimer();
    this.errorSignal.set(null);
    this.paramsSignal.set(this._deepFreezeParams(newParams));
  }

  reload(): void {
    this._clearTtlTimer();
    this.errorSignal.set(null);
    this.resourceRef.reload();
  }

  private _updateLastFetch(): void {
    this.lastFetchTimestamp = Date.now();
  }

  private _scheduleTtlReload(): void {
    const ttl = this.getTtlMs();
    if (ttl <= 0) {
      return;
    }
    if (this.ttlTimer) {
      this._clearTtlTimer();
    }
    const elapsed = this.lastFetchTimestamp
      ? Date.now() - this.lastFetchTimestamp
      : Infinity;
    const delayMs = ttl - elapsed;
    if (delayMs <= 0) {
      this.reload();
    } else {
      this.ttlTimer = setTimeout(() => this.reload(), delayMs);
    }
  }

  private _clearTtlTimer(): void {
    if (this.ttlTimer) {
      clearTimeout(this.ttlTimer);
      this.ttlTimer = null;
    }
  }

  private _deepFreezeParams(obj: P): P {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
    }
    Object.freeze(obj as any);
    for (const key of Object.keys(obj as any)) {
      const val = (obj as any)[key];
      if (val && typeof val === 'object' && !Object.isFrozen(val)) {
        this._deepFreezeParams(val as any);
      }
    }
    return obj;
  }
}
