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
  Injector,
  Injectable,
  OnDestroy
} from '@angular/core';
import { LOGGING_SERVICE, ScopedLogger } from '@smz-ui/core';
import { STORE_HISTORY_SERVICE } from '../store-history/store-history.service';
import { createStoreError, StoreError } from './error-handler';

export type StateStoreStatus = 'idle' | 'loading' | 'resolved' | 'error';

export interface StateStorePlugin<TState, S extends StateStore<TState>> {
  (store: S, logger: ScopedLogger, injector: Injector): void;
  destroy(): void;
  sleep(): void;
  wakeUp(): void;
}

export interface StateStoreActions<TState, TActions> {
  (actions: TActions, injector: Injector, updateState: (partial: Partial<TState>) => void, getState: () => TState): void;
}

export interface StateStoreSelectors<TState, TSelectors> {
  (selectors: TSelectors, injector: Injector, getState: () => TState): void;
}

@Injectable()
export abstract class StateStore<TState> implements OnDestroy {
  protected readonly scopeName: string;
  public readonly stateSignal: WritableSignal<TState> = signal(undefined as TState);
  private readonly statusSignal: WritableSignal<StateStoreStatus> = signal('idle');
  private readonly errorSignal: WritableSignal<StoreError | null> = signal(null);

  readonly state: Signal<TState> = computed(() => this.stateSignal());
  readonly status: Signal<StateStoreStatus> = computed(() => {
    return this.errorSignal() ? 'error' : this.statusSignal();
  });
  readonly error: Signal<StoreError | null> = computed(() => this.errorSignal());
  readonly isLoading = computed(() => this.status() === 'loading');
  readonly isError = computed(() => this.status() === 'error');
  readonly isResolved = computed(() => this.status() === 'resolved');
  readonly isIdle = computed(() => this.status() === 'idle');
  readonly isLoaded = computed(() => this.status() === 'resolved');

  protected readonly loggingService = inject(LOGGING_SERVICE);
  protected readonly storeHistoryService = inject(STORE_HISTORY_SERVICE);
  protected logger: ScopedLogger;
  private readonly injector = inject(Injector);
  private readonly plugins: Array<StateStorePlugin<TState, StateStore<TState>>> = [];
  constructor(scopeName?: string, plugins: Array<StateStorePlugin<TState, StateStore<TState>>> = [], actions: Array<StateStoreActions<TState, any>> = []) {
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

    this.plugins = plugins;

    plugins.forEach((p) => p(this as unknown as StateStore<TState>, this.logger, this.injector));
    actions.forEach((i) => i(this as unknown as StateStore<TState>, this.injector, this.updateState.bind(this), this.state.bind(this)));
  }

  protected abstract loadFromApi(): Promise<Partial<TState>>;

  /** Lifecycle hook called before reloading data. Return false to skip the API call */
  public beforeLoad(): Promise<boolean> | boolean {
    // Default implementation allows the reload
    return true;
  }

  /** Lifecycle hook called after reloading data */
  public afterLoad(wasSkipped: boolean): Promise<void> | void {
    // Default implementation does nothing
  }

  async handleLoad(force = false): Promise<void> {
    this.logger.info(`handleLoad() called`);

    try {
      const shouldReload = await this.beforeLoad();

      if (shouldReload || force) {
        this.statusSignal.set('loading');
        this.errorSignal.set(null);

        const result = await this.loadFromApi();
        this.statusSignal.set('resolved');
        this.updateState(result);
        await this.afterLoad(false);
      }
      else {
        this.logger.debug('Reload skipped by plugin');
        this.updateState(this.state());
        this.statusSignal.set('resolved');
        await this.afterLoad(true);
      }

    } catch (err) {
      const wrappedError = createStoreError(err, this.scopeName, this.logger);
      this.errorSignal.set(wrappedError);
      this.statusSignal.set('error');
    }
  }

  async reload(): Promise<void> {
    await this.handleLoad(false);
  }

  async forceReload(): Promise<void> {
    await this.handleLoad(true);
  }

  initializeState(state: TState): void {
    this.logger.debug(`initializeState() called`, state);
    this.stateSignal.set(state);
    this.statusSignal.set('resolved');
  }

  updateState(partial: Partial<TState>): void {
    if (this.status() === 'loading') {
      this.logger.warn(`updateState skipped because store is loading`, partial);
      return;
    }

    try {
      this.logger.debug(`updateState() called`, partial);
      this.stateSignal.update((s) => ({ ...(s as any), ...partial }));
    } catch (err) {
      const wrappedError = createStoreError(err, this.scopeName, this.logger);
      this.errorSignal.set(wrappedError);
      this.statusSignal.set('error');
    }
  }

  /** Cleanup hook called when the store is destroyed */
  ngOnDestroy(): void {
    this.logger.debug(`ngOnDestroy() called`, this.scopeName);
    this.plugins.forEach(p => {
      try {
        this.logger.debug('destroy plugin', p);
        (p as any).destroy();
      } catch (err) {
        this.logger.error(`Error destroying plugin`, err);
      }
    });
  }
}
