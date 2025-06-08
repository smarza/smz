# @smz-ui/store

This library was generated with [Nx](https://nx.dev).

# SMZ Store

## Store History

The Store History feature provides a way to track and monitor all actions performed in your stores. It's particularly useful for debugging and development purposes.

### Features

- Track all store actions and their status (idle, loading, resolved, error)
- Monitor store events in real-time
- Filter events by store scope
- View event timestamps
- Zero performance impact when disabled (default behavior)

### Usage

By default, the Store History is disabled and uses a null implementation that does nothing. This ensures zero performance impact in production.

To enable the Store History in your application:

```typescript
import { provideStoreHistory } from '@smz-ui/store';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    provideStoreHistory(), // This will enable the real implementation
  ],
};
```

### Viewing History

You can view the store history in two ways:

1. **Using the Store History Component**:
   ```typescript
   import { StoreHistoryComponent } from '@smz-ui/store';

   @Component({
     // ...
     imports: [StoreHistoryComponent]
   })
   ```

2. **Programmatically**:
   ```typescript
   import { STORE_HISTORY_SERVICE, IStoreHistoryService } from '@smz-ui/store';

   @Component({
     // ...
   })
   export class YourComponent {
     private storeHistory = inject(STORE_HISTORY_SERVICE);

     // Get all events
     const allEvents = this.storeHistory.getAllEvents();

     // Get events for a specific store
     const storeEvents = this.storeHistory.getEventsByStore('your-store-scope');
   }
   ```

### Best Practices

1. **Development Only**: Enable Store History only in development environments
2. **Performance**: The null implementation is used by default to ensure zero performance impact
3. **Memory**: The history is kept in memory, so consider clearing it periodically if needed

### Example

```typescript
// In your app.config.ts
import { provideStoreHistory } from '@smz-ui/store';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    provideStoreHistory(), // Enable history tracking
  ],
};

// In your component
import { StoreHistoryComponent } from '@smz-ui/store';

@Component({
  selector: 'app-debug',
  template: `
    <smz-store-history></smz-store-history>
  `,
  standalone: true,
  imports: [StoreHistoryComponent]
})
export class DebugComponent {}
```

### API Reference

#### IStoreHistoryService

```typescript
interface IStoreHistoryService {
  trackEvent(event: Omit<StoreHistoryEvent, 'timestamp'>): void;
  getEventsByStore(storeScope: string): StoreHistoryEvent[];
  getAllEvents(): StoreHistoryEvent[];
  clearHistory(): void;
}
```

#### StoreHistoryEvent

```typescript
interface StoreHistoryEvent {
  storeScope: string;
  action: string;
  status: 'idle' | 'loading' | 'resolved' | 'error';
  timestamp: number;
}
```

## Running Benchmarks

Execute the store benchmarks with:

```bash
npm run benchmark:store
```

Benchmark results are written to `tests/smz-store/benchmarks`.

