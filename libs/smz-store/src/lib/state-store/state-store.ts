/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  EffectRef,
  WritableSignal,
  Signal,
  computed,
  effect,
  inject,
  signal,
  Injector
} from '@angular/core';
import { LOGGING_SERVICE, ScopedLogger } from '@smz-ui/core';
import { STORE_HISTORY_SERVICE } from '../store-history/store-history.service';

export type StateStoreStatus = 'idle' | 'loading' | 'resolved' | 'error';

export interface StateStorePlugin<TState, S extends StateStore<TState>> {
  (store: S, logger: ScopedLogger, injector: Injector): void;
}

export interface StateStoreImplementation<TState, TClientStore> {
  (store: TClientStore, updateState: (partial: Partial<TState>) => void, getState: () => TState): void;
}

export abstract class StateStore<TState> {
  protected readonly scopeName: string;
  public readonly stateSignal: WritableSignal<TState> = signal(null as TState);
  private readonly statusSignal: WritableSignal<StateStoreStatus> = signal('idle');
  private readonly errorSignal: WritableSignal<Error | null> = signal(null);

  readonly state: Signal<TState> = computed(() => this.stateSignal());
  readonly status: Signal<StateStoreStatus> = computed(() => {
    return this.errorSignal() ? 'error' : this.statusSignal();
  });
  readonly error: Signal<Error | null> = computed(() => this.errorSignal());
  readonly isLoading = computed(() => this.status() === 'loading');
  readonly isError = computed(() => this.status() === 'error');
  readonly isResolved = computed(() => this.status() === 'resolved');
  readonly isIdle = computed(() => this.status() === 'idle');
  readonly isLoaded = computed(() => this.status() === 'resolved');

  protected readonly loggingService = inject(LOGGING_SERVICE);
  protected readonly storeHistoryService = inject(STORE_HISTORY_SERVICE);
  protected logger: ScopedLogger;
  private readonly injector = inject(Injector);

  protected readonly actionStatusSignals = new Map<
    string,
    { signal: WritableSignal<StateStoreStatus>; effectRef: EffectRef; params?: any }
  >();

  constructor(scopeName?: string, plugins: Array<StateStorePlugin<TState, StateStore<TState>>> = [], implementations: Array<StateStoreImplementation<TState, any>> = []) {
    this.scopeName = scopeName ?? (this.constructor as { name: string }).name;
    this.logger = this.loggingService.scoped(this.scopeName);

    this.logger.debug('StateStore initialized');

    effect(() => {
      const s = this.stateSignal();
      this.logger.debug(`state updated →`, s);
    });

    effect(() => {
      const st = this.statusSignal();
      this.logger.debug(`status changed →`, st);
      this.storeHistoryService.trackEvent({
        storeScope: this.scopeName,
        action: 'load',
        params: {},
        status: st,
      });
    });

    plugins.forEach((p) => p(this as unknown as StateStore<TState>, this.logger, this.injector));
    implementations.forEach((i) => i(this as unknown as StateStore<TState>, this.updateState.bind(this), this.state.bind(this)));
  }

  protected abstract loadFromApi(): Promise<Partial<TState>>;

  /** Lifecycle hook called before reloading data. Return false to skip the API call */
  public beforeReload(): Promise<boolean> | boolean {
    // Default implementation allows the reload
    return true;
  }

  /** Lifecycle hook called after reloading data */
  public afterReload(wasSkipped: boolean): Promise<void> | void {
    // Default implementation does nothing
  }

  async reload(): Promise<void> {
    this.logger.info(`reload()`);
    this.statusSignal.set('loading');
    this.errorSignal.set(null);
    try {
      const shouldReload = await this.beforeReload();

      if (shouldReload) {
        const result = await this.loadFromApi();
        this.updateState(result);
        this.statusSignal.set('resolved');
        await this.afterReload(false);
      }
      else {
        this.logger.debug('Reload skipped by plugin');
        this.statusSignal.set('resolved');
        this.updateState(this.state());
        await this.afterReload(true);
      }

    } catch (err) {
      const wrapped = err instanceof Error ? err : new Error(String(err));
      this.errorSignal.set(wrapped);
      this.statusSignal.set('error');
    }
  }

  initializeState(state: TState): void {
    this.logger.debug(`initializeState`, state);
    this.stateSignal.set(state);
    this.statusSignal.set('resolved');
  }

  updateState(partial: Partial<TState>): void {
    this.logger.debug(`updateState`, partial);
    this.stateSignal.update((s) => ({ ...(s as any), ...partial }));
  }

  public getStatusSignal(): WritableSignal<StateStoreStatus> {
    return this.statusSignal;
  }

  public getErrorSignal(): WritableSignal<Error | null> {
    return this.errorSignal;
  }
}
