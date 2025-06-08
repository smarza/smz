import { Injectable, InjectionToken, inject } from '@angular/core';
import { LoggingService } from '@smz-ui/core';

export interface StoreHistoryEvent {
  storeScope: string;
  action: string;
  status: 'idle' | 'loading' | 'resolved' | 'error';
  timestamp: number;
}

export const STORE_HISTORY_ENABLED = new InjectionToken<boolean>('STORE_HISTORY_ENABLED', {
  providedIn: 'root',
  factory: () => false
});

@Injectable({ providedIn: 'root' })
export class StoreHistoryService {
  private readonly events: StoreHistoryEvent[] = [];
  private readonly isEnabled = inject(STORE_HISTORY_ENABLED);
  private readonly logger = inject(LoggingService).scoped('StoreHistory');

  constructor() {
    if (this.isEnabled) {
      this.logger.debug('Service initialized with history tracking enabled');
    }
  }

  public trackEvent(event: Omit<StoreHistoryEvent, 'timestamp'>): void {
    if (!this.isEnabled) return;

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