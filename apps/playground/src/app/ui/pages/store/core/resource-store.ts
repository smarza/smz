// src/app/core/resource-store.ts
import {
  inject,
  Injectable,
  signal,
  computed,
  effect,
  Signal,
  WritableSignal,
  ResourceStatus
} from '@angular/core';
import { resource, ResourceRef } from '@angular/core';
import { LoggingService, ScopedLogger } from '@smz-ui/layout';

/**
 * Generic base class for any store that loads a single “resource” T
 * based on a parameter object P.
 *
 * T = type of data returned by the API (e.g. User, Post[])
 * P = “params” object used to drive the loader (e.g. { id: number }). If no params, use P = void.
 *
 * This class sets up:
 *  - A WritableSignal<P> called paramsSignal
 *  - A ResourceRef<T> called resourceRef
 *  - computed() signals: value, status, error, errorMessage, isLoading, isError, isResolved
 *  - auto-logging effects when value or status changes
 *  - public methods setParams(...) and reload()
 *  - automatic TTL/revalidation: after a successful load, waits getTtlMs() ms, then reloads
 *
 * Production considerations already included:
 *  - error() and errorMessage() to expose loader-thrown errors
 *  - boolean flags for loading/error/resolved
 *  - deep-freeze of params for immutability
 *  - logging of every load attempt, status change, and error
 */
@Injectable({ providedIn: 'root' })
export abstract class ResourceStore<T, P extends Record<string, any> | void> {
  /** Holds the current params (P). If P = void, getInitialParams() returns undefined. */
  protected readonly paramsSignal: WritableSignal<P> =
    signal<P>(this._deepFreezeParams(this.getInitialParams()));

  /**
   * ResourceRef<T> performs the loader whenever paramsSignal() changes.
   * defaultValue guarantees that value() never returns undefined.
   */
  protected readonly resourceRef: ResourceRef<T> = resource<T, P>({
    params: () => this.paramsSignal(),
    loader: async ({ params }) => {
      const logger = this.logger;
      logger.info(`${this.constructor.name}: loader() invoked with params=`, params);
      try {
        const result = await this.loadFromApi(params as P);
        this._updateLastFetch(); // Record when fetch succeeded
        return Object.freeze(result as T); // Freeze for immutability
      } catch (err: unknown) {
        logger.error(`${this.constructor.name}: loader() error for params=`, params, err);
        throw err; // Causes status() === 'error'
      }
    },
    defaultValue: this.getDefaultValue()
  });

  /** Read-only signal for the loaded value (or defaultValue). */
  readonly value: Signal<T> = computed(() => this.resourceRef.value());

  /** Read-only signal for Resource status: 'idle' | 'loading' | 'resolved' | 'error' */
  readonly status: Signal<ResourceStatus> = computed(() => this.resourceRef.status());

  /** Read-only signal for any thrown error (if loader threw). */
  readonly error: Signal<unknown> = computed(() => this.resourceRef.error());

  /** Read-only signal for a friendly error message (string|null). */
  readonly errorMessage: Signal<string | null> = computed(() => {
    const err = this.error();
    if (err == null) return null;
    return err instanceof Error ? err.message : String(err);
  });

  /** Boolean flags for convenience in templates or logic */
  readonly isLoading: Signal<boolean> = computed(() => this.status() === 'loading');
  readonly isError: Signal<boolean> = computed(() => this.status() === 'error');
  readonly isResolved: Signal<boolean> = computed(() => this.status() === 'resolved');

  /** LoggingService and scoped logger for this store */
  protected readonly loggingService = inject(LoggingService);
  protected readonly logger: ScopedLogger =
    this.loggingService.scoped((this.constructor as { name: string }).name);

  /** Timestamp (in ms) of the last successful fetch; used for TTL logic */
  private lastFetchTimestamp: number | null = null;

  /** Reference to the scheduled TTL timer; call clearTimeout on this when needed */
  private ttlTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Log whenever value() changes
    effect(() => {
      const v = this.value();
      this.logger.debug(`${this.constructor.name}: value updated →`, v);
    });

    // Log whenever status() changes
    effect(() => {
      const s = this.status();
      this.logger.debug(`${this.constructor.name}: status changed →`, s);
    });

    // Log error whenever status switches to 'error'
    effect(() => {
      if (this.isError()) {
        this.logger.warn(
          `${this.constructor.name}: encountered error →`,
          this.errorMessage()
        );
      }
    });

    // When status becomes 'resolved', schedule a reload after TTL
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
   *  1) An initial P (for example, { id: 1 }). If no params, return undefined.
   *  2) A defaultValue for T (frozen) so that value() never is undefined.
   *  3) The logic to call the API, returning Promise<T>.
   */

  /** Called by constructor to set the initial paramsSignal. */
  protected abstract getInitialParams(): P;

  /** Called by resource options; must return a frozen instance of T. */
  protected abstract getDefaultValue(): T;

  /** Called by loader; must return a Promise<T> with data from API. */
  protected abstract loadFromApi(params: P): Promise<T>;

  /**
   * Change params (P) and trigger reload automatically.
   * For example: setParams({ id: 5 }) or setParams(undefined) if P = void.
   * Cancels any pending TTL timer.
   */
  setParams(newParams: P): void {
    this.logger.info(`${this.constructor.name}: setParams →`, newParams);
    this._clearTtlTimer();
    this.paramsSignal.set(this._deepFreezeParams(newParams));
  }

  /**
   * Force a reload of the current params, even if unchanged.
   * Cancels any pending TTL timer.
   */
  reload(): void {
    this.logger.info(`${this.constructor.name}: reload()`);
    this._clearTtlTimer();
    this.resourceRef.reload();
  }

  /**
   * Returns TTL in milliseconds. If <= 0, TTL is disabled.
   * Subclasses may override to provide a positive TTL.
   */
  protected getTtlMs(): number {
    return 0;
  }

  /** Update timestamp after a successful fetch (called inside loader). */
  private _updateLastFetch(): void {
    this.lastFetchTimestamp = Date.now();
  }

  /**
   * Schedule a reload once TTL expires.
   * If TTL <= 0, does nothing. If TTL has already passed, reload immediately.
   */
  private _scheduleTtlReload(): void {
    const ttl = this.getTtlMs();
    if (ttl <= 0) {
      return;
    }

    // Cancel any existing timer
    if (this.ttlTimer) {
      this._clearTtlTimer();
    }

    // Calculate elapsed time since last successful fetch
    const elapsed = this.lastFetchTimestamp ? Date.now() - this.lastFetchTimestamp : Infinity;
    const delayMs = ttl - elapsed;

    if (delayMs <= 0) {
      // TTL already expired; reload immediately
      this.logger.info(`${this.constructor.name}: TTL expired, reloading immediately`);
      this.reload();
    } else {
      // Schedule a reload after delayMs
      this.logger.debug(
        `${this.constructor.name}: scheduling reload in ${delayMs}ms (TTL)`
      );
      this.ttlTimer = setTimeout(() => {
        this.logger.info(`${this.constructor.name}: TTL reached, reloading resource`);
        this.reload();
      }, delayMs);
    }
  }

  /** Cancel any scheduled TTL timer. */
  private _clearTtlTimer(): void {
    if (this.ttlTimer) {
      clearTimeout(this.ttlTimer);
      this.ttlTimer = null;
    }
  }

  /**
   * Recursively freeze the params object to enforce immutability.
   * If P is primitive or void, just return it.
   */
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
