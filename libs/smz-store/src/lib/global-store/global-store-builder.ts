/* eslint-disable @typescript-eslint/no-explicit-any */
import { EnvironmentInjector, InjectionToken, Provider } from '@angular/core';
import { GenericGlobalStore } from './generic-global-store';
import { getTokenName } from '../shared/injection-token-helper';

export class GlobalStoreBuilder<T, TStore> {
  private _initialState!: T;
  private _loaderFn!: (...deps: any[]) => Promise<Partial<T>>;
  private _ttlMs = 0;
  private _name!: string;
  private _dependencies: any[] = [];

  withInitialState(state: T): this {
    this._initialState = state;
    return this;
  }

  withLoaderFn(fn: (...deps: any[]) => Promise<Partial<T>>): this {
    this._loaderFn = fn;
    return this;
  }

  withAutoRefresh(milliseconds: number): this {
    this._ttlMs = milliseconds;
    return this;
  }

  addDependency(dep: any): this {
    this._dependencies.push(dep);
    return this;
  }

  buildProvider(token: InjectionToken<GenericGlobalStore<T, TStore>>, extraDeps: any[] = []): Provider {
    const depsArray = [EnvironmentInjector, ...this._dependencies, ...extraDeps];
    return {
      provide: token,
      useFactory: (env: EnvironmentInjector, ...injectedDeps: any[]) => {
        if (!token) {
          throw new Error('Token is required');
        }

        const loader = () => this._loaderFn(...injectedDeps);

        const store = new GenericGlobalStore<T, TStore>({
          scopeName: this._name ?? getTokenName(token),
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

