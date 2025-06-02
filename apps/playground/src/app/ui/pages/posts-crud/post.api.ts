import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Post } from './post.model';

@Injectable({ providedIn: 'root' })
export class PostApiService {
  constructor(private http: HttpClient) {}

  getPosts() {
    return firstValueFrom(this.http.get<Post[]>('https://jsonplaceholder.typicode.com/posts'));
  }

  createPost(post: Omit<Post, 'id'>) {
    return firstValueFrom(this.http.post<Post>('https://jsonplaceholder.typicode.com/posts', post));
  }

  updatePost(post: Post) {
    return firstValueFrom(this.http.put<Post>(`https://jsonplaceholder.typicode.com/posts/${post.id}`, post));
  }

  deletePost(id: number) {
    return firstValueFrom(this.http.delete<void>(`https://jsonplaceholder.typicode.com/posts/${id}`));
  }
}
