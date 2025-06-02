import { InjectionToken, Provider, EnvironmentInjector, DestroyRef } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { GenericFeatureStore } from '@smz-ui/store';
import { Post } from './post.model';
import { PostApiService } from './post.api';

export interface PostsCrudStore extends GenericFeatureStore<{ posts: Post[] }> {
  createPost(post: Omit<Post, 'id'>): Promise<void>;
  updatePost(post: Post): Promise<void>;
  deletePost(id: number): Promise<void>;
}

export const POSTS_CRUD_STORE_TOKEN = new InjectionToken<PostsCrudStore>('POSTS_CRUD_STORE_TOKEN');

export const postsCrudStoreProvider: Provider = {
  provide: POSTS_CRUD_STORE_TOKEN,
  deps: [EnvironmentInjector, DestroyRef, Router, PostApiService],
  useFactory: (
    env: EnvironmentInjector,
    destroyRef: DestroyRef,
    router: Router,
    api: PostApiService
  ): PostsCrudStore => {
    const store = new GenericFeatureStore<{ posts: Post[] }>({
      scopeName: 'PostsCrudStore',
      initialState: { posts: [] },
      loaderFn: async () => ({ posts: await api.getPosts() }),
      ttlMs: 0,
    });

    const initialUrl = router.url;
    const sub = router.events
      .pipe(filter((ev) => ev instanceof NavigationStart || ev instanceof NavigationEnd))
      .subscribe((ev) => {
        if (ev instanceof NavigationStart) {
          store.pauseTtl();
        } else if (ev instanceof NavigationEnd) {
          if (router.url === initialUrl) {
            store.resumeTtl();
          } else {
            store.pauseTtl();
          }
        }
      });

    destroyRef.onDestroy(() => {
      sub.unsubscribe();
      store.ngOnDestroy();
    });

    void store.reload();

    const extended = store as PostsCrudStore;
    extended.createPost = async (post) => {
      const created = await api.createPost(post);
      extended.updateState({ posts: [...extended.state().posts, created] });
    };
    extended.updatePost = async (post) => {
      const updated = await api.updatePost(post);
      extended.updateState({
        posts: extended.state().posts.map((p) => (p.id === updated.id ? updated : p)),
      });
    };
    extended.deletePost = async (id) => {
      await api.deletePost(id);
      extended.updateState({ posts: extended.state().posts.filter((p) => p.id !== id) });
    };

    return extended;
  },
};
