// src/app/core/base-store.ts
import { inject, Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { LoggingService, ScopedLogger } from '@smz-ui/layout';

/**
 * T = the shape of your state object, e.g. { user: User | null; loading: boolean; error: string | null }
 */
@Injectable({ providedIn: 'root' })
export abstract class BaseStore<T extends Record<string, any>> {
  // Underlying writable signal for the entire state
  private _state: WritableSignal<T>;
  // Exposed readonly signal so outside code can't call set() directly
  readonly state: Signal<T>;

  // Logger for all derived stores
  protected loggingService = inject(LoggingService);
  protected logger: ScopedLogger;

  constructor(initialState: T) {
    // Initialize the logger with the subclass’s name
    this.logger = this.loggingService.scoped((this.constructor as any).name);
    this.logger.debug('BaseStore: constructor', initialState);
    // Create the signal with initial state
    this._state = signal(this._deepFreeze(initialState));
    this.state = this._state.asReadonly();

    // Hook for lazy initialization if needed
    this.initialize();
  }

  /**
   * Utility to merge partialState into current state immutably.
   * Also logs old vs. new.
   */
  protected setState(partialState: Partial<T>): void {
    const oldState = this._state();
    const newState = Object.freeze({ ...oldState, ...partialState });
    this.logger.debug(`State change in ${this.constructor.name}`, {
      oldValue: oldState,
      newValue: newState,
    });
    this._state.set(newState);
  }

  /**
   * Optional hook that child classes can override to perform
   * any “initial load” logic or setup.
   */
  protected initialize(): void {
    // Default: do nothing. Subclasses can override.
  }

  /**
   * Helper to deeply freeze an object so that nobody can mutate in place.
   */
  private _deepFreeze(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    Object.freeze(obj);
    for (const key of Object.keys(obj)) {
      if (
        Object.prototype.hasOwnProperty.call(obj, key) &&
        obj[key] !== null &&
        typeof obj[key] === 'object' &&
        !Object.isFrozen(obj[key])
      ) {
        this._deepFreeze(obj[key]);
      }
    }
    return obj;
  }
}
