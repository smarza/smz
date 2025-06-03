import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Album } from './album.model';

@Injectable({ providedIn: 'root' })
export class AlbumApiService {
  constructor(private http: HttpClient) {}

  getAlbums() {
    return firstValueFrom(this.http.get<Album[]>('https://jsonplaceholder.typicode.com/albums'));
  }

  createAlbum(album: Omit<Album, 'id'>) {
    return firstValueFrom(this.http.post<Album>('https://jsonplaceholder.typicode.com/albums', album));
  }

  updateAlbum(album: Album) {
    return firstValueFrom(this.http.put<Album>(`https://jsonplaceholder.typicode.com/albums/${album.id}`, album));
  }

  deleteAlbum(id: number) {
    return firstValueFrom(this.http.delete<void>(`https://jsonplaceholder.typicode.com/albums/${id}`));
  }
}
