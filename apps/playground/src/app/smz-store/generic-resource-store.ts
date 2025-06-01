// src/app/core/generic-resource-store.ts
import { ResourceStore } from './resource-store';

/**
 * Classe concreta que “industrializa” qualquer ResourceStore<T,P> genérico.
 *
 * Ela simplesmente implementa as três abstrações de ResourceStore:
 *   1) getInitialParams()
 *   2) getDefaultValue()
 *   3) loadFromApi(params)
 *
 * Todos esses três comportamentos são injetados via construtor como _valores_,
 * de modo que o builder consegue criar instâncias com diferentes “loaders”,
 * diferentes “initialParams” e diferentes “defaultValue”.
 */
export class GenericResourceStore<T, P extends Record<string, any> | void>
  extends ResourceStore<T, P>
{
  // 1) Os valores de configuração do store (recebidos pelo construtor)
  private readonly _initialParams: P;
  private readonly _defaultValue: T;
  private readonly _loaderFn: (params: P) => Promise<T>;
  private readonly _ttlMs: number;

  constructor(options: {
    scopeName: string;
    initialParams: P;
    defaultValue: T;
    loaderFn: (params: P) => Promise<T>;
    ttlMs?: number;
  }) {
    // Chama o construtor de ResourceStore (que já configura sinais, efeitos e logger)
    super(options.scopeName);
    this._initialParams = options.initialParams;
    this._defaultValue = options.defaultValue;
    this._loaderFn = options.loaderFn;
    this._ttlMs = options.ttlMs ?? 0;
  }

  /** 1) Parâmetro inicial para “drive” do resource */
  protected override getInitialParams(): P {
    return this._initialParams;
  }

  /** 2) Valor default que o “computed value” expõe até o loader retornar algo concreto */
  protected override getDefaultValue(): T {
    return this._defaultValue;
  }

  /** 3) A função real que faz a chamada ao “API” (pode ser qualquer Promise<T>) */
  protected override loadFromApi(params: P): Promise<T> {
    return this._loaderFn(params);
  }

  /** 4) Se quiser TTL (revalidação), basta configurar no builder; por padrão é zero */
  protected override getTtlMs(): number {
    return this._ttlMs;
  }

  /**
   * Observação: tudo o resto (signals de status, value, error, effects de logging, TTL, etc)
   * já está implementado na superclasse ResourceStore.
   * Aqui só precisamos prover as funções abstratas.
   */
}
