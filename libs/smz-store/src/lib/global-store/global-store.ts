/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  inject,
  Injectable,
  Signal,
  WritableSignal,
  computed,
  effect,
  signal,
  EffectRef,
  runInInjectionContext,
  Injector,
} from '@angular/core';
import { LOGGING_SERVICE, ScopedLogger } from '@smz-ui/core';
import { STORE_HISTORY_SERVICE } from '../store-history/store-history.service';

export type GlobalStoreStatus = 'idle' | 'loading' | 'resolved' | 'error';

@Injectable({ providedIn: 'root' })
export abstract class GlobalStore<T, TStore> {
  protected readonly scopeName: string;
  private readonly stateSignal: WritableSignal<T> = signal<T>({} as T);
  private readonly statusSignal: WritableSignal<GlobalStoreStatus> = signal<GlobalStoreStatus>('idle');
  private readonly errorSignal: WritableSignal<Error | null> = signal<Error | null>(null);

  readonly state: Signal<T> = computed(() => this.stateSignal());
  readonly status: Signal<GlobalStoreStatus> = computed(() => {
    return this.errorSignal() ? 'error' : this.statusSignal();
  });
  readonly error: Signal<Error | null> = computed(() => this.errorSignal());
  readonly isLoading = computed(() => this.status() === 'loading');
  readonly isError = computed(() => this.status() === 'error');
  readonly isResolved = computed(() => this.status() === 'resolved');

  protected readonly loggingService = inject(LOGGING_SERVICE);
  protected logger: ScopedLogger;
  private readonly injector = inject(Injector);

  private ttlTimer: ReturnType<typeof setTimeout> | null = null;
  private lastFetchTimestamp: number | null = null;

  protected readonly actionStatusSignals = new Map<
    string,
    { signal: WritableSignal<GlobalStoreStatus>; effectRef: EffectRef; params?: any }
  >();

  protected readonly storeHistoryService = inject(STORE_HISTORY_SERVICE);

  constructor(scopeName?: string) {
    this.scopeName = scopeName ?? (this.constructor as { name: string }).name;
    this.logger = this.loggingService.scoped(this.scopeName);

    effect(() => {
      const s = this.stateSignal();
      this.logger.debug(`state updated →`, s);

      this.persistState(s);
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

    effect(() => {
      this.statusSignal();
      if (this.isResolved()) {
        this._scheduleTtlReload();
      } else {
        this._clearTtlTimer();
      }
    });
  }

  /** Initial state value */
  public abstract initializeState(): void;

  protected abstract persistState(state: T): void;
  protected abstract loadPersistedState(): T | null;
  protected abstract clearPersistedState(): void;

  /** Optional load function */
  protected abstract loadFromApi(): Promise<Partial<T>>;
  /** Optional TTL (ms) */
  protected getTtlMs(): number {
    return 0;
  }

  async reload(): Promise<void> {
    this.logger.info(`reload()`);
    this._clearTtlTimer();
    this.statusSignal.set('loading');
    this.errorSignal.set(null);
    try {
      const result = await this.loadFromApi();
      this.updateState(result);
      this.statusSignal.set('resolved');
      this._updateLastFetch();
    } catch (err) {
      const wrapped = err instanceof Error ? err : new Error(String(err));
      this.errorSignal.set(wrapped);
      this.statusSignal.set('error');
    }
  }

  updateState(partial: Partial<T>): void {
    this.logger.debug(`updateState`, partial);
    this.stateSignal.update((s) => this._deepFreeze({ ...(s as any), ...partial }));

    // this.persistState(this.stateSignal());
  }

  private _updateLastFetch(): void {
    this.lastFetchTimestamp = Date.now();
  }

  protected _scheduleTtlReload(): void {
    const ttl = this.getTtlMs();
    if (ttl <= 0) return;
    if (this.ttlTimer) this._clearTtlTimer();
    const elapsed = this.lastFetchTimestamp ? Date.now() - this.lastFetchTimestamp : Infinity;
    const delayMs = ttl - elapsed;
    if (delayMs <= 0) {
      this.logger.info(`TTL expired, reloading immediately`);
      void this.reload();
    } else {
      this.logger.debug(`scheduling reload in ${delayMs}ms (TTL)`);
      this.ttlTimer = setTimeout(() => {
        this.logger.info(`TTL reached, reloading`);
        void this.reload();
      }, delayMs);
    }
  }

  protected _clearTtlTimer(): void {
    if (this.ttlTimer) {
      clearTimeout(this.ttlTimer);
      this.ttlTimer = null;
    }
  }

  protected _deepFreeze(obj: T, visited: Set<any> = new Set<any>()): T {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
    }
    if (visited.has(obj)) return obj;
    visited.add(obj);
    const r = obj as Record<string, unknown>;
    Object.freeze(r);
    for (const k of Object.keys(r)) {
      const val = r[k];
      if (val && typeof val === 'object' && !Object.isFrozen(val)) {
        this._deepFreeze(val as T, visited);
      }
    }
    return obj;
  }

  public getStatusSignal(): WritableSignal<GlobalStoreStatus> {
    return this.statusSignal;
  }

  public getErrorSignal(): WritableSignal<Error | null> {
    return this.errorSignal;
  }

  public getActionStatusSignal(key: Extract<keyof TStore, string>, params?: any): WritableSignal<GlobalStoreStatus> {
    let entry = this.actionStatusSignals.get(key);
    if (!entry) {
      const status = signal<GlobalStoreStatus>('idle');
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

