import { StateStore } from './state-store';

export type AsyncStatusStore<TState> = {
  readonly [K in keyof Pick<StateStore<TState>, 'isError' | 'isIdle' | 'isLoaded' | 'isResolved' | 'isLoading'>]: StateStore<TState>[K];
}

export type AsyncStateStore<TState> = {
  readonly [K in keyof Pick<StateStore<TState>, 'state'>]: StateStore<TState>[K];
}

export type AsyncActionsStore<TState, TStore> = {
  reload: StateStore<TState>['reload'];
  forceReload: StateStore<TState>['forceReload'];
} & TStore;

// TODO: Implamentar melhor no futuro, pq do jeito que está não funciona quando o objeto não existe no state em runtime.
// export type AsyncSelectorsStore<TState> = {
//   readonly [K in keyof TState as `get${Capitalize<string & K>}`]: Signal<TState[K]>;
// }

export type AsyncErrorStore<TState> = {
  readonly [K in keyof Pick<StateStore<TState>, 'error'>]: StateStore<TState>[K];
}

export type SmzStore<TState, TStore> = {
  readonly status: AsyncStatusStore<TState>;
  readonly state: AsyncStateStore<TState>;
  readonly actions: AsyncActionsStore<TState, TStore>;
  // readonly selectors: AsyncSelectorsStore<TState>;
  readonly error: AsyncErrorStore<TState>;
}
