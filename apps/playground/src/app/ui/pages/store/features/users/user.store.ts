// src/app/features/users/user.store.ts
import { Injectable, computed, effect, inject, Injector, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { LoggingService, ScopedLogger } from '@smz-ui/layout';
import { User } from './user.model';
import { UserApiService } from './user.api';

/**
 * We'll create a small "user slice" of state that holds:
 *   - a Signal of selectedUserId (number)
 *   - a httpResource for fetching a single user by ID
 *   - a httpResource for fetching all users once
 */

@Injectable({ providedIn: 'root' })
export class UserStore {
  private http = inject(UserApiService);
  private injector = inject(Injector);
  private loggingService = inject(LoggingService);
  private logger: ScopedLogger = this.loggingService.scoped(UserStore.name);

  // Signal that holds the currently selected user ID
  private selectedUserId = signal<number>(1);

  // 1) Resource to fetch ONE user (based on selectedUserId)
  readonly selectedUserResource = httpResource<User>(
    () => `https://jsonplaceholder.typicode.com/users/${this.selectedUserId()}`,
    {
      injector: this.injector,
      defaultValue: { id: 0, name: 'Loading…', email: '' },
      parse: (raw) => {
        const user = raw as User;
        if (!user.id) {
          throw new Error('User parse error: invalid ID');
        }
        return Object.freeze({ ...user });
      },
      equal: (a, b) => a.id === b.id && a.email === b.email && a.name === b.name
    }
  );

  // 2) Resource to fetch ALL users once (you can call .reload() manually if needed)
  readonly allUsersResource = httpResource<User[]>(
    () => ({
      url: 'https://jsonplaceholder.typicode.com/users',
      // Could add params, headers, etc.
    }),
    {
      injector: this.injector,
      defaultValue: [],
      parse: (raw) => {
        const arr = raw as User[];
        return arr.map(u => ({ ...u }));
      },
      equal: (a, b) =>
        a.length === b.length &&
        a.every((u, idx) => u.id === b[idx].id && u.name === b[idx].name && u.email === b[idx].email)
    }
  );

  // Derived "selectors"
  readonly selectedUser = computed(() => this.selectedUserResource.value());
  readonly selectedUserStatus = computed(() => this.selectedUserResource.status());
  readonly allUsers = computed(() => this.allUsersResource.value());
  readonly allUsersStatus = computed(() => this.allUsersResource.status());

  constructor() {
    // Example: Log whenever selectedUser changes
    effect(() => {
      const u = this.selectedUserResource.value();
      this.logger.debug('UserStore: selected user updated', u?.id);
    });
  }

  /** Method to change which user is selected */
  setSelectedUserId(id: number): void {
    this.logger.info('UserStore: setSelectedUserId', id);
    this.selectedUserId.set(id);
    // httpResource will auto-reload because URL changed
  }

  /** Manually force reload "all users" */
  reloadAllUsers(): void {
    this.logger.info('UserStore: reloadAllUsers');
    this.allUsersResource.reload();
  }
}
