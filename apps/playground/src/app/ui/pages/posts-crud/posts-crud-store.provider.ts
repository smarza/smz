import { InjectionToken } from '@angular/core';
import { FeatureStoreBuilder, GenericFeatureStore } from '@smz-ui/store';
import { Post } from './post.model';
import { PostApiService } from './post.api';

export interface PostsCrudState {
  posts: Post[];
}

export interface PostsCrudStore extends GenericFeatureStore<PostsCrudState> {
  createPost(post: Omit<Post, 'id'>): Promise<void>;
  updatePost(post: Post): Promise<void>;
  deletePost(id: number): Promise<void>;
}

export const POSTS_CRUD_STORE_TOKEN = new InjectionToken<PostsCrudStore>('POSTS_CRUD_STORE_TOKEN');

export const postsCrudStoreProvider = new FeatureStoreBuilder<PostsCrudState, PostsCrudStore>()
  // .withName('PostsCrudStore')
  .withInitialState({ posts: [] })
  .withLoaderFn(async (api: PostApiService) => ({ posts: await api.getPosts() }))
  .addDependency(PostApiService)
  .withAction('createPost', (store: PostsCrudStore, api: PostApiService) => async (post: Omit<Post, 'id'>) => {
    const created = await api.createPost(post);
    store.updateState({ posts: [...store.state().posts, created] });
  })
  .withAction('updatePost', (store: PostsCrudStore, api: PostApiService) => async (post: Post) => {
    const updated = await api.updatePost(post);
    store.updateState({
      posts: store.state().posts.map((p) => (p.id === updated.id ? updated : p)),
    });
  })
  .withAction('deletePost', (store: PostsCrudStore, api: PostApiService) => async (id: number) => {
    await api.deletePost(id);
    store.updateState({ posts: store.state().posts.filter((p) => p.id !== id) });
  })
  .buildProvider(POSTS_CRUD_STORE_TOKEN);