import { StateStore } from './state-store';

export type AsyncStatusStore<TState> = {
  readonly [K in keyof Pick<StateStore<TState>, 'isError' | 'isIdle' | 'isLoaded' | 'isResolved' | 'isLoading'>]: StateStore<TState>[K];
}

export type AsyncStateStore<TState> = {
  readonly [K in keyof Pick<StateStore<TState>, 'state'>]: StateStore<TState>[K];
}

export type AsyncActionsStore<TState, TStore> = {
  [K in keyof Pick<StateStore<TState>, 'reload' | 'updateState'> | keyof TStore]: K extends keyof StateStore<TState>
    ? StateStore<TState>[K]
    : K extends keyof TStore
      ? TStore[K]
      : never;
}

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
