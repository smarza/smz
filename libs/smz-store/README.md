# @smz-ui/store

This library was generated with [Nx](https://nx.dev).

# SMZ Store

A powerful state management solution for Angular applications that provides a clean, type-safe, and feature-rich approach to managing application state.

## Table of Contents

- [Overview](#overview)
- [Creating a State Store](#creating-a-state-store)
- [Store Scoping Levels](#store-scoping-levels)
- [State Store Pattern](#state-store-pattern)
- [Available Plugins](#available-plugins)
- [Usage in Components](#usage-in-components)
- [Store History](#store-history)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

## Overview

The SMZ Store provides a comprehensive state management solution with the following features:

- **Type-safe state management** with TypeScript
- **Reactive state updates** using Angular signals
- **Plugin system** for extensibility
- **Built-in error handling**
- **Local storage persistence**
- **Auto-refresh capabilities**
- **Lazy caching**
- **Store history tracking** (for debugging)
- **Automatic cleanup** on component destruction

## Creating a State Store

### Step 1: Define Your Interfaces

Create a single file that contains all your state store definitions. Follow this structure:

```typescript
import { InjectionToken } from '@angular/core';
import { SmzStateStoreBuilder, SmzStore } from '@smz-ui/store';

// Define your state interface
interface YourState {
  data: any[];
  loading: boolean;
  error: string | null;
}

// Define your actions interface
interface YourActions {
  loadData(): void;
  addItem(item: any): void;
  removeItem(id: string): void;
  clearError(): void;
}

// Define your selectors interface
interface YourSelectors {
  hasData(): boolean;
  itemCount(): number;
  getItemById(id: string): any | undefined;
  isLoading(): boolean;
}

// Export the store type
export type YourStore = SmzStore<YourState, YourActions, YourSelectors>;
```

### Step 2: Create the Store Builder

```typescript
// Create the builder instance
const builder = new SmzStateStoreBuilder<YourState, YourActions, YourSelectors>()
  .withScopeName('YourStoreName')
  .withInitialState({
    data: [],
    loading: false,
    error: null
  })
  .withLoaderFn(async (injector) => {
    // Your API call logic here
    const apiService = injector.get(YourApiService);
    return await apiService.getData();
  })
  .withPlugin(withLazyCache(5 * 60 * 1000)) // 5 minutes cache
  .withPlugin(withAutoRefresh(30 * 1000)) // 30 seconds refresh
  .withPlugin(withLocalStoragePersistence('your-store-key'))
  .withPlugin(withErrorHandler((error, injector) => {
    const errorHandler = injector.get(ErrorHandlerService);
    errorHandler.handleError(error);
  }))
  .withActions((actions, injector, updateState, getState) => {
    // Define your actions
    actions.loadData = () => {
      updateState({ loading: true, error: null });
      // Your loading logic
    };

    actions.addItem = (item: any) => {
      const currentState = getState();
      updateState({
        data: [...currentState.data, item]
      });
    };

    actions.removeItem = (id: string) => {
      const currentState = getState();
      updateState({
        data: currentState.data.filter(item => item.id !== id)
      });
    };

    actions.clearError = () => {
      updateState({ error: null });
    };
  })
  .withSelectors((selectors, injector, getState) => {
    // Define your selectors
    selectors.hasData = () => getState().data.length > 0;

    selectors.itemCount = () => getState().data.length;

    selectors.getItemById = (id: string) => {
      return getState().data.find(item => item.id === id);
    };

    selectors.isLoading = () => getState().loading;
  });
```

### Step 3: Export Provider and Token

```typescript
// Create injection token
export const YOUR_STORE_TOKEN = new InjectionToken<YourStore>('YOUR_STORE_TOKEN');

// Export the provider
export const yourStoreProvider = builder.buildProvider(YOUR_STORE_TOKEN);
```

### Complete Example

Here's a complete example following the established pattern:

```typescript
import { InjectionToken } from '@angular/core';
import {
  SmzStateStoreBuilder,
  withLocalStoragePersistence,
  withAutoRefresh,
  withLazyCache,
  withErrorHandler,
  SmzStore
} from '@smz-ui/store';
import { YourApiService } from './your-api.service';
import { ErrorHandlerService } from './error-handler.service';

interface CounterState {
  count: number;
}

interface CounterActions {
  increment(): void;
  decrement(): void;
}

interface CounterSelectors {
  isPositive(): boolean;
  isNegative(): boolean;
  isZero(): boolean;
  doubleCount(): number;
}

export type CounterStore = SmzStore<CounterState, CounterActions, CounterSelectors>;

const builder = new SmzStateStoreBuilder<CounterState, CounterActions, CounterSelectors>()
  .withScopeName('CounterStore')
  .withInitialState({ count: 0 })
  .withLoaderFn(async (injector) => injector.get(YourApiService).getRandomCount())
  .withPlugin(withLazyCache(9 * 1000))
  .withPlugin(withAutoRefresh(10 * 1000))
  .withPlugin(withLocalStoragePersistence('counter-demo'))
  .withPlugin(withErrorHandler((error, injector) =>
    injector.get(ErrorHandlerService).handleError(error)
  ))
  .withActions((actions, injector, updateState, getState) => {
    actions.increment = () => {
      updateState({ count: getState().count + 1 });
    };

    actions.decrement = () => {
      updateState({ count: getState().count - 1 });
    };
  })
  .withSelectors((selectors, injector, getState) => {
    selectors.isPositive = () => getState().count > 0;
    selectors.isNegative = () => getState().count < 0;
    selectors.isZero = () => getState().count === 0;
    selectors.doubleCount = () => getState().count * 2;
  });

export const COUNTER_STORE_TOKEN = new InjectionToken<CounterStore>('COUNTER_STORE_TOKEN');

export const counterStoreProvider = builder.buildProvider(COUNTER_STORE_TOKEN);
```

## Store Scoping Levels

SMZ Store supports three different scoping levels, allowing you to control the lifecycle and scope of your stores. The provider setup remains the same, but where you provide it determines the store's scope and lifecycle.

### 1. Application Level (Global)

**Use Case**: Global application state that needs to be shared across the entire application (e.g., user authentication, app settings, global notifications).

**Implementation**: Provide the store in your `app.config.ts`:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { authStoreProvider, userStoreProvider } from './stores';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    authStoreProvider,      // Global auth store
    userStoreProvider,      // Global user store
  ],
};
```

**Characteristics**:
- **Lifetime**: Exists for the entire application lifecycle
- **Scope**: Available to all components in the application
- **Cleanup**: Automatically cleaned up when the application is destroyed
- **Memory**: Persists across route changes and component destruction

### 2. Route Level (Feature)

**Use Case**: Feature-specific state that should be shared among components within a specific route or feature module (e.g., form data, feature-specific settings).

**Implementation**: Provide the store in your route configuration:

```typescript
// app.routes.ts
import { Route } from '@angular/router';
import { postsCrudStoreProvider } from './features/posts/posts-crud-store.provider';

export const appRoutes: Route[] = [
  {
    path: 'posts',
    component: PostsComponent,
    providers: [postsCrudStoreProvider], // Feature-level store
    children: [
      { path: 'list', component: PostsListComponent },
      { path: 'create', component: PostsCreateComponent },
      { path: 'edit/:id', component: PostsEditComponent },
    ]
  }
];
```

**Characteristics**:
- **Lifetime**: Exists while the route is active
- **Scope**: Available to all components within the route and its children
- **Cleanup**: Automatically cleaned up when navigating away from the route
- **Memory**: Shared among all components in the route hierarchy

### 3. Component Level (Local)

**Use Case**: Component-specific state that should be isolated to a single component (e.g., form state, component-specific UI state).

**Implementation**: Provide the store in your component's providers array:

```typescript
// your.component.ts
import { Component } from '@angular/core';
import { counterFeature2StoreProvider } from './counter-feature-2-store.provider';

@Component({
  selector: 'app-your-component',
  template: `...`,
  providers: [counterFeature2StoreProvider], // Component-level store
})
export class YourComponent {
  // Component logic
}
```

**Characteristics**:
- **Lifetime**: Exists only while the component is instantiated
- **Scope**: Available only to the specific component and its children
- **Cleanup**: Automatically cleaned up when the component is destroyed
- **Memory**: Isolated to the component instance

### Choosing the Right Scope

| Scope | When to Use | Example Use Cases |
|-------|-------------|-------------------|
| **Application** | Global state needed across the entire app | User authentication, app settings, global notifications |
| **Route** | State shared within a feature or route | Form data, feature-specific settings, shared data within a module |
| **Component** | Component-specific state | Form state, UI state, temporary data |

### Automatic Cleanup

All stores automatically handle cleanup based on their scope:

- **Application level**: Cleaned up when the application is destroyed
- **Route level**: Cleaned up when navigating away from the route
- **Component level**: Cleaned up when the component is destroyed

The cleanup includes:
- Stopping auto-refresh timers
- Clearing cached data
- Destroying plugins
- Releasing memory

### Example: Multi-Level Store Architecture

```typescript
// Global auth store (app.config.ts)
export const appConfig: ApplicationConfig = {
  providers: [
    authStoreProvider, // Global authentication state
  ],
};

// Feature-level posts store (app.routes.ts)
export const appRoutes: Route[] = [
  {
    path: 'posts',
    providers: [postsStoreProvider], // Feature-level posts state
    children: [
      { path: 'list', component: PostsListComponent },
      { path: 'create', component: PostsCreateComponent },
    ]
  }
];

// Component-level form store (posts-create.component.ts)
@Component({
  providers: [postFormStoreProvider], // Component-level form state
})
export class PostsCreateComponent {
  // Component logic
}
```

## State Store Pattern

The recommended pattern for organizing state stores:

### File Structure
```
your-feature/
├── your-store.provider.ts    # Main store definition
├── your-api.service.ts       # API service (if needed)
├── your-error-handler.ts     # Error handler (if needed)
└── your.component.ts         # Component using the store
```

### Code Organization
1. **Imports** - All necessary imports at the top
2. **State Interface** - Define the shape of your state
3. **Actions Interface** - Define all available actions
4. **Selectors Interface** - Define computed values and queries
5. **Store Type** - Export the combined store type
6. **Builder Configuration** - Configure the store with plugins and logic
7. **Token and Provider** - Export for dependency injection

## Available Plugins

### withInitialState
Sets the initial state of the store.

```typescript
.withInitialState({ count: 0, data: [] })
```

### withLocalStoragePersistence
Persists state to localStorage with automatic save/load.

```typescript
.withPlugin(withLocalStoragePersistence('your-store-key'))
```

### withAutoRefresh
Automatically refreshes data at specified intervals.

```typescript
.withPlugin(withAutoRefresh(30 * 1000)) // 30 seconds
```

### withLazyCache
Caches data for a specified duration to avoid unnecessary API calls.

```typescript
.withPlugin(withLazyCache(5 * 60 * 1000)) // 5 minutes
```

### withErrorHandler
Provides custom error handling for the store.

```typescript
.withPlugin(withErrorHandler((error, injector) => {
  const errorHandler = injector.get(ErrorHandlerService);
  errorHandler.handleError(error);
}))
```

## Usage in Components

### Inject the Store

```typescript
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { YOUR_STORE_TOKEN, YourStore } from './your-store.provider';

@Component({
  selector: 'app-your-component',
  template: `...`
})
export class YourComponent implements OnInit, OnDestroy {
  readonly store: YourStore = inject(YOUR_STORE_TOKEN);

  ngOnInit(): void {
    this.store.controls.wakeUp();
  }

  ngOnDestroy(): void {
    this.store.controls.sleep();
  }
}
```

### Access State, Actions, and Selectors

```typescript
// In your template
<div>Count: {{ store.state.state().count }}</div>
<div>Is Positive: {{ store.selectors.isPositive() }}</div>
<button (click)="store.actions.increment()">Increment</button>

// Check loading status
<div *ngIf="store.status.isLoading()">Loading...</div>

// Handle errors
<div *ngIf="store.status.isError()">
  Error: {{ store.error.error()?.message }}
</div>
```

### Available Store Properties

- `store.state.state()` - Access current state
- `store.actions.*` - Call actions
- `store.selectors.*` - Access computed values
- `store.status.*` - Check loading status
- `store.error.error()` - Access error information
- `store.controls.sleep()` / `store.controls.wakeUp()` - Control plugins

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

## Best Practices

### 1. Single Responsibility
Each store should manage a single domain or feature. Don't create monolithic stores.

### 2. Type Safety
Always define proper TypeScript interfaces for your state, actions, and selectors.

### 3. Immutable Updates
Always create new objects/arrays when updating state. Never mutate existing state directly.

### 4. Error Handling
Always implement proper error handling using the `withErrorHandler` plugin.

### 5. Performance
- Use `withLazyCache` to avoid unnecessary API calls
- Use `withAutoRefresh` sparingly and with appropriate intervals
- Consider using `withLocalStoragePersistence` only for critical data

### 6. Naming Conventions
- Use descriptive names for your store scope
- Follow consistent naming for actions and selectors
- Use clear, descriptive localStorage keys

### 7. Component Lifecycle
Always call `wakeUp()` in `ngOnInit()` and `sleep()` in `ngOnDestroy()` to properly manage plugin lifecycles.

### 8. Testing
- Test your actions and selectors independently
- Mock API services for testing
- Test error scenarios

## API Reference

### SmzStateStoreBuilder

```typescript
class SmzStateStoreBuilder<TState, TActions, TSelectors> {
  withScopeName(name: string): this
  withInitialState(state: TState): this
  withLoaderFn(fn: (injector: Injector, ...deps: any[]) => Promise<Partial<TState>>): this
  withPlugin(plugin: StateStorePlugin<TState, StateStore<TState>>): this
  withActions(actions: StateStoreActions<TState, TActions>): this
  withSelectors(selectors: StateStoreSelectors<TState, TSelectors>): this
  buildProvider(token: InjectionToken<TActions>, extraDeps?: any[]): Provider
}
```

### SmzStore

```typescript
interface SmzStore<TState, TActions, TSelectors> {
  status: {
    status: Signal<'idle' | 'loading' | 'resolved' | 'error'>
    isLoading: Signal<boolean>
    isError: Signal<boolean>
    isResolved: Signal<boolean>
    isIdle: Signal<boolean>
    isLoaded: Signal<boolean>
  }
  state: {
    state: Signal<TState>
  }
  actions: TActions & {
    reload: () => Promise<void>
    forceReload: () => Promise<void>
  }
  selectors: TSelectors
  error: {
    error: Signal<Error | null>
  }
  controls: {
    sleep: () => void
    wakeUp: () => void
  }
}
```

### IStoreHistoryService

```typescript
interface IStoreHistoryService {
  trackEvent(event: Omit<StoreHistoryEvent, 'timestamp'>): void;
  getEventsByStore(storeScope: string): StoreHistoryEvent[];
  getAllEvents(): StoreHistoryEvent[];
  clearHistory(): void;
}
```

### StoreHistoryEvent

```typescript
interface StoreHistoryEvent {
  storeScope: string;
  action: string;
  status: 'idle' | 'loading' | 'resolved' | 'error';
  timestamp: number;
}
```
