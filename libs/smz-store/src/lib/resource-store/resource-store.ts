import {
  inject,
  Injectable,
  signal,
  computed,
  effect,
  Signal,
  WritableSignal
} from '@angular/core';
import { resource, ResourceRef } from '@angular/core';
import { ResourceStatus } from '@angular/core';
import { LoggingService, ScopedLogger } from '@smz-ui/core';

/**
 * Generic base class for any store that loads a single "resource" T
 * based on a parameter object P.
 *
 * T = type of data returned by the API (e.g. User, Post[])
 * P = "params" object used to drive the loader (e.g. { id: number }). If no params, use P = void.
 *
 * This class sets up:
 *  - A WritableSignal<P> called paramsSignal
 *  - A ResourceRef<T> called resourceRef (internally updates valueRaw and statusRaw)
 *  - Signals "value" and "status" that combine the raw values with errorSignal
 *  - Signals "errorSignal" and "errorMessage"
 *  - Boolean flags "isLoading", "isError", "isResolved"
 *  - Auto logging effects for changes in valueRaw, statusRaw and errorSignal
 *  - Public methods setParams(...) and reload()
 *  - Optional TTL/revalidation
 *
 * In case of an HTTP error (for example 404), the loader does NOT throw. Instead:
 *  1. The error is stored in errorSignal.
 *  2. defaultValue is returned so valueReal is never undefined.
 *  3. status() is set to 'error' while errorSignal is not null.
 */
@Injectable({ providedIn: 'root' })
export abstract class ResourceStore<T, P extends Record<string, any> | void> {
  // 1) Internal signal for parameters (P), already frozen to ensure immutability
  protected readonly paramsSignal: WritableSignal<P> =
    signal<P>(this._deepFreezeParams(this.getInitialParams()));

  // 2) ResourceRef<T> is the "raw version" of the resource:
  //    - loaderRaw performs fetch (or catch + defaultValue)
  //    - valueRaw and statusRaw are managed by ResourceRef
  protected readonly resourceRef: ResourceRef<T> = resource<T, P>({
    params: () => this.paramsSignal(),
    loader: async ({ params }) => {
      const logger = this.logger;
      logger.info(`loader invoked with params=`, params);
      try {
        const result = await this.loadFromApi(params as P);
        this._updateLastFetch();
        return Object.freeze(result as T);
      } catch (err: unknown) {
        // If it's HttpErrorResponse or another object, wrap it in Error
        const wrappedError: Error =
          err instanceof Error
            ? err
            : new Error(typeof err === 'object' ? JSON.stringify(err) : String(err));

        logger.error(`loader error for params=`, params, wrappedError);

        // Instead of throwing, register in errorSignal and return defaultValue
        this.errorSignal.set(wrappedError);
        return this.getDefaultValue();
      }
    },
    defaultValue: this.getDefaultValue()
  });

  // 3) "Raw" signals managed by resourceRef:
  private readonly valueRaw: Signal<T> = computed(() => this.resourceRef.value());
  private readonly statusRaw: Signal<ResourceStatus> = computed(() => this.resourceRef.status());

  // 4) Dedicated errorSignal to store the actual error (HttpErrorResponse or Error)
  private readonly errorSignal: WritableSignal<Error | null> = signal<Error | null>(null);

  /** value() exposes valueRaw, or defaultValue when in "error" */
  readonly value: Signal<T> = computed(() => {
    // If there is an errorSignal, return defaultValue (which is already valueRaw in this case)
    return this.errorSignal() ? this.getDefaultValue() : this.valueRaw();
  });

  /** status() combines statusRaw and errorSignal:
   *  - if errorSignal is not null → 'error'
   *  - else → statusRaw
   */
  readonly status: Signal<ResourceStatus> = computed(() => {
    return this.errorSignal() ? 'error' : this.statusRaw();
  });

  /** Expose errorSignal as a read-only signal for components */
  readonly error: Signal<Error | null> = computed(() => this.errorSignal());

  /** Friendly error message, if any */
  readonly errorMessage: Signal<string | null> = computed(() => {
    const e = this.error();
    return e ? e.message : null;
  });

  /** Boolean flags for templates or component logic */
  readonly isLoading: Signal<boolean> = computed(() => this.status() === 'loading');
  readonly isError: Signal<boolean> = computed(() => this.status() === 'error');
  readonly isResolved: Signal<boolean> = computed(() => this.status() === 'resolved');

  /** LoggingService and logger */
  protected readonly loggingService = inject(LoggingService);
  protected logger: ScopedLogger;

