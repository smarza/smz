// src/app/features/posts/post.api.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Post } from './post.model';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PostApiService {
  constructor(private http: HttpClient) {}

  getPostsByUser(userId: number) {
    return firstValueFrom(
      this.http.get<Post[]>(`https://jsonplaceholder.typicode.com/posts`, {
        params: { userId: `${userId}` }
      })
    );
  }
}
