/* eslint-disable @typescript-eslint/no-explicit-any */
import { DestroyRef, EnvironmentInjector, InjectionToken, Provider } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { GenericFeatureStore } from './generic-feature-store';
import { getTokenName } from '../shared/injection-token-helper';
import { wrapActionWithStatus } from './action-wrapper';

export class FeatureStoreBuilder<TState, TStore extends GenericFeatureStore<TState, TStore> = GenericFeatureStore<TState, any>> {
  private _initialState!: TState;
  private _loaderFn!: (...deps: any[]) => Promise<Partial<TState>>;
  private _ttlMs = 0;
  private _name!: string;
  private _deps: any[] = [];
  private _setupFns: Array<(store: TStore, ...deps: any[]) => void> = [];

  withAction(
    name:  Extract<keyof TStore, string>,
    factory: (
      store: TStore,
      ...deps: any[]
    ) => (...args: any[]) => Promise<void>
  ): this {
    this._setupFns.push((store: TStore, ...deps: any[]) => {
      const action = factory(store, ...deps);
      (store as any)[name] = wrapActionWithStatus(store as any, action, name);
    });
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

  withAutoRefresh(milliseconds: number): this {
    this._ttlMs = milliseconds;
    return this;
  }

  addDependency(dep: any): this {
    this._deps.push(dep);
    return this;
  }

  withSetup(fn: (store: GenericFeatureStore<TState, TStore>, ...deps: any[]) => void): this {
    this._setupFns.push(fn);
    return this;
  }

  buildProvider(token: InjectionToken<GenericFeatureStore<TState, TStore>>, extraDeps: any[] = []): Provider {
    const depsArray = [EnvironmentInjector, DestroyRef, Router, ...this._deps, ...extraDeps];
    return {
      provide: token,
      useFactory: (
        env: EnvironmentInjector,
        destroyRef: DestroyRef,
        router: Router,
        ...injectedDeps: any[]
      ) => {

        if (!token) {
          throw new Error('Token is required');
        }

        const loader = () => this._loaderFn(...injectedDeps);

        const store = new GenericFeatureStore<TState, TStore>({
          scopeName: this._name ?? getTokenName(token),
          initialState: this._initialState,
          loaderFn: loader,
          ttlMs: this._ttlMs,
        }) as TStore;

        const initialUrl = router.url;
        const sub = router.events
          .pipe(filter((ev) => ev instanceof NavigationStart || ev instanceof NavigationEnd))
          .subscribe((ev) => {
            if (ev instanceof NavigationStart) {
              store.pauseTtl();
            } else if (ev instanceof NavigationEnd) {
              if (router.url === initialUrl) {
                store.resumeTtl();
              } else {
                store.pauseTtl();
              }
            }
          });

        destroyRef.onDestroy(() => {
          sub.unsubscribe();
          store.ngOnDestroy();
        });

        this._setupFns.forEach((fn) => fn(store, ...injectedDeps));

        void store.reload();
        return store;
      },
      deps: depsArray,
    };
  }
}
