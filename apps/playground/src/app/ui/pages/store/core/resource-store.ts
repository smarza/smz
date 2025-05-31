// src/app/core/resource-store.ts
import { inject, Injectable, signal, computed, effect, Signal, WritableSignal, ResourceStatus } from '@angular/core';
import { resource, ResourceRef } from '@angular/core';
import { LoggingService, ScopedLogger } from '@smz-ui/layout';

/**
 * Generic base class for any store that loads a single "resource" T
 * based on a parameter object P.
 *
 * T = the type of the data returned by the API (e.g. User, Post[])
 * P = the "params" object used to drive the resource loader (e.g. { id: number }).
 *
 * This class sets up:
 *  - A WritableSignal<P> called "paramsSignal"
 *  - A ResourceRef<T> called "resourceRef"
 *  - computed() signals "value" and "status"
 *  - auto‐logging effects when value() or status() changes
 *  - public methods setParams(...) and reload()
 */
@Injectable({ providedIn: 'root' })
export abstract class ResourceStore<T, P extends Record<string, any> | void> {
  /** The private source of truth for our params. Subclasses may call setParams(). */
  protected readonly paramsSignal: WritableSignal<P> = signal<P>(this.getInitialParams());

  /** The Angular resource that will call our loader whenever paramsSignal() changes. */
  protected readonly resourceRef: ResourceRef<T> = resource<T, P>({
    params: () => this.paramsSignal(),
    loader: async ({ params }) => {
      const logger = this.logger;
      logger.info(`${this.constructor.name}: loader() invoked with params=`, params);
      try {
        const result = await this.loadFromApi(params as P);
        // Freeze to enforce immutability
        return Object.freeze(result as T);
      } catch (err: unknown) {
        logger.error(`${this.constructor.name}: loader() error for params=`, params, err);
        throw err;
      }
    },
    defaultValue: this.getDefaultValue()
  });

  /** A read-only signal for the loaded value. */
  readonly value: Signal<T> = computed(() => this.resourceRef.value());

  /** A read-only signal for the Resource status: 'idle' | 'loading' | 'resolved' | 'error' */
  readonly status: Signal<ResourceStatus> = computed(() => this.resourceRef.status());

  /** LoggingService & scoped logger */
  protected readonly loggingService = inject(LoggingService);
  protected readonly logger: ScopedLogger = this.loggingService.scoped((this.constructor as { name: string }).name);

  constructor() {
    /** Log whenever the loaded value changes */
    effect(() => {
      const v = this.value();
      // You may want to avoid logging the defaultValue if it hasn't “really” loaded yet.
      this.logger.debug(`${this.constructor.name}: value updated →`, v);
    });

    /** Log whenever the status changes */
    effect(() => {
      const s = this.status();
      this.logger.debug(`${this.constructor.name}: status changed →`, s);
    });
  }

  /**
   * Each subclass must tell us:
   * 1) The initial params object (or `undefined` if no params needed).
   * 2) The defaultValue to use when the resource is “idle/initializing”.
   * 3) How to actually load from the API given a P.
   */

  /** Called by the constructor to set the initial value of paramsSignal. */
  protected abstract getInitialParams(): P;

  /**
   * Called in the resource options so that value() is never undefined.
   * Must return a frozen object (or array) that matches T.
   */
  protected abstract getDefaultValue(): T;

  /**
   * The actual method that calls the injected API service to fetch T.
   * Subclasses implement this to return a Promise<T>.
   */
  protected abstract loadFromApi(params: P): Promise<T>;

  /**
   * Public method to change the params. Triggers a reload automatically.
   * E.g. setParams({ id: 5 }) or setParams(undefined) if P = void.
   */
  setParams(newParams: P): void {
    this.logger.info(`${this.constructor.name}: setParams →`, newParams);
    this.paramsSignal.set(this._deepFreezeParams(newParams));
  }

  /**
   * Public method to force a reload of the current params, even if unchanged.
   */
  reload(): void {
    this.logger.info(`${this.constructor.name}: reload()`);
    this.resourceRef.reload();
  }

  /**
   * If P is a non-primitive object, we freeze it to enforce immutability.
   * If P = void (no params), just return undefined.
   */
  private _deepFreezeParams(obj: P): P {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
    }
    Object.freeze(obj as T);
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key];
      if (val && typeof val === 'object' && !Object.isFrozen(val)) {
        this._deepFreezeParams(val as P);
      }
    }
    return obj;
  }
}
