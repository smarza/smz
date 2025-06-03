/* eslint-disable @typescript-eslint/no-explicit-any */
import { EnvironmentInjector, InjectionToken, Provider } from '@angular/core';
import { GenericGlobalStore } from './generic-global-store';
import { getTokenName } from '../shared/injection-token-helper';

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

  withAutoRefresh(milliseconds: number): this {
    this._ttlMs = milliseconds;
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addDependency(_dep: any): this {
    return this;
  }

  buildProvider(token: InjectionToken<GenericGlobalStore<T>>, extraDeps: any[] = []): Provider {
    const depsArray = [EnvironmentInjector, ...extraDeps];
    return {
      provide: token,
      useFactory: (env: EnvironmentInjector, ...injectedDeps: any[]) => {

        if (!token) {
          throw new Error('Token is required');
        }

        const loader = () => this._loaderFn(...injectedDeps);

        const store = new GenericGlobalStore<T>({
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

