import { InjectionToken } from '@angular/core';
import {
  SmzStateStoreBuilder,
  SmzStore,
  withLocalStoragePersistence,
  withAutoRefresh,
  withLazyCache,
  withErrorHandler
} from '@smz-ui/store';
import { Post } from './post.model';
import { PostApiService } from './post.api';

// Define the state interface
interface PostsCrudState {
  posts: Post[];
  loading: boolean;
  error: string | null;
}

// Define the actions interface
interface PostsCrudActions {
  createPost(post: Omit<Post, 'id'>): Promise<void>;
  updatePost(post: Post): Promise<void>;
  deletePost(id: number): Promise<void>;
  clearError(): void;
  reloadPosts(): Promise<void>;
}

// Define the selectors interface
interface PostsCrudSelectors {
  hasPosts(): boolean;
  postsCount(): number;
  getPostById(id: number): Post | undefined;
  isLoading(): boolean;
  hasError(): boolean;
  getError(): string | null;
}

// Export the store type
export type PostsCrudStore = SmzStore<PostsCrudState, PostsCrudActions, PostsCrudSelectors>;

// Create the builder instance
const builder = new SmzStateStoreBuilder<PostsCrudState, PostsCrudActions, PostsCrudSelectors>()
  .withScopeName('PostsCrudStore')
  .withInitialState({
    posts: [],
    loading: false,
    error: null
  })
  .withLoaderFn(async (injector) => {
    const apiService = injector.get(PostApiService);
    return { posts: await apiService.getPosts() };
  })
  .withPlugin(withLazyCache(5 * 60 * 1000)) // 5 minutes cache
  .withPlugin(withAutoRefresh(30 * 1000)) // 30 seconds refresh
  .withPlugin(withLocalStoragePersistence('posts-crud-store'))
  .withPlugin(withErrorHandler((error) => {
    console.error('Posts CRUD Store Error:', error);
  }))
  .withActions((actions, injector, updateState, getState) => {
    const apiService = injector.get(PostApiService);

    actions.createPost = async (post: Omit<Post, 'id'>) => {
      updateState({ loading: true, error: null });
      try {
        const created = await apiService.createPost(post);
        const currentState = getState();
        updateState({
          posts: [...currentState.posts, created],
          loading: false
        });
      } catch (error) {
        updateState({
          error: error instanceof Error ? error.message : 'Failed to create post',
          loading: false
        });
        throw error;
      }
    };

    actions.updatePost = async (post: Post) => {
      updateState({ loading: true, error: null });
      try {
        const updated = await apiService.updatePost(post);
        const currentState = getState();
        updateState({
          posts: currentState.posts.map((p) => (p.id === updated.id ? updated : p)),
          loading: false
        });
      } catch (error) {
        updateState({
          error: error instanceof Error ? error.message : 'Failed to update post',
          loading: false
        });
        throw error;
      }
    };

    actions.deletePost = async (id: number) => {
      updateState({ loading: true, error: null });
      try {
        await apiService.deletePost(id);
        const currentState = getState();
        updateState({
          posts: currentState.posts.filter((p) => p.id !== id),
          loading: false
        });
      } catch (error) {
        updateState({
          error: error instanceof Error ? error.message : 'Failed to delete post',
          loading: false
        });
        throw error;
      }
    };

    actions.clearError = () => {
      updateState({ error: null });
    };

    actions.reloadPosts = async () => {
      updateState({ loading: true, error: null });
      try {
        const posts = await apiService.getPosts();
        updateState({ posts, loading: false });
      } catch (error) {
        updateState({
          error: error instanceof Error ? error.message : 'Failed to reload posts',
          loading: false
        });
        throw error;
      }
    };
  })
  .withSelectors((selectors, injector, getState) => {
    selectors.hasPosts = () => getState().posts.length > 0;

    selectors.postsCount = () => getState().posts.length;

    selectors.getPostById = (id: number) => {
      return getState().posts.find(post => post.id === id);
    };

    selectors.isLoading = () => getState().loading;

    selectors.hasError = () => getState().error !== null;

    selectors.getError = () => getState().error;
  });

// Create injection token
export const POSTS_CRUD_STORE_TOKEN = new InjectionToken<PostsCrudStore>('POSTS_CRUD_STORE_TOKEN');

// Export the provider
export const postsCrudStoreProvider = builder.buildProvider(POSTS_CRUD_STORE_TOKEN);