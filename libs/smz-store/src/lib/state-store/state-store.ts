/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  EffectRef,
  WritableSignal,
  Signal,
  computed,
  effect,
  inject,
  signal,
  runInInjectionContext,
  Injector
} from '@angular/core';
import { LOGGING_SERVICE, ScopedLogger } from '@smz-ui/core';
import { STORE_HISTORY_SERVICE } from '../store-history/store-history.service';

export type StateStoreStatus = 'idle' | 'loading' | 'resolved' | 'error';

export interface StateStorePlugin<T, S extends StateStore<T, unknown>> {
  (store: S, logger: ScopedLogger, injector: Injector): void;
}

export abstract class StateStore<T, TStore> {
  protected readonly scopeName: string;
  public readonly stateSignal: WritableSignal<T> = signal(null as T);
  private readonly statusSignal: WritableSignal<StateStoreStatus> = signal('idle');
  private readonly errorSignal: WritableSignal<Error | null> = signal(null);

  readonly state: Signal<T> = computed(() => this.stateSignal());
  readonly status: Signal<StateStoreStatus> = computed(() => {
    return this.errorSignal() ? 'error' : this.statusSignal();
  });
  readonly error: Signal<Error | null> = computed(() => this.errorSignal());
  readonly isLoading = computed(() => this.status() === 'loading');
  readonly isError = computed(() => this.status() === 'error');
  readonly isResolved = computed(() => this.status() === 'resolved');
  readonly isIdle = computed(() => this.status() === 'idle');
  readonly isLoaded = computed(() => this.status() === 'resolved' || this.status() === 'idle');

  protected readonly loggingService = inject(LOGGING_SERVICE);
  protected readonly storeHistoryService = inject(STORE_HISTORY_SERVICE);
  protected logger: ScopedLogger;
  private readonly injector = inject(Injector);

  protected readonly actionStatusSignals = new Map<
    string,
    { signal: WritableSignal<StateStoreStatus>; effectRef: EffectRef; params?: any }
  >();

  constructor(scopeName?: string, plugins: Array<StateStorePlugin<T, StateStore<T, TStore>>> = []) {
    this.scopeName = scopeName ?? (this.constructor as { name: string }).name;
    this.logger = this.loggingService.scoped(this.scopeName);

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

    plugins.forEach((p) => p(this as unknown as StateStore<T, unknown>, this.logger, this.injector));
  }

  /** Initial state value */
  public abstract initializeState(): void;

  protected abstract loadFromApi(): Promise<Partial<T>>;

  async reload(): Promise<void> {
    this.logger.info(`reload()`);
    this.statusSignal.set('loading');
    this.errorSignal.set(null);
    try {
      const result = await this.loadFromApi();
      this.updateState(result);
      this.statusSignal.set('resolved');
    } catch (err) {
      const wrapped = err instanceof Error ? err : new Error(String(err));
      this.errorSignal.set(wrapped);
      this.statusSignal.set('error');
    }
  }

  updateState(partial: Partial<T>): void {
    this.logger.debug(`updateState`, partial);
    this.stateSignal.update((s) => ({ ...(s as any), ...partial }));
  }

  public getStatusSignal(): WritableSignal<StateStoreStatus> {
    return this.statusSignal;
  }

  public getErrorSignal(): WritableSignal<Error | null> {
    return this.errorSignal;
  }

  public getActionStatusSignal(key: Extract<keyof TStore, string>, params?: any): WritableSignal<StateStoreStatus> {
    let entry = this.actionStatusSignals.get(key);
    if (!entry) {
      const status = signal<StateStoreStatus>('idle');
      const ref = runInInjectionContext(this.injector, () => {
        return effect(() => {
          const s = status();
          this.logger.debug(`[${key}] status changed →`, s);
          this.storeHistoryService.trackEvent({
            storeScope: this.scopeName,
            action: key,
            params: entry?.params ?? {},
            status: s,
          });
        });
      });
      entry = { signal: status, effectRef: ref, params };
      this.actionStatusSignals.set(key, entry);
    } else if (params) {
      entry.params = params;
    }
    return entry.signal;
  }

  public clearActionStatusSignal(key: Extract<keyof TStore, string>): void {
    const entry = this.actionStatusSignals.get(key);
    if (!entry) return;
    entry.effectRef.destroy();
    this.actionStatusSignals.delete(key);
  }
}
