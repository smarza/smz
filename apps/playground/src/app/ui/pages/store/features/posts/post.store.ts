// src/app/features/posts/post.store.ts
import { Injectable, computed, effect, inject, Injector, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { LoggingService, ScopedLogger } from '@smz-ui/layout';
import { Post } from './post.model';
import { PostApiService } from './post.api';

@Injectable({ providedIn: 'root' })
export class PostStore {
  private api = inject(PostApiService);
  private injector = inject(Injector);
  private loggingService = inject(LoggingService);
  private logger: ScopedLogger = this.loggingService.scoped(PostStore.name);

  // Signal to hold current userId for which we want posts
  private userId = signal<number>(1);

  // Resource that fetches posts WHEN userId() changes
  readonly postsByUserResource = httpResource<Post[]>(
    () => ({
      url: 'https://jsonplaceholder.typicode.com/posts',
      params: { userId: `${this.userId()}` }
    }),
    {
      injector: this.injector,
      defaultValue: [],
      parse: (raw) => {
        const arr = raw as Post[];
        return arr.map(p => ({ ...p }));
      },
      equal: (a, b) =>
        a.length === b.length &&
        a.every((x, i) => x.id === b[i].id && x.title === b[i].title)
    }
  );

  // "Selectors"
  readonly postsByUser = computed(() => this.postsByUserResource.value());
  readonly postsByUserStatus = computed(() => this.postsByUserResource.status());

  constructor() {
    // Log whenever posts change
    effect(() => {
      const list = this.postsByUserResource.value();
      this.logger.debug('PostStore: posts updated for user', this.userId(), '→ count =', list.length);
    });
  }

  /** Change the userId; httpResource will automatically reload */
  setUserId(id: number): void {
    this.logger.info('PostStore: setUserId', id);
    this.userId.set(id);
  }

  /** Force a reload (regardless of userId) */
  reloadPosts(): void {
    this.logger.info('PostStore: reloadPosts');
    this.postsByUserResource.reload();
  }
}
