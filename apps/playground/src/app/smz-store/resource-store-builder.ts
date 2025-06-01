// src/app/core/resource-store-builder.ts
import {
  EnvironmentInjector,
  Provider,
  InjectionToken,
} from '@angular/core';
import { GenericResourceStore } from './generic-resource-store';

export class ResourceStoreBuilder<
  T,
  P extends Record<string, any> | void
> {
  private _initialParams!: P;
  private _defaultValue!: T;
  private _loaderFn!: (params: P, ...deps: any[]) => Promise<T>;
  private _ttlMs = 0;
  private _name!: string;

  /**
   * Configura os parâmetros iniciais (P).
   */
  withInitialParams(params: P): this {
    this._initialParams = params;
    return this;
  }

  /**
   * Configura o defaultValue (T) retornado enquanto o backend não responder.
   */
  withDefaultValue(defaultValue: T): this {
    this._defaultValue = defaultValue;
    return this;
  }

  /**
   * Configura a função que carrega o recurso.
   * O loaderFn pode receber, além de `params`, qualquer número de dependências
   * que forem registradas via `addDependency(...)`.
   */
  withLoaderFn(loaderFn: (params: P, ...deps: any[]) => Promise<T>): this {
    this._loaderFn = loaderFn;
    return this;
  }

  withName(name: string): this {
    this._name = name;
    return this;
  }

  /**
   * Se quiser revalidação automática (TTL), informe aqui o tempo em milissegundos.
   */
  withTtlMs(ttlMs: number): this {
    this._ttlMs = ttlMs;
    return this;
  }

  /**
   * Adiciona uma dependência que será injetada na factory.
   * Exemplo: .addDependency(UserApiService)
   */
  addDependency(dep: any): this {
    // Armazenamos a classe na lista, mas não precisamos guardá-la aqui
    return this;
  }

  /**
   * Monta e retorna um Provider Angular, que associa um InjectionToken genérico
   * (por ex. USER_RESOURCE_STORE_TOKEN) à instância de GenericResourceStore<T,P>
   * criada em runtime.
   *
   * @param token InjectionToken<GenericResourceStore<T, P>>
   * @param extraDeps Lista de serviços injetáveis que o loaderFn usa
   */
  buildProvider(
    token: InjectionToken<GenericResourceStore<T, P>>,
    extraDeps: any[] = []
  ): Provider {
    // O Angular vai injetar, nesta ordem: EnvironmentInjector e cada classe em extraDeps
    const depsArray = [EnvironmentInjector, ...extraDeps];

    return {
      provide: token,
      useFactory: (
        envInjector: EnvironmentInjector,
        ...injectedDeps: any[]
      ) => {
        // Crie o loader que passa params + dependências injetadas
        const adaptedLoader = (params: P) =>
          this._loaderFn(params, ...injectedDeps);

        // Instancia o GenericResourceStore
        const store = new GenericResourceStore<T, P>({
          scopeName: this._name ?? (token as any).desc ?? token.toString(),
          initialParams: this._initialParams,
          defaultValue: this._defaultValue,
          loaderFn: adaptedLoader,
          ttlMs: this._ttlMs,
        });

        // Como no construtor do ResourceStore ele usou getInitialParams() indefinido,
        // precisamos forçar o loader a rodar com o valor correto:
        store.setParams(this._initialParams);

        return store;
      },
      deps: depsArray,
    };
  }
}
