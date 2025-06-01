import { DestroyRef, EnvironmentInjector, InjectionToken, Provider } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { GenericFeatureStore } from './generic-feature-store';

export class FeatureStoreBuilder<T> {
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

  buildProvider(token: InjectionToken<GenericFeatureStore<T>>, extraDeps: any[] = []): Provider {
    const depsArray = [EnvironmentInjector, DestroyRef, Router, ...extraDeps];
    return {
      provide: token,
      useFactory: (
        env: EnvironmentInjector,
        destroyRef: DestroyRef,
        router: Router,
        ...injectedDeps: any[]
      ) => {

        const loader = () => this._loaderFn(...injectedDeps);
        const store = new GenericFeatureStore<T>({
          scopeName: this._name ?? (token as any).desc ?? token.toString(),
          initialState: this._initialState,
          loaderFn: loader,
          ttlMs: this._ttlMs,
        });

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

        void store.reload();
        return store;
      },
      deps: depsArray,
    };
  }
}
