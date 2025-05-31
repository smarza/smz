// src/app/features/users/user-with-posts.facade.ts
import { Injectable, computed, effect, inject } from '@angular/core';
import { UserStore } from './user.store';
import { PostStore } from '../posts/post.store';
import { LoggingService, ScopedLogger } from '@smz-ui/layout';

@Injectable({ providedIn: 'root' })
export class UserWithPostsFacade {
  private loggingService = inject(LoggingService);
  private logger: ScopedLogger = this.loggingService.scoped(UserWithPostsFacade.name);

  private userStore = inject(UserStore);
  private postStore = inject(PostStore);

  // Combine the two Signals: whenever either selectedUser or postsByUser changes, this rebuilds
  readonly userWithPosts = computed(() => ({
    user: this.userStore.selectedUser(),
    posts: this.postStore.postsByUser()
  }));

  // Combined status: idle/error/loading/resolved
  readonly status = computed(() => {
    const userStatus = this.userStore.selectedUserStatus();
    const postsStatus = this.postStore.postsByUserStatus();
    if (userStatus === 'loading' || postsStatus === 'loading') {
      return 'loading';
    }
    if (userStatus === 'error' || postsStatus === 'error') {
      return 'error';
    }
    return 'resolved';
  });

  // Whenever the selected user changes, we also set the PostStore’s userId
  private syncSelectedUser = effect(() => {
    const id = this.userStore.selectedUserResource.value()?.id;
    if (id) {
      this.logger.debug('UserWithPostsFacade: syncing postStore.userId →', id);
      this.postStore.setUserId(id);
    }
  });

  constructor() {
    this.logger.info('UserWithPostsFacade initialized');
  }

  /**
   * To select a new user and automatically load both user data + posts:
   */
  selectUser(id: number): void {
    this.logger.info('UserWithPostsFacade: selectUser', id);
    this.userStore.setSelectedUserId(id);
    // Because `syncSelectedUser` effect listens to userResource.value(), the posts will load automatically
  }

  /**
   * Force reload everything
   */
  reloadAll(): void {
    this.logger.info('UserWithPostsFacade: reloadAll');
    this.userStore.selectedUserResource.reload();
    this.postStore.postsByUserResource.reload();
  }
}
