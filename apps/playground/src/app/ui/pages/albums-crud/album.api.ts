import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Album } from './album.model';

@Injectable({ providedIn: 'root' })
export class AlbumApiService {
  constructor(private http: HttpClient) {}

  private async simulateDelayAndError() {
    // Random delay between 300ms and 1500ms
    const delay = Math.random() * 1200 + 300;
    await new Promise(res => setTimeout(res, delay));
    // 20% chance to throw an error
    if (Math.random() < 0.2) {
      throw new Error('Simulated API error');
    }
  }

  async getAlbums() {
    await this.simulateDelayAndError();
    return firstValueFrom(this.http.get<Album[]>('https://jsonplaceholder.typicode.com/albums'));
  }

  async createAlbum(album: Omit<Album, 'id'>) {
    await this.simulateDelayAndError();
    return firstValueFrom(this.http.post<Album>('https://jsonplaceholder.typicode.com/albums', album));
  }

  async updateAlbum(album: Album) {
    await this.simulateDelayAndError();
    return firstValueFrom(this.http.put<Album>(`https://jsonplaceholder.typicode.com/albums/${album.id}`, album));
  }

  async deleteAlbum(id: number) {
    await this.simulateDelayAndError();
    return firstValueFrom(this.http.delete<void>(`https://jsonplaceholder.typicode.com/albums/${id}`));
  }
}
