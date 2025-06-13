import { Signal } from '@angular/core';
import { StateStoreStatus } from './state-store';

export interface BaseStateStore<T> {
  readonly state: Signal<T>;
  readonly status: Signal<StateStoreStatus>;
  readonly error: Signal<Error | null>;
  readonly isLoading: Signal<boolean>;
  readonly isError: Signal<boolean>;
  readonly isResolved: Signal<boolean>;
  readonly isIdle: Signal<boolean>;
  readonly isLoaded: Signal<boolean>;

  reload(): Promise<void>;
  updateState(partial: Partial<T>): void;
}