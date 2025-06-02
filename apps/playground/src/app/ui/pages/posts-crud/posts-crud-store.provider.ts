import { InjectionToken } from '@angular/core';
import { FeatureStoreBuilder, GenericFeatureStore } from '@smz-ui/store';
import { Post } from './post.model';
import { PostApiService } from './post.api';

export interface PostsCrudStore extends GenericFeatureStore<{ posts: Post[] }> {
  createPost(post: Omit<Post, 'id'>): Promise<void>;
  updatePost(post: Post): Promise<void>;
  deletePost(id: number): Promise<void>;
}

export const POSTS_CRUD_STORE_TOKEN = new InjectionToken<PostsCrudStore>('POSTS_CRUD_STORE_TOKEN');

export const postsCrudStoreProvider = new FeatureStoreBuilder<{ posts: Post[] }>()
  .withName('PostsCrudStore')
  .withInitialState({ posts: [] })
  .withLoaderFn(async (api: PostApiService) => ({ posts: await api.getPosts() }))
  .addDependency(PostApiService)
  .withSetup((store: PostsCrudStore, api: PostApiService) => {
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
  })
  .buildProvider(POSTS_CRUD_STORE_TOKEN);