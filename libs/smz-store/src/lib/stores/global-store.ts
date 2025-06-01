import {
  inject,
  Injectable,
  Signal,
  WritableSignal,
  computed,
  effect,
  signal,
} from '@angular/core';
import { LoggingService, ScopedLogger } from '@smz-ui/core';

export type GlobalStoreStatus = 'idle' | 'loading' | 'resolved' | 'error';

@Injectable({ providedIn: 'root' })
export abstract class GlobalStore<T> {
  protected readonly stateSignal: WritableSignal<T> = signal<T>(
    this._deepFreeze(this.getInitialState())
  );
  protected readonly statusSignal: WritableSignal<GlobalStoreStatus> = signal<GlobalStoreStatus>('idle');
  protected readonly errorSignal: WritableSignal<Error | null> = signal<Error | null>(null);

  readonly state: Signal<T> = computed(() => this.stateSignal());
  readonly status: Signal<GlobalStoreStatus> = computed(() => {
    return this.errorSignal() ? 'error' : this.statusSignal();
  });
  readonly error: Signal<Error | null> = computed(() => this.errorSignal());
  readonly isLoading = computed(() => this.status() === 'loading');
  readonly isError = computed(() => this.status() === 'error');
  readonly isResolved = computed(() => this.status() === 'resolved');

  protected readonly loggingService = inject(LoggingService);
  protected logger: ScopedLogger;

  private ttlTimer: ReturnType<typeof setTimeout> | null = null;
  private lastFetchTimestamp: number | null = null;

  constructor(scopeName?: string) {
    this.logger = this.loggingService.scoped(
      scopeName ?? (this.constructor as { name: string }).name
    );
    effect(() => {
      const s = this.stateSignal();
      this.logger.debug(`state updated →`, s);
    });

    effect(() => {
      const st = this.statusSignal();
      this.logger.debug(`status changed →`, st);
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

  /** Valor inicial de estado */
  protected abstract getInitialState(): T;
  /** Função de carregamento opcional */
  protected abstract loadFromApi(): Promise<Partial<T>>;
  /** TTL opcional (ms) */
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
    this.logger.info(`updateState`, partial);
    this.stateSignal.update((s) => this._deepFreeze({ ...(s as any), ...partial }));
  }

  private _updateLastFetch(): void {
    this.lastFetchTimestamp = Date.now();
  }

  private _scheduleTtlReload(): void {
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

  private _clearTtlTimer(): void {
    if (this.ttlTimer) {
      clearTimeout(this.ttlTimer);
      this.ttlTimer = null;
    }
  }

  private _deepFreeze(obj: T): T {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
    }
    const r = obj as Record<string, unknown>;
    Object.freeze(r);
    for (const k of Object.keys(r)) {
      const val = r[k];
      if (val && typeof val === 'object' && !Object.isFrozen(val)) {
        this._deepFreeze(val as T);
      }
    }
    return obj;
  }
}

