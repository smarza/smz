import { Injectable, InjectionToken, inject, Provider } from '@angular/core';
import { LoggingService } from '@smz-ui/core';

export interface StoreHistoryEvent {
  storeScope: string;
  action: string;
  params: Record<string, unknown>;
  status: 'idle' | 'loading' | 'resolved' | 'error';
  timestamp: number;
}

export const STORE_HISTORY_ENABLED = new InjectionToken<boolean>('STORE_HISTORY_ENABLED', {
  providedIn: 'root',
  factory: () => false
});

export interface IStoreHistoryService {
  trackEvent(event: Omit<StoreHistoryEvent, 'timestamp'>): void;
  getEventsByStore(storeScope: string): StoreHistoryEvent[];
  getAllEvents(): StoreHistoryEvent[];
  clearHistory(): void;
}

@Injectable({ providedIn: 'root' })
export class NullStoreHistoryService implements IStoreHistoryService {
  trackEvent(): void {
    // To nothing
  }
  getEventsByStore(): StoreHistoryEvent[] { return []; }
  getAllEvents(): StoreHistoryEvent[] { return []; }
  clearHistory(): void {
    // To nothing
  }
}

@Injectable({ providedIn: 'root' })
export class StoreHistoryService implements IStoreHistoryService {
  private readonly events: StoreHistoryEvent[] = [];
  private readonly logger = inject(LoggingService).scoped('StoreHistory');

  constructor() {
    this.logger.debug('Service initialized with history tracking enabled');
  }

  public trackEvent(event: Omit<StoreHistoryEvent, 'timestamp'>): void {
    const historyEvent: StoreHistoryEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.events.push(historyEvent);
    this.logger.debug('Event tracked:', historyEvent);
  }

  public getEventsByStore(storeScope: string): StoreHistoryEvent[] {
    return this.events.filter(event => event.storeScope === storeScope);
  }

  public getAllEvents(): StoreHistoryEvent[] {
    this.logger.debug('Events', this.events);
    return [...this.events];
  }

  public clearHistory(): void {
    this.events.length = 0;
    this.logger.debug('History cleared');
  }
}

export const STORE_HISTORY_SERVICE = new InjectionToken<IStoreHistoryService>('STORE_HISTORY_SERVICE', {
  providedIn: 'root',
  factory: () => inject(NullStoreHistoryService)
});

export function provideStoreHistory(): Provider {
  return {
    provide: STORE_HISTORY_SERVICE,
    useClass: StoreHistoryService
  };
}