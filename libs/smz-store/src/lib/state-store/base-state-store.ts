import { StateStore } from './state-store';

export type AsyncStatusStore<TState> = {
  readonly [K in keyof Pick<StateStore<TState>, 'status' | 'isError' | 'isIdle' | 'isLoaded' | 'isResolved' | 'isLoading'>]: StateStore<TState>[K];
}

export type AsyncStateStore<TState> = {
  readonly [K in keyof Pick<StateStore<TState>, 'state'>]: StateStore<TState>[K];
}

export type AsyncActionsStore<TState, TStore> = {
  reload: StateStore<TState>['reload'];
  forceReload: StateStore<TState>['forceReload'];
} & TStore;

export type AsyncSelectorsStore<TSelectors> = TSelectors;

export type AsyncErrorStore<TState> = {
  readonly [K in keyof Pick<StateStore<TState>, 'error'>]: StateStore<TState>[K];
}

export type AsyncControlsStore = {
  sleep: () => void;
  wakeUp: () => void;
}

export type SmzStore<TState, TStore, TSelectors> = {
  readonly status: AsyncStatusStore<TState>;
  readonly state: AsyncStateStore<TState>;
  readonly actions: AsyncActionsStore<TState, TStore>;
  readonly selectors: AsyncSelectorsStore<TSelectors>;
  readonly error: AsyncErrorStore<TState>;
  readonly controls: AsyncControlsStore
}
