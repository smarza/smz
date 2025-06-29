import { InjectionToken } from '@angular/core';
import {
  SmzStateStoreBuilder,
  withLocalStoragePersistence,
  withAutoRefresh,
  withLazyCache,
  withErrorHandler,
  SmzStore
} from '@smz-ui/store';
import { Album } from './album.model';
import { AlbumApiService } from './album.api';

// Define your state interface
interface AlbumsCrudState {
  albums: Album[];
  loading: boolean;
  error: string | null;
}

// Define your actions interface
interface AlbumsCrudActions {
  createAlbum(album: Omit<Album, 'id'>): Promise<void>;
  updateAlbum(album: Album): Promise<void>;
  deleteAlbum(id: number): Promise<void>;
  clearError(): void;
}

// Define your selectors interface
interface AlbumsCrudSelectors {
  hasAlbums(): boolean;
  albumCount(): number;
  getAlbumById(id: number): Album | undefined;
  isLoading(): boolean;
}

// Export the store type
export type AlbumsCrudStore = SmzStore<AlbumsCrudState, AlbumsCrudActions, AlbumsCrudSelectors>;

// Create the builder instance
const builder = new SmzStateStoreBuilder<AlbumsCrudState, AlbumsCrudActions, AlbumsCrudSelectors>()
  .withScopeName('AlbumsCrudStore')
  .withInitialState({
    albums: [],
    loading: false,
    error: null
  })
  .withLoaderFn(async (injector) => {
    const apiService = injector.get(AlbumApiService);
    return { albums: await apiService.getAlbums() };
  })
  .withPlugin(withLazyCache(5 * 60 * 1000)) // 5 minutes cache
  .withPlugin(withAutoRefresh(30 * 1000)) // 30 seconds refresh
  .withPlugin(withLocalStoragePersistence('albums-crud-store'))
  .withPlugin(withErrorHandler((error) => {
    console.error('Albums CRUD Store Error:', error);
  }))
  .withActions((actions, injector, updateState, getState) => {
    const apiService = injector.get(AlbumApiService);

    actions.createAlbum = async (album: Omit<Album, 'id'>) => {
      updateState({ loading: true, error: null });
      try {
        const created = await apiService.createAlbum(album);
        const currentState = getState();
        updateState({
          albums: [...currentState.albums, created],
          loading: false
        });
      } catch (error) {
        updateState({
          error: error instanceof Error ? error.message : 'Failed to create album',
          loading: false
        });
        throw error;
      }
    };

    actions.updateAlbum = async (album: Album) => {
      updateState({ loading: true, error: null });
      try {
        const updated = await apiService.updateAlbum(album);
        const currentState = getState();
        updateState({
          albums: currentState.albums.map((a) => (a.id === updated.id ? updated : a)),
          loading: false
        });
      } catch (error) {
        updateState({
          error: error instanceof Error ? error.message : 'Failed to update album',
          loading: false
        });
        throw error;
      }
    };

    actions.deleteAlbum = async (id: number) => {
      updateState({ loading: true, error: null });
      try {
        await apiService.deleteAlbum(id);
        const currentState = getState();
        updateState({
          albums: currentState.albums.filter((a) => a.id !== id),
          loading: false
        });
      } catch (error) {
        updateState({
          error: error instanceof Error ? error.message : 'Failed to delete album',
          loading: false
        });
        throw error;
      }
    };

    actions.clearError = () => {
      updateState({ error: null });
    };
  })
  .withSelectors((selectors, injector, getState) => {
    selectors.hasAlbums = () => getState().albums.length > 0;

    selectors.albumCount = () => getState().albums.length;

    selectors.getAlbumById = (id: number) => {
      return getState().albums.find(album => album.id === id);
    };

    selectors.isLoading = () => getState().loading;
  });

// Create injection token
export const ALBUMS_CRUD_STORE_TOKEN = new InjectionToken<AlbumsCrudStore>('ALBUMS_CRUD_STORE_TOKEN');

// Export the provider
export const albumsCrudStoreProvider = builder.buildProvider(ALBUMS_CRUD_STORE_TOKEN);
