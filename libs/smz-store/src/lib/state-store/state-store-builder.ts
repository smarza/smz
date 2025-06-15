/* eslint-disable @typescript-eslint/no-explicit-any */
import { EnvironmentInjector, InjectionToken, Provider } from '@angular/core';
import { getTokenName } from '../shared/injection-token-helper';
import { StateStore, StateStoreImplementation, StateStorePlugin } from './state-store';
import { SmzStore, AsyncActionsStore } from './base-state-store';
import { withInitialState } from './plugins';

export class StateStoreBuilder<TState, TActions> {
  private _loaderFn!: (...deps: any[]) => Promise<Partial<TState>>;
  private _name!: string;
  private _dependencies: any[] = [];
  private _plugins: StateStorePlugin<TState, StateStore<TState>>[] = [];
  private _implementations: StateStoreImplementation<TState, TActions>[] = [];

  withScopeName(name: string): this {
    this._name = name;
    return this;
  }

  withInitialState(state: TState): this {
    this._plugins.push(withInitialState(state));
    return this;
  }

  withLoaderFn(fn: (...deps: any[]) => Promise<Partial<TState>>): this {
    this._loaderFn = fn;
    return this;
  }

  addDependency(dep: any): this {
    this._dependencies.push(dep);
    return this;
  }

  withPlugin(plugin: StateStorePlugin<TState, StateStore<TState>>): this {
    this._plugins.push(plugin);
    return this;
  }

  withActions(plugin: StateStoreImplementation<TState, TActions>): this {
    this._implementations.push(plugin);
    return this;
  }

  buildProvider(token: InjectionToken<TActions>, extraDeps: any[] = []): Provider {
    const depsArray = [EnvironmentInjector, ...this._dependencies, ...extraDeps];
    return {
      provide: token,
      useFactory: (env: EnvironmentInjector, ...injectedDeps: any[]) => {
        const thisName = this._name ?? getTokenName(token);
        const thisPlugins = this._plugins;
        const thisImplementations = this._implementations;
        // const thisInitialState = this._initialState;
        const loader = () => this._loaderFn(...injectedDeps);

        class GenericStateStore extends StateStore<TState> {
          constructor() {
            super(thisName, thisPlugins as StateStorePlugin<TState, StateStore<TState>>[], thisImplementations as StateStoreImplementation<TState, TActions>[]);
          }

          protected override loadFromApi(): Promise<Partial<TState>> {
            return loader();
          }
        }

        const store = new GenericStateStore();
        thisImplementations.forEach(impl => impl(store as any, store.updateState.bind(store), store.state.bind(store)));

        // console.log('--- preparing selectors for store', store.state());
        // const selectors = Object.keys(store.state() as object).reduce((acc, key) => ({
        //   ...acc,
        //   [`get${key.charAt(0).toUpperCase()}${key.slice(1)}`]: computed(() => store.state()[key as keyof TState])
        // }), {} as AsyncSelectorsStore<TState>);
        // console.log('--- selectors prepared', selectors);

        const finalStore: SmzStore<TState, TActions> = {
          status: {
            isLoading: store.isLoading,
            isError: store.isError,
            isResolved: store.isResolved,
            isIdle: store.isIdle,
            isLoaded: store.isLoaded,
          },
          state: {
            state: store.state,
          },
          actions: store as unknown as AsyncActionsStore<TState, TActions>,
          // selectors,
          error: {
            error: store.error,
          },
        };

        return finalStore;
      },
      deps: depsArray,
    };
  }
}
