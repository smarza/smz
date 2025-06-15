/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Injector,
  inject,
  DestroyRef,
  InjectionToken,
  Provider,
} from '@angular/core';
import { getTokenName } from '../shared/injection-token-helper';
import {
  StateStore,
  StateStoreActions,
  StateStorePlugin,
  StateStoreSelectors,
} from './state-store';
import { SmzStore, AsyncActionsStore } from './base-state-store';
import { withInitialState } from './plugins';

export class SmzStateStoreBuilder<TState, TActions, TSelectors = any> {
  private _loaderFn!: (
    injector: Injector,
    ...deps: any[]
  ) => Promise<Partial<TState>>;
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

  withLoaderFn(
    fn: (injector: Injector, ...deps: any[]) => Promise<Partial<TState>>
  ): this {
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

  /**
   * Cria a SmzStore, registra onDestroy e retorna o objeto final.
   * Usa inject(DestroyRef) para atachar o cleanup ao scope correto.
   */
  private instantiateStore(
    tokenName: string,
    injector: Injector,
    injectedDeps: any[]
  ): SmzStore<TState, TActions, TSelectors> {
    // aqui garantimos que o DestroyRef venha do injector atual
    const destroyRef = inject(DestroyRef);

    const name = this._name ?? tokenName;
    const plugins = this._plugins;
    const actionsDef = this._actions;
    const selsDef = this._selectors;
    const loader = () => this._loaderFn(injector, ...injectedDeps);

    // classe interna que implementa a store real
    class GenericStateStore extends StateStore<TState> {
      constructor() {
        super(name, plugins, actionsDef);
      }
      protected override loadFromApi(): Promise<Partial<TState>> {
        return loader();
      }
    }

    const store = new GenericStateStore();

    // cleanup automático ao destructor do injector (root / rota / componente)
    destroyRef.onDestroy(() => {
      store.ngOnDestroy?.();
      plugins.forEach((p) => p.destroy?.());
    });

    // montar actions
    const clientActions = {} as TActions;
    actionsDef.forEach((a) =>
      a(
        clientActions,
        injector,
        store.updateState.bind(store),
        store.state.bind(store)
      )
    );

    // montar selectors
    const clientSelectors = {} as TSelectors;
    selsDef.forEach((s) =>
      s(clientSelectors, injector, store.state.bind(store))
    );

    // adicionar reload / forceReload
    const actions: AsyncActionsStore<TState, TActions> = {
      reload: store.reload.bind(store),
      forceReload: store.forceReload.bind(store),
      ...clientActions,
    };

    return {
      status: {
        status: store.status,
        isLoading: store.isLoading,
        isError: store.isError,
        isResolved: store.isResolved,
        isIdle: store.isIdle,
        isLoaded: store.isLoaded,
      },
      state: { state: store.state },
      actions,
      selectors: clientSelectors,
      error: { error: store.error },
      controls: {
        sleep: () => plugins.forEach((p) => p.sleep?.()),
        wakeUp: () => plugins.forEach((p) => p.wakeUp?.()),
      }
    };
  }

  /**
   * Provider para ROOT (aplicação inteira).
   */
  buildProvider(
    token: InjectionToken<TActions>,
    extraDeps: any[] = []
  ): Provider {
    const tokenName = getTokenName(token);
    return {
      provide: token,
      useFactory: (injector: Injector, ...injectedDeps: any[]) =>
        this.instantiateStore(tokenName, injector, injectedDeps),
      deps: [Injector, ...this._dependencies, ...extraDeps],
    };
  }
}
