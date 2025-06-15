/* eslint-disable @typescript-eslint/no-explicit-any */
import { EnvironmentInjector, InjectionToken, Provider } from '@angular/core';
import { getTokenName } from '../shared/injection-token-helper';
import { StateStore, StateStoreActions, StateStorePlugin, StateStoreSelectors } from './state-store';
import { SmzStore, AsyncActionsStore } from './base-state-store';
import { withInitialState } from './plugins';

export class SmzStateStoreBuilder<TState, TActions, TSelectors = any> {
  private _loaderFn!: (injector: EnvironmentInjector, ...deps: any[]) => Promise<Partial<TState>>;
  private _name!: string;
  private _dependencies: any[] = [];
  private _plugins: StateStorePlugin<TState, StateStore<TState>>[] = [];
  private _actions: StateStoreActions<TState, TActions>[] = [];
  private _selectors: StateStoreSelectors<TState, TSelectors>[] = [];

  withScopeName(name: string): this {
    this._name = name;
    return this;
  }

  withInitialState(state: TState): this {
    this._plugins.push(withInitialState(state));
    return this;
  }

  withLoaderFn(fn: (injector: EnvironmentInjector, ...deps: any[]) => Promise<Partial<TState>>): this {
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

  withActions(actions: StateStoreActions<TState, TActions>): this {
    this._actions.push(actions);
    return this;
  }

  withSelectors(selectors: StateStoreSelectors<TState, TSelectors>): this {
    this._selectors.push(selectors);
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
        const thisSelectors = this._selectors;

        const loader = () => this._loaderFn(env, ...injectedDeps);

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

        const clientSelectors: TSelectors = {} as TSelectors;
        thisSelectors.forEach(selector => selector(clientSelectors, env, store.state.bind(store)));

        function createActions(store: StateStore<TState>, actions: TActions): AsyncActionsStore<TState, TActions> {
          return {
            reload: store.reload.bind(store),
            forceReload: store.forceReload.bind(store),
            ...actions
          };
        }

        const actions: AsyncActionsStore<TState, TActions> = createActions(store, clientActions);

        const finalStore: SmzStore<TState, TActions, TSelectors> = {
          status: {
            status: store.status,
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
          selectors: clientSelectors,
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
