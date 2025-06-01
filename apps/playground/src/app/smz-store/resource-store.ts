// src/app/core/resource-store.ts
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
import { LoggingService, ScopedLogger } from '@smz-ui/layout';

/**
 * Generic base class for any store that loads a single "resource" T
 * based on a parameter object P.
 *
 * T = type of data returned by the API (e.g. User, Post[])
 * P = "params" object used to drive the loader (e.g. { id: number }). If no params, use P = void.
 *
 * This class sets up:
 *  - A WritableSignal<P> called paramsSignal
 *  - A ResourceRef<T> called resourceRef (internally atualiza valueRaw e statusRaw)
 *  - Signals "value", "status" que combinam raw + errorSignal
 *  - Signals "errorSignal" e "errorMessage"
 *  - Boolean flags "isLoading", "isError", "isResolved"
 *  - auto-logging effects of changes em valueRaw, statusRaw e errorSignal
 *  - public methods setParams(...) e reload()
 *  - TTL/revalidação opcional
 *
 * Em caso de erro no HTTP (por exemplo 404), o loader NÃO lança. Ao invés disso:
 *  1. Registro o erro em errorSignal.
 *  2. Retorno defaultValue para que valueReal nunca seja undefined.
 *  3. status() é definido para 'error' enquanto errorSignal não for null.
 */
@Injectable({ providedIn: 'root' })
export abstract class ResourceStore<T, P extends Record<string, any> | void> {
  // 1) Sinal interno para parâmetros (P), já "frozen" para garantir imutabilidade
  protected readonly paramsSignal: WritableSignal<P> =
    signal<P>(this._deepFreezeParams(this.getInitialParams()));

  // 2) ResourceRef<T> é a "versão bruta" do recurso:
  //    - loaderRaw faz fetch (ou catch + defaultValue)
  //    - valueRaw e statusRaw são gerenciados por ResourceRef
  protected readonly resourceRef: ResourceRef<T> = resource<T, P>({
    params: () => this.paramsSignal(),
    loader: async ({ params }) => {
      const logger = this.logger;
      logger.info(`${this.constructor.name}: loader invoked with params=`, params);
      try {
        const result = await this.loadFromApi(params as P);
        this._updateLastFetch();
        return Object.freeze(result as T);
      } catch (err: unknown) {
        // Se for HttpErrorResponse ou outro objeto, embrulhe em Error
        const wrappedError: Error =
          err instanceof Error
            ? err
            : new Error(typeof err === 'object' ? JSON.stringify(err) : String(err));

        logger.error(
          `${this.constructor.name}: loader error for params=`,
          params,
          wrappedError
        );

        // Ao invés de lançar, registramos no errorSignal e retornamos defaultValue
        this.errorSignal.set(wrappedError);
        return this.getDefaultValue();
      }
    },
    defaultValue: this.getDefaultValue()
  });

  // 3) Sinais "raw" gerenciados pelo resourceRef:
  private readonly valueRaw: Signal<T> = computed(() => this.resourceRef.value());
  private readonly statusRaw: Signal<ResourceStatus> = computed(() => this.resourceRef.status());

  // 4) errorSignal próprio para registrar o erro real (HttpErrorResponse ou Error)
  private readonly errorSignal: WritableSignal<Error | null> = signal<Error | null>(null);

  /** value() expõe valueRaw, ou defaultValue se estivermos em "error" */
  readonly value: Signal<T> = computed(() => {
    // Se houver um errorSignal, devolve defaultValue (que já é valueRaw nesse caso)
    return this.errorSignal() ? this.getDefaultValue() : this.valueRaw();
  });

  /** status() combina statusRaw e errorSignal:
   *  - se errorSignal não for null → 'error'
   *  - else → statusRaw
   */
  readonly status: Signal<ResourceStatus> = computed(() => {
    return this.errorSignal() ? 'error' : this.statusRaw();
  });

  /** Expor errorSignal como sinal somente-leitura para componentes */
  readonly error: Signal<Error | null> = computed(() => this.errorSignal());

  /** Mensagem amigável do erro, se houver */
  readonly errorMessage: Signal<string | null> = computed(() => {
    const e = this.error();
    return e ? e.message : null;
  });

  /** Flags booleanas para templates ou lógica de componente */
  readonly isLoading: Signal<boolean> = computed(() => this.status() === 'loading');
  readonly isError: Signal<boolean> = computed(() => this.status() === 'error');
  readonly isResolved: Signal<boolean> = computed(() => this.status() === 'resolved');

  /** LoggingService e logger */
  protected readonly loggingService = inject(LoggingService);
  protected readonly logger: ScopedLogger =
    this.loggingService.scoped((this.constructor as { name: string }).name);

