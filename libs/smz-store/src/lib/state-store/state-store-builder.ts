/* eslint-disable @typescript-eslint/no-explicit-any */
import { EnvironmentInjector, InjectionToken, Provider } from '@angular/core';
import { getTokenName } from '../shared/injection-token-helper';
import { StateStore, StateStoreActions, StateStorePlugin } from './state-store';
import { SmzStore, AsyncActionsStore } from './base-state-store';
import { withInitialState } from './plugins';

export class StateStoreBuilder<TState, TActions> {
  private _loaderFn!: (...deps: any[]) => Promise<Partial<TState>>;
  private _name!: string;
  private _dependencies: any[] = [];
  private _plugins: StateStorePlugin<TState, StateStore<TState>>[] = [];
  private _actions: StateStoreActions<TState, TActions>[] = [];

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

  withActions(plugin: StateStoreActions<TState, TActions>): this {
    this._actions.push(plugin);
    return this;
  }

  buildProvider(token: InjectionToken<TActions>, extraDeps: any[] = []): Provider {
    const depsArray = [EnvironmentInjector, ...this._dependencies, ...extraDeps];
    return {
      provide: token,
      useFactory: (env: EnvironmentInjector, ...injectedDeps: any[]) => {
        const thisName = this._name ?? getTokenName(token);
        const thisPlugins = this._plugins;
        const thisActions = this._actions;

        const loader = () => this._loaderFn(...injectedDeps);

        class GenericStateStore extends StateStore<TState> {
          constructor() {
            super(thisName, thisPlugins, thisActions);
          }

          protected override loadFromApi(): Promise<Partial<TState>> {
            return loader();
          }
        }

        const store = new GenericStateStore();

        const clientActions: TActions = {} as TActions;
        thisActions.forEach(action => action(clientActions, env, store.updateState.bind(store), store.state.bind(store)));

        function createActions(store: StateStore<TState>, actions: TActions): AsyncActionsStore<TState, TActions> {
          return {
            reload: store.reload.bind(store),
            forceReload: store.forceReload.bind(store),
            ...actions
          };
        }

        const actions: AsyncActionsStore<TState, TActions> = createActions(store, clientActions);

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
          actions,
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
