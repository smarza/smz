/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  EnvironmentInjector,
  Provider,
  InjectionToken,
} from '@angular/core';
import { GenericResourceStore } from './generic-resource-store';
import { getTokenName } from '../shared/injection-token-helper';

export class ResourceStoreBuilder<
  T,
  P extends Record<string, any> | void
> {
  private _initialParams!: P;
  private _defaultValue!: T;
  private _loaderFn!: (params: P, ...deps: any[]) => Promise<T>;
  private _ttlMs = 0;
  private _name!: string;

  /**
   * Sets the initial parameters (P).
   */
  withInitialParams(params: P): this {
    this._initialParams = params;
    return this;
  }

  /**
   * Sets the defaultValue (T) returned while the backend hasn't responded.
   */
  withDefaultValue(defaultValue: T): this {
    this._defaultValue = defaultValue;
    return this;
  }

  /**
   * Configures the function that loads the resource.
   * The loaderFn may receive, besides `params`, any number of dependencies
   * registered via `addDependency(...)`.
   */
  withLoaderFn(loaderFn: (params: P, ...deps: any[]) => Promise<T>): this {
    this._loaderFn = loaderFn;
    return this;
  }

  /**
   * If automatic revalidation (TTL) is desired, specify the time in milliseconds.
   */
  withAutoRefresh(milliseconds: number): this {
    this._ttlMs = milliseconds;
    return this;
  }

  /**
   * Adds a dependency that will be injected in the factory.
   * Example: .addDependency(UserApiService)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addDependency(dep: any): this {
    // We store the class in the list but don't need to keep it here
    return this;
  }

  /**
   * Builds and returns an Angular Provider that associates a generic InjectionToken
   * (e.g. USER_RESOURCE_STORE_TOKEN) with the runtime GenericResourceStore<T,P> instance.
   *
   * @param token InjectionToken<GenericResourceStore<T, P>>
   * @param extraDeps List of injectable services used by loaderFn
   */
  buildProvider(
    token: InjectionToken<GenericResourceStore<T, P>>,
    extraDeps: any[] = []
  ): Provider {

    if (!token) {
      throw new Error('Token is required');
    }

    // Angular will inject, in this order: EnvironmentInjector and each class in extraDeps
    const depsArray = [EnvironmentInjector, ...extraDeps];

    return {
      provide: token,
      useFactory: (
        envInjector: EnvironmentInjector,
        ...injectedDeps: any[]
      ) => {
        // Create the loader that passes params plus the injected dependencies
        const adaptedLoader = (params: P) =>
          this._loaderFn(params, ...injectedDeps);

        // Instantiate the GenericResourceStore
        const store = new GenericResourceStore<T, P>({
          scopeName: this._name ?? getTokenName(token),
          initialParams: this._initialParams,
          defaultValue: this._defaultValue,
          loaderFn: adaptedLoader,
          ttlMs: this._ttlMs,
        });

        // Since the ResourceStore constructor used getInitialParams() undefined,
        // we need to force the loader to run with the correct value:
        store.setParams(this._initialParams);

        return store;
      },
      deps: depsArray,
    };
  }
}
