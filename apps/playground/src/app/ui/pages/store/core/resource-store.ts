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
 * Generic base class for any store that loads a single "resource" T
 * based on a parameter object P.
 *
 * T = the type of the data returned by the API (for example: User, Post[])
 * P = the "params" object used to drive the resource loader (for example: { id: number }).
 *     If a store doesn't need params, use P = void.
 *
 * This class sets up:
 *  - A WritableSignal<P> called paramsSignal
 *  - A ResourceRef<T> called resourceRef
 *  - computed() signals: value, status, error, errorMessage, isLoading, isError, isResolved
 *  - auto‐logging effects when value or status changes
 *  - public methods setParams(...) and reload()
 *
 * Production considerations já embutidas:
 *  - Exposição direta de error() e errorMessage
 *  - Flags booleanas de loading / error / resolved
 *  - Deep‐freeze recursivo em parâmetros antes de mudar o sinal
 *  - Ponto de extensão para cache com TTL / revalidação automática
 */
@Injectable({ providedIn: 'root' })
export abstract class ResourceStore<T, P extends Record<string, any> | void> {
  /**
   * O sinal interno que guarda nossos parâmetros atuais (P).
   * Se P = void, getInitialParams() deve retornar undefined.
   */
  protected readonly paramsSignal: WritableSignal<P> =
    signal<P>(this._deepFreezeParams(this.getInitialParams()));

  /**
   * O ResourceRef<T> que executa loader sempre que paramsSignal() muda.
   * O defaultValue faz com que value() NUNCA retorne undefined.
   */
  protected readonly resourceRef: ResourceRef<T> = resource<T, P>({
    params: () => this.paramsSignal(),
    loader: async ({ params }) => {
      const logger = this.logger;
      logger.info(`${this.constructor.name}: loader() invoked with params=`, params);
      try {
        // Chama o método concreto que faz fetch na API
        const result = await this.loadFromApi(params as P);
        // Congela o objeto retornado para manter imutabilidade
        return Object.freeze(result as T);
      } catch (err: unknown) {
        logger.error(`${this.constructor.name}: loader() error for params=`, params, err);
        throw err; // dispara status() === 'error' no ResourceRef
      }
    },
    defaultValue: this.getDefaultValue()
  });

  /** Sinal somente‐leitura contendo o valor atual carregado (ou defaultValue) */
  readonly value: Signal<T> = computed(() => this.resourceRef.value());

  /** Sinal somente‐leitura contendo status: 'idle' | 'loading' | 'resolved' | 'error' */
  readonly status: Signal<ResourceStatus> = computed(() => this.resourceRef.status());

  /**
   * Sinal somente‐leitura contendo o erro lançado (se houver).
   * No Angular 20+, ResourceRef<T> expõe .error() caso loader tenha lançado.
   */
  readonly error: Signal<unknown> = computed(() => this.resourceRef.error());

  /**
   * Sinal somente‐leitura contendo mensagem amigável de erro (string|null).
   * Por padrão, usamos .error()?.message; subclasses podem estender para mapeamentos custom.
   */
  readonly errorMessage: Signal<string | null> = computed(() => {
    const err = this.error();
    if (err == null) {
      return null;
    }
    // Se err for Error, retorne err.message; senão, toString()
    return err instanceof Error ? err.message : String(err);
  });

  /** Flag booleana para facilitar uso em templates (status === 'loading') */
  readonly isLoading: Signal<boolean> = computed(() => this.status() === 'loading');

  /** Flag booleana (status === 'error') */
  readonly isError: Signal<boolean> = computed(() => this.status() === 'error');

  /** Flag booleana (status === 'resolved') */
  readonly isResolved: Signal<boolean> = computed(() => this.status() === 'resolved');

  /** LoggingService e logger específico desta classe */
  protected readonly loggingService = inject(LoggingService);
  protected readonly logger: ScopedLogger =
    this.loggingService.scoped((this.constructor as { name: string }).name);

  constructor() {
    // Registra automaticamente mudanças em value()
    effect(() => {
      const v = this.value();
      // Opcional: não logar o defaultValue inicial (p. ex. JSON de "Loading…")
      // Poderíamos checar if (this.status() !== 'idle') antes de logar
      this.logger.debug(`${this.constructor.name}: value updated →`, v);
    });

    // Registra automaticamente mudanças em status()
    effect(() => {
      const s = this.status();
      this.logger.debug(`${this.constructor.name}: status changed →`, s);
    });

    // Registra automaticamente a mensagem de erro caso status() === 'error'
    effect(() => {
      if (this.isError()) {
        this.logger.warn(
          `${this.constructor.name}: encountered error →`,
          this.errorMessage()
        );
      }
    });

    // TODO: Se quiser implementar TTL / revalidação automática:
    // effect(() => {
    //   const s = this.status();
    //   if (s === 'resolved') {
    //     // compare lastFetchTimestamp + ttl < Date.now()
    //     // this.logger.info(`${this.constructor.name}: TTL expired, reloading`);
    //     // this.reload();
    //   }
    // });
  }

  /**
   * Cada subclasse deve informar:
   * 1) O parâmetro inicial (P) ou undefined (caso P = void)
   * 2) O defaultValue para T (para que value() nunca seja undefined)
   * 3) Como carregar T a partir de P (Promise<T>)
   */

  /** Retorna o valor inicial de P (por exemplo, { id: 1 }) ou undefined se P = void */
  protected abstract getInitialParams(): P;

  /** Retorna o defaultValue de T (deve ser imutável/`Object.freeze`) */
  protected abstract getDefaultValue(): T;

  /** Executa a chamada real à API e retorna Promise<T> */
  protected abstract loadFromApi(params: P): Promise<T>;

  /**
   * Método público para alterar P e disparar reload automático.
   * Por exemplo, setParams({ id: 5 }) ou setParams(undefined) se P = void.
   */
  setParams(newParams: P): void {
    this.logger.info(`${this.constructor.name}: setParams →`, newParams);
    this.paramsSignal.set(this._deepFreezeParams(newParams));
  }

  /**
   * Força recarga do resource mesmo que paramsSignal() não tenha mudado.
   */
  reload(): void {
    this.logger.info(`${this.constructor.name}: reload()`);
    this.resourceRef.reload();
  }

  /**
   * Garante imutabilidade de P (recursivamente faz Object.freeze).
   * Se P = void ou valor primitivo, retorna diretamente.
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
