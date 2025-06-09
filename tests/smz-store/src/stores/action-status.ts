// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { TestBed } from '@angular/core/testing';
// import { Injectable } from '@angular/core';
// import { FeatureStore, IStoreHistoryService, wrapActionWithStatus } from '@smz-ui/store';
// import { vi } from 'vitest';
// import { LOGGING_SERVICE, LOGGING_CONFIG, ILoggingService } from '@smz-ui/core';
// import { STORE_HISTORY_SERVICE } from '@smz-ui/store';

// interface TestState {
//   count: number;
// }

// class MockLogger implements ILoggingService {
//   debug = vi.fn((...args) => {
//     console.log('MockLogger.debug called with:', args);
//   });
//   info = vi.fn((...args) => {
//     console.log('MockLogger.info called with:', args);
//   });
//   warn = vi.fn((...args) => {
//     console.log('MockLogger.warn called with:', args);
//   });
//   error = vi.fn((...args) => {
//     console.log('MockLogger.error called with:', args);
//   });
//   scoped = () => this;
// }

// class MockStoreHistoryService implements IStoreHistoryService {
//   trackEvent = vi.fn((event) => {
//     console.log('StoreHistoryService.trackEvent called with:', event);
//   });
//   getEventsByStore = vi.fn();
//   getAllEvents = vi.fn();
//   clearHistory = vi.fn();
// }

// @Injectable()
// class ActionStatusStore extends FeatureStore<TestState, ActionStatusStore> {
//   increment: () => Promise<void>;

//   constructor() {
//     super('action-status');
//     this.increment = wrapActionWithStatus(this as any, async () => {
//       this.updateState({ count: this.state().count + 1 });
//     }, 'increment');
//   }

//   protected override getInitialState(): TestState {
//     return { count: 0 };
//   }

//   protected override loadFromApi(): Promise<Partial<TestState>> {
//     return Promise.resolve({});
//   }
// }

// describe('Action status cleanup', () => {
//   let store: ActionStatusStore;
//   let mockLogger: MockLogger;
//   let mockStoreHistoryService: MockStoreHistoryService;

//   beforeEach(() => {
//     mockLogger = new MockLogger();
//     mockStoreHistoryService = new MockStoreHistoryService();
//     TestBed.configureTestingModule({
//       providers: [
//         ActionStatusStore,
//         { provide: LOGGING_CONFIG, useValue: { level: 'debug' } },
//         { provide: LOGGING_SERVICE, useValue: mockLogger },
//         { provide: STORE_HISTORY_SERVICE, useValue: mockStoreHistoryService },
//       ],
//     });
//     store = TestBed.inject(ActionStatusStore);
//   });

//   it('should remove action signal and stop effect after cleanup', async () => {
//     console.log('Test started');
//     const status = store.getActionStatusSignal('increment');
//     console.log('Got action status signal');

//     status.set('loading');
//     console.log('Set status to loading');
//     status(); // Read to trigger effect
//     console.log('Read status value:', status());

//     await Promise.resolve(); // Let microtasks/effects flush
//     console.log('After microtask flush');
//     console.log('Debug calls:', mockLogger.debug.mock.calls);
//     console.log('Track event calls:', mockStoreHistoryService.trackEvent.mock.calls);
//     console.log('Debug calls length:', mockLogger.debug.mock.calls.length);
//     expect(mockLogger.debug).toHaveBeenCalledTimes(0);

//     store.clearActionStatusSignal('increment');
//     console.log('Cleared action status signal');
//     console.log('Action status signals:', (store as any).actionStatusSignals);

//     status.set('resolved');
//     console.log('Set status to resolved');
//     status(); // Read to trigger effect
//     console.log('Read status value:', status());

//     await Promise.resolve();
//     console.log('After second microtask flush');
//     console.log('Debug calls:', mockLogger.debug.mock.calls);
//     console.log('Track event calls:', mockStoreHistoryService.trackEvent.mock.calls);
//     console.log('Debug calls length:', mockLogger.debug.mock.calls.length);
//     expect(mockLogger.debug).toHaveBeenCalledTimes(1);
//     expect((store as any).actionStatusSignals.has('increment')).toBe(false);
//   });

//   it('FeatureStore should clear action signals on destroy', () => {
//     store.getActionStatusSignal('increment');
//     const spy = vi.spyOn(store, 'clearActionStatusSignal');
//     store.ngOnDestroy();
//     expect(spy).toHaveBeenCalledWith('increment');
//   });
// });
