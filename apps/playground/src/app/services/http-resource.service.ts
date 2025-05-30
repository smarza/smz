import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { resource } from '@angular/core';
import { Observable, catchError, firstValueFrom, of, delay } from 'rxjs';

// Example interfaces
interface User {
  id: number;
  name: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

@Injectable({
  providedIn: 'root'
})
export class HttpResourceService {
  // Signal to control the user ID
  userId = signal<number>(1);

  constructor(private http: HttpClient) {}

  // Example 1: Basic user resource
  userResource = resource({
    params: () => ({ id: this.userId() }),
    loader: async ({ params }) => {
      const response = await firstValueFrom(
        this.http.get<User>(`https://jsonplaceholder.typicode.com/users/${params.id}`).pipe(
          delay(1500) // 1.5 seconds delay
        )
      );
      return response;
    }
  });

  // Example 2: Posts resource with error handling
  postsResource = resource({
    params: () => ({ userId: this.userId() }),
    loader: async ({ params }) => {
      try {
        const response = await firstValueFrom(
          this.http.get<Post[]>(`https://jsonplaceholder.typicode.com/posts?userId=${params.userId}`).pipe(
            delay(2000) // 2 seconds delay
          )
        );
        return response;
      } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
      }
    }
  });

  // Example 3: Resource with transformation
  userWithPostsResource = resource({
    params: () => ({ id: this.userId() }),
    loader: async ({ params }) => {
      const user = await firstValueFrom(
        this.http.get<User>(`https://jsonplaceholder.typicode.com/users/${params.id}`).pipe(
          delay(1000) // 1 second delay
        )
      );

      const posts = await firstValueFrom(
        this.http.get<Post[]>(`https://jsonplaceholder.typicode.com/posts?userId=${params.id}`).pipe(
          delay(1500) // 1.5 seconds delay
        )
      );

      return {
        user,
        posts
      };
    }
  });

  // Method to update user ID
  updateUserId(id: number) {
    this.userId.set(id);
  }

  // Method to reload resources
  reloadUser() {
    this.userResource.reload();
  }

  reloadPosts() {
    this.postsResource.reload();
  }

  reloadUserWithPosts() {
    this.userWithPostsResource.reload();
  }
} 