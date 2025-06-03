import { TestBed } from '@angular/core/testing';
import { Injectable } from '@angular/core';
import { FeatureStore } from '@smz-ui/store';
import { wrapActionWithStatus } from '../../../../libs/smz-store/src/lib/feature-store/action-wrapper';
import { vi } from 'vitest';

interface TestState {
  count: number;
}

@Injectable()
class ActionStatusStore extends FeatureStore<TestState> {
  increment: () => Promise<void>;

  constructor() {
    super('action-status');
    this.increment = wrapActionWithStatus(this, async () => {
      this.updateState({ count: this.state().count + 1 });
    }, 'increment');
  }

  protected override getInitialState(): TestState {
    return { count: 0 };
  }

  protected override loadFromApi(): Promise<Partial<TestState>> {
    return Promise.resolve({});
  }
}

describe('Action status cleanup', () => {
  let store: ActionStatusStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ActionStatusStore],
    });
    store = TestBed.inject(ActionStatusStore);
  });

  it('should remove action signal and stop effect after cleanup', () => {
    const status = store.getActionStatusSignal('increment');
    const debugSpy = vi.spyOn((store as any).logger, 'debug');

    status.set('loading');
    expect(debugSpy).toHaveBeenCalledTimes(1);

    store.clearActionStatusSignal('increment');

    status.set('resolved');
    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect((store as any).actionStatusSignals.has('increment')).toBe(false);
  });

  it('FeatureStore should clear action signals on destroy', () => {
    store.getActionStatusSignal('increment');
    const spy = vi.spyOn(store, 'clearActionStatusSignal');
    store.ngOnDestroy();
    expect(spy).toHaveBeenCalledWith('increment');
  });
});