  /** Timestamp (ms) of the last successful fetch */
  private lastFetchTimestamp: number | null = null;

  /** TTL timer (if any) */
  private ttlTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(scopeName?: string) {
    this.logger = this.loggingService.scoped(
      scopeName ?? (this.constructor as { name: string }).name
    );
    // 5) Automatic logs about valueRaw
    effect(() => {
      const v = this.valueRaw();
      this.logger.debug(`valueRaw updated →`, v);
    });

    // 6) Automatic logs about statusRaw
    effect(() => {
      const s = this.statusRaw();
      this.logger.debug(`statusRaw changed →`, s);
    });

    // 7) When raw goes into error (statusRaw = 'error') or errorSignal becomes != null,
    //    log it and ensure the TTL timer is cleared.
    effect(() => {
      if (this.errorSignal()) {
        const e = this.errorSignal();
        this.logger.warn(`errorSignal set →`, e);
        this._clearTtlTimer();
      }
    });

    // 8) When status() (combined) is 'resolved', schedule reload after TTL
    effect(() => {
      if (this.isResolved()) {
        this._scheduleTtlReload();
      } else {
        this._clearTtlTimer();
      }
    });
  }

  /**
   * Subclasses must provide:
   * 1) The initial parameter (P) or undefined if P = void
   * 2) The immutable defaultValue of T
   * 3) The actual API call returning Promise<T>
   */

  /** Returns the initial value of P (e.g. { id: 1 }) or undefined if P = void */
  protected abstract getInitialParams(): P;

  /** Returns the immutable defaultValue of T for initialization and on error */
  protected abstract getDefaultValue(): T;

  /** Executes the real API call and returns Promise<T> */
  protected abstract loadFromApi(params: P): Promise<T>;

  /**
   * Changes P and triggers an automatic reload.
   * Cancels the TTL timer if present.
   */
  setParams(newParams: P): void {
    this.logger.info(`setParams →`, newParams);
    this._clearTtlTimer();
    // Clear any previous error before changing the parameter
    this.errorSignal.set(null);
    this.paramsSignal.set(this._deepFreezeParams(newParams));
  }

  /**
   * Force reload with the same params and cancel the TTL timer.
   * Also clears errorSignal before reloading.
   */
  reload(): void {
    this.logger.info(`reload()`);
    this._clearTtlTimer();
    this.errorSignal.set(null);
    this.resourceRef.reload();
  }

  /**
   * TTL in milliseconds. If <= 0, TTL is disabled.
   * Subclasses may override to return > 0.
   */
  protected getTtlMs(): number {
    return 0;
  }

  /** Called after a successful fetch to record the timestamp */
  private _updateLastFetch(): void {
    this.lastFetchTimestamp = Date.now();
  }

  /**
   * Schedule reload after TTL. If TTL <= 0, do nothing.
   * If it has already expired, reload immediately.
   */
  private _scheduleTtlReload(): void {
    const ttl = this.getTtlMs();
    if (ttl <= 0) {
      return;
    }

    // Cancel previous timer
    if (this.ttlTimer) {
      this._clearTtlTimer();
    }

    const elapsed = this.lastFetchTimestamp
      ? Date.now() - this.lastFetchTimestamp
      : Infinity;
    const delayMs = ttl - elapsed;

    if (delayMs <= 0) {
      this.logger.info(`TTL expired, reloading immediately`);
      this.reload();
    } else {
      this.logger.debug(`scheduling reload in ${delayMs}ms (TTL)`);
      this.ttlTimer = setTimeout(() => {
        this.logger.info(`TTL reached, reloading`);
        this.reload();
      }, delayMs);
    }
  }

  /** Cancels any pending TTL timer */
  private _clearTtlTimer(): void {
    if (this.ttlTimer) {
      clearTimeout(this.ttlTimer);
      this.ttlTimer = null;
    }
  }

  /**
   * Recursively deep-freezes the P object to guarantee immutability.
   * If P = void or a non-object value, returns it as is.
   */
  private _deepFreezeParams(obj: P, visited: Set<any> = new Set<any>()): P {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
    }
    if (visited.has(obj)) return obj;
    visited.add(obj);
    const objAsRecord = obj as Record<string, unknown>;
    Object.freeze(objAsRecord);
    for (const key of Object.keys(objAsRecord)) {
      const val = objAsRecord[key];
      if (val && typeof val === 'object' && !Object.isFrozen(val)) {
        this._deepFreezeParams(val as P, visited);
      }
    }
    return obj;
  }
}
