/* eslint-disable @typescript-eslint/no-explicit-any */
import { EnvironmentInjector, InjectionToken, Provider } from '@angular/core';
import { getTokenName } from '../shared/injection-token-helper';
import { StateStore, StateStoreImplementation, StateStorePlugin } from './state-store';
import { BaseStateStore } from './base-state-store';

export class StateStoreBuilder<TState, TStore extends BaseStateStore<TState>> {
  private _initialState!: TState;
  private _loaderFn!: (...deps: any[]) => Promise<Partial<TState>>;
  private _name!: string;
  private _dependencies: any[] = [];
  private _plugins: StateStorePlugin<TState, StateStore<TState, TStore>>[] = [];
  private _implementations: StateStoreImplementation<TState, TStore>[] = [];

  withScopeName(name: string): this {
    this._name = name;
    return this;
  }

  withInitialState(state: TState): this {
    this._initialState = state;
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

  withPlugin(plugin: StateStorePlugin<TState, StateStore<TState, TStore>>): this {
    this._plugins.push(plugin);
    return this;
  }

  withActions(plugin: StateStoreImplementation<TState, TStore>): this {
    this._implementations.push(plugin);
    return this;
  }

  buildProvider(token: InjectionToken<TStore>, extraDeps: any[] = []): Provider {
    const depsArray = [EnvironmentInjector, ...this._dependencies, ...extraDeps];
    return {
      provide: token,
      useFactory: (env: EnvironmentInjector, ...injectedDeps: any[]) => {
        const thisName = this._name ?? getTokenName(token);
        const thisPlugins = this._plugins;
        const thisImplementations = this._implementations;
        const thisInitialState = this._initialState;
        const loader = () => this._loaderFn(...injectedDeps);

        class GenericStateStore extends StateStore<TState, TStore> {
          constructor() {
            super(thisName, thisPlugins as StateStorePlugin<TState, StateStore<TState, TStore>>[], thisImplementations as StateStoreImplementation<TState, TStore>[]);
          }

          public override initializeState(): void {
            this.logger.debug('Initializing state', thisInitialState);
            this.updateState(thisInitialState);
          }

          protected override loadFromApi(): Promise<Partial<TState>> {
            return loader();
          }
        }

        const store = new GenericStateStore();

        if (store.state() == null && thisInitialState != null) {
          void store.initializeState();
        }

        // Create a proxy that only exposes specific methods from StateStore
        const exposedStateStoreMethods: BaseStateStore<TState> = {
          state: store.state,
          status: store.status,
          error: store.error,
          isLoading: store.isLoading,
          isError: store.isError,
          isResolved: store.isResolved,
          isIdle: store.isIdle,
          isLoaded: store.isLoaded,
          reload: store.reload.bind(store),
          updateState: store.updateState.bind(store),
        };

        // Create the final store by combining exposed StateStore methods with TStore
        const finalStore = {
          ...exposedStateStoreMethods,
        } as TStore;

        return finalStore;
      },
      deps: depsArray,
    };
  }
}
