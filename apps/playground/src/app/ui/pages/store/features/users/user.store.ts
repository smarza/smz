import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { resource, ResourceRef } from '@angular/core';
import { UserApiService } from './user.api';
import { User } from './user.model';
import { LoggingService, ScopedLogger } from '@smz-ui/layout';

@Injectable({ providedIn: 'root' })
export class UserStore {
  // Inject the API service and the logger
  private api = inject(UserApiService);
  private loggingService = inject(LoggingService);
  private logger: ScopedLogger = this.loggingService.scoped(UserStore.name);

  // Signal to hold the currently selected user ID
  private selectedUserId = signal<number>(1);

  /**
   * Resource that loads a single User whenever selectedUserId() changes.
   * Uses UserApiService.getUserById(...) under the hood.
   * Provides a defaultValue so that value() is always User (never undefined).
   */
  readonly selectedUserResource: ResourceRef<User> = resource<User, { id: number }>({
    params: () => ({ id: this.selectedUserId() }),
    loader: async ({ params }) => {
      const { id } = params;
      this.logger.info(`UserStore: loading user with id=${id}`);
      try {
        const user = await this.api.getUserById(id);
        this.logger.info(`UserStore: successfully loaded user with id=${user.id}`);
        // Freeze the returned object to enforce immutability
        return Object.freeze({ ...user });
      } catch (error: unknown) {
        this.logger.error(`UserStore: error loading user with id=${id}`, error);
        // Re-throw so resource.status() becomes 'error'
        throw error;
      }
    },
    defaultValue: { id: 0, name: 'Loading…', email: '' }
  });

  /**
   * Resource that loads all Users once (or when reload() is called).
   * Uses UserApiService.getAllUsers() under the hood.
   * Provides a defaultValue of an empty array so that value() is never undefined.
   */
  readonly allUsersResource: ResourceRef<User[]> = resource<User[], void>({
    // No params needed here; resource() will load once on initialization,
    // and any time .reload() is called.
    params: () => ({}),
    loader: async () => {
      this.logger.info('UserStore: loading all users');
      try {
        const users = await this.api.getAllUsers();
        this.logger.info(`UserStore: successfully loaded ${users.length} users`);
        // Return a new array with copied objects
        return users.map(u => ({ ...u }));
      } catch (error: unknown) {
        this.logger.error('UserStore: error loading all users', error);
        // Return an empty array on error so templates don't break.
        return [];
      }
    },
    defaultValue: []
  });

  // Computed signals to expose current value/status for components to consume

  /** The currently selected User (default is empty placeholder until loaded) */
  readonly selectedUser = computed(() => this.selectedUserResource.value());

  /** The loading/error/idle/resolved status of the selectedUserResource */
  readonly selectedUserStatus = computed(() => this.selectedUserResource.status());

  /** The full list of Users (default is empty array until loaded) */
  readonly allUsers = computed(() => this.allUsersResource.value());

  /** The loading/error/idle/resolved status of the allUsersResource */
  readonly allUsersStatus = computed(() => this.allUsersResource.status());

  constructor() {
    // Use effect() to log whenever selectedUserResource.value() changes
    effect(() => {
      const user = this.selectedUserResource.value();
      if (user && user.id !== 0) {
        this.logger.debug('UserStore: selectedUserResource updated →', user.id);
      }
    });

    // Use effect() to log whenever allUsersResource.value() changes
    effect(() => {
      const list = this.allUsersResource.value();
      this.logger.debug(`UserStore: allUsersResource updated → count=${list.length}`);
    });
  }

  /**
   * Change which user is "selected". This causes selectedUserResource to auto-reload.
   */
  setSelectedUserId(id: number): void {
    this.logger.info('UserStore: setSelectedUserId →', id);
    this.selectedUserId.set(id);
    // resource will detect the new id and trigger loader() automatically
  }

  /**
   * Manually force reloading all users.
   */
  reloadAllUsers(): void {
    this.logger.info('UserStore: reloadAllUsers');
    this.allUsersResource.reload();
  }
}
