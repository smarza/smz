import { InjectionToken } from '@angular/core';
import { FeatureStoreBuilder, GenericFeatureStore } from '@smz-ui/store';
import { Album } from './album.model';
import { AlbumApiService } from './album.api';

interface AlbumsCrudState {
  albums: Album[];
}

export interface AlbumsCrudStore extends GenericFeatureStore<AlbumsCrudState, AlbumsCrudStore> {
  createAlbum(album: Omit<Album, 'id'>): Promise<void>;
  updateAlbum(album: Album): Promise<void>;
  deleteAlbum(id: number): Promise<void>;
}

const albumsCrudStoreBuilder = new FeatureStoreBuilder<AlbumsCrudState, AlbumsCrudStore>()
  .withInitialState({ albums: [] })
  .withLoaderFn(async (api: AlbumApiService) => ({ albums: await api.getAlbums() }))
  .addDependency(AlbumApiService)
  .withAction('createAlbum', (store: AlbumsCrudStore, api: AlbumApiService) => async (album: Omit<Album, 'id'>) => {
    const created = await api.createAlbum(album);
    store.updateState({ albums: [...store.state().albums, created] });
  })
  .withAction('updateAlbum', (store: AlbumsCrudStore, api: AlbumApiService) => async (album: Album) => {
    const updated = await api.updateAlbum(album);
    store.updateState({
      albums: store.state().albums.map((a) => (a.id === updated.id ? updated : a)),
    });
  })
  .withAction('deleteAlbum', (store: AlbumsCrudStore, api: AlbumApiService) => async (id: number) => {
    await api.deleteAlbum(id);
    store.updateState({ albums: store.state().albums.filter((a) => a.id !== id) });
  });

export const ALBUMS_CRUD_STORE_TOKEN = new InjectionToken<AlbumsCrudStore>('ALBUMS_CRUD_STORE_TOKEN');

export const albumsCrudStoreProvider = albumsCrudStoreBuilder.buildProvider(ALBUMS_CRUD_STORE_TOKEN);
