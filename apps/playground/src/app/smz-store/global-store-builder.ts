import { EnvironmentInjector, InjectionToken, Provider } from '@angular/core';
import { GenericGlobalStore } from './generic-global-store';

export class GlobalStoreBuilder<T> {
  private _initialState!: T;
  private _loaderFn!: (...deps: any[]) => Promise<Partial<T>>;
  private _ttlMs = 0;
  private _name!: string;

  withInitialState(state: T): this {
    this._initialState = state;
    return this;
  }

  withLoaderFn(fn: (...deps: any[]) => Promise<Partial<T>>): this {
    this._loaderFn = fn;
    return this;
  }

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withTtlMs(ttlMs: number): this {
    this._ttlMs = ttlMs;
    return this;
  }

  addDependency(_dep: any): this {
    return this;
  }

  buildProvider(token: InjectionToken<GenericGlobalStore<T>>, extraDeps: any[] = []): Provider {
    const depsArray = [EnvironmentInjector, ...extraDeps];
    return {
      provide: token,
      useFactory: (env: EnvironmentInjector, ...injectedDeps: any[]) => {
        const loader = () => this._loaderFn(...injectedDeps);
        const store = new GenericGlobalStore<T>({
          scopeName: this._name ?? (token as any).desc ?? token.toString(),
          initialState: this._initialState,
          loaderFn: loader,
          ttlMs: this._ttlMs,
        });
        void store.reload();
        return store;
      },
      deps: depsArray,
    };
  }
}