  /** Timestamp (ms) do último fetch bem-sucedido */
  private lastFetchTimestamp: number | null = null;

  /** Timer de TTL (se houver) */
  private ttlTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // 5) Logs automáticos sobre valueRaw
    effect(() => {
      const v = this.valueRaw();
      this.logger.debug(`${this.constructor.name}: valueRaw updated →`, v);
    });

    // 6) Logs automáticos sobre statusRaw
    effect(() => {
      const s = this.statusRaw();
      this.logger.debug(`${this.constructor.name}: statusRaw changed →`, s);
    });

    // 7) Quando raw entra em erro (statusRaw = 'error') ou errorSignal se torna != null,
    //    mostramos log e garantimos que o timer de TTL seja cancelado.
    effect(() => {
      if (this.errorSignal()) {
        const e = this.errorSignal();
        this.logger.warn(`${this.constructor.name}: errorSignal set →`, e);
        this._clearTtlTimer();
      }
    });

    // 8) Quando status() (combinado) é 'resolved', agendamos reload após TTL
    effect(() => {
      if (this.isResolved()) {
        this._scheduleTtlReload();
      } else {
        this._clearTtlTimer();
      }
    });
  }

  /**
   * Subclasses devem informar:
   * 1) O parâmetro inicial (P) ou undefined se P = void
   * 2) O defaultValue para T (imutável/frozen)
   * 3) A chamada real à API que retorna Promise<T>
   */

  /** Retorna o valor inicial de P (por exemplo, { id: 1 }) ou undefined se P = void */
  protected abstract getInitialParams(): P;

  /** Retorna defaultValue (imutável) de T para inicialização e em caso de erro */
  protected abstract getDefaultValue(): T;

  /** Executa a chamada real à API e retorna Promise<T> */
  protected abstract loadFromApi(params: P): Promise<T>;

  /**
   * Altera P e dispara reload automático.
   * Cancela timer de TTL se houver.
   */
  setParams(newParams: P): void {
    this.logger.info(`${this.constructor.name}: setParams →`, newParams);
    this._clearTtlTimer();
    // Limpa qualquer erro anterior antes de mudar o parâmetro
    this.errorSignal.set(null);
    this.paramsSignal.set(this._deepFreezeParams(newParams));
  }

  /**
   * Force reload (mesmos params), cancela TTL timer.
   * Também limpa errorSignal antes de recarregar.
   */
  reload(): void {
    this.logger.info(`${this.constructor.name}: reload()`);
    this._clearTtlTimer();
    this.errorSignal.set(null);
    this.resourceRef.reload();
  }

  /**
   * TTL em milissegundos. Se <= 0, desativa TTL.
   * Subclasses podem sobrescrever para retornar > 0.
   */
  protected getTtlMs(): number {
    return 0;
  }

  /** Chama depois de fetch bem-sucedido para registrar timestamp */
  private _updateLastFetch(): void {
    this.lastFetchTimestamp = Date.now();
  }

  /**
   * Agenda reload após TTL. Se TTL <= 0, não faz nada.
   * Se já expirou, recarrega imediatamente.
   */
  private _scheduleTtlReload(): void {
    const ttl = this.getTtlMs();
    if (ttl <= 0) {
      return;
    }

    // Cancelar timer anterior
    if (this.ttlTimer) {
      this._clearTtlTimer();
    }

    const elapsed = this.lastFetchTimestamp
      ? Date.now() - this.lastFetchTimestamp
      : Infinity;
    const delayMs = ttl - elapsed;

    if (delayMs <= 0) {
      this.logger.info(`${this.constructor.name}: TTL expired, reloading immediately`);
      this.reload();
    } else {
      this.logger.debug(
        `${this.constructor.name}: scheduling reload in ${delayMs}ms (TTL)`
      );
      this.ttlTimer = setTimeout(() => {
        this.logger.info(`${this.constructor.name}: TTL reached, reloading`);
        this.reload();
      }, delayMs);
    }
  }

  /** Cancela qualquer timer de TTL pendente */
  private _clearTtlTimer(): void {
    if (this.ttlTimer) {
      clearTimeout(this.ttlTimer);
      this.ttlTimer = null;
    }
  }

  /**
   * Deep-freeze recursivo do objeto P para garantir imutabilidade.
   * Se P = void ou valor não-objeto, retorna como está.
   */
  private _deepFreezeParams(obj: P): P {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
    }
    const objAsRecord = obj as Record<string, unknown>;
    Object.freeze(objAsRecord);
    for (const key of Object.keys(objAsRecord)) {
      const val = objAsRecord[key];
      if (val && typeof val === 'object' && !Object.isFrozen(val)) {
        this._deepFreezeParams(val as P);
      }
    }
    return obj;
  }
}
