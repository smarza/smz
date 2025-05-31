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
  private _deps: any[] = [];

  withInitialParams(params: P): this {
    this._initialParams = params;
    return this;
  }

  withDefaultValue(defaultValue: T): this {
    this._defaultValue = defaultValue;
    return this;
  }

  withLoaderFn(loaderFn: (params: P, ...deps: any[]) => Promise<T>): this {
    this._loaderFn = loaderFn;
    return this;
  }

  withTtlMs(ttlMs: number): this {
    this._ttlMs = ttlMs;
    return this;
  }

  addDependency(dep: any): this {
    this._deps.push(dep);
    return this;
  }

  buildProvider(
    token: InjectionToken<GenericResourceStore<T, P>>,
    extraDeps: any[] = []
  ): Provider {
    // O Angular vai injetar, nesta ordem: EnvironmentInjector, depois cada service em extraDeps
    const depsArray = [EnvironmentInjector, ...extraDeps];

    return {
      provide: token,
      useFactory: (
        envInjector: EnvironmentInjector,
        ...injectedDeps: any[]
      ) => {
        // “injectedDeps[i]” corresponde a extraDeps[i]. Ex.: UserApiService em injectedDeps[0].
        const adaptedLoader = (params: P) => {
          return this._loaderFn(params, ...injectedDeps);
        };

        return new GenericResourceStore<T, P>({
          initialParams: this._initialParams,
          defaultValue: this._defaultValue,
          loaderFn: adaptedLoader,
          ttlMs: this._ttlMs,
        });
      },
      deps: depsArray,
    };
  }
}
