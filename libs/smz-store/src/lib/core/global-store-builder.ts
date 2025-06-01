// src/app/core/global-store-builder.ts
import { EnvironmentInjector, Provider, InjectionToken } from '@angular/core';
import { GenericGlobalStore } from './generic-global-store';

export class GlobalStoreBuilder<
  T extends Record<string, any>,
  P extends Record<string, any> | void,
> {
  private _initialState!: T;
  private _initialParams!: P;
  private _loaderFn!: (params: P, ...deps: any[]) => Promise<Partial<T>>;
  private _ttlMs = 0;

  withInitialState(state: T): this {
    this._initialState = state;
    return this;
  }

  withInitialParams(params: P): this {
    this._initialParams = params;
    return this;
  }

  withLoaderFn(fn: (params: P, ...deps: any[]) => Promise<Partial<T>>): this {
    this._loaderFn = fn;
    return this;
  }

  withTtlMs(ttl: number): this {
    this._ttlMs = ttl;
    return this;
  }

  addDependency(dep: any): this {
    return this;
  }

  buildProvider(
    token: InjectionToken<GenericGlobalStore<T, P>>,
    extraDeps: any[] = [],
  ): Provider {
    const depsArray = [EnvironmentInjector, ...extraDeps];
    return {
      provide: token,
      useFactory: (env: EnvironmentInjector, ...deps: any[]) => {
        const adaptedLoader = (params: P) => this._loaderFn(params, ...deps);
        const store = new GenericGlobalStore<T, P>({
          initialState: this._initialState,
          initialParams: this._initialParams,
          loaderFn: adaptedLoader,
          ttlMs: this._ttlMs,
        });
        // ensure correct params
        store.setParams(this._initialParams);
        return store;
      },
      deps: depsArray,
    };
  }
}
