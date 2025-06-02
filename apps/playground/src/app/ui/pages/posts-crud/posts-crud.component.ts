import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { PostsCrudStore, POSTS_CRUD_STORE_TOKEN } from './posts-crud-store.provider';
import { Post } from './post.model';

@Component({
  selector: 'app-posts-crud',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  host: { class: 'flex flex-col gap-4' },
  template: `
    <div class="flex flex-col gap-2">
      <div class="text-3xl font-bold">Posts CRUD Demo</div>
      <div>Status: {{ store.status() }}</div>
    </div>

    <form class="flex flex-col gap-2" (ngSubmit)="addPost()">
      <input class="border p-1" type="text" placeholder="Title" [(ngModel)]="newTitle" name="title" />
      <textarea class="border p-1" rows="3" placeholder="Body" [(ngModel)]="newBody" name="body"></textarea>
      <button pButton type="submit" label="Create Post"></button>
    </form>

    <div class="flex gap-2">
      <button pButton type="button" label="Reload" icon="pi pi-refresh" (click)="store.reload()"></button>
    </div>

    @if (store.isLoading()) {
      <p>Loading posts...</p>
    }

    @if (store.isError()) {
      <p class="text-red-500">Error: {{ store.error()?.message }}</p>
    }

    @if (store.isResolved()) {
      <!-- Add a counter of the number of posts -->
      <div>Number of posts: {{ store.state().posts.length }}</div>

      <div class="flex flex-col gap-2">
        <div *ngFor="let post of store.state().posts; trackBy: trackById" class="border p-2 flex flex-col gap-2">
          <input class="border p-1" [(ngModel)]="post.title" name="title-{{post.id}}" (blur)="updatePost(post)" />
          <textarea class="border p-1" rows="2" [(ngModel)]="post.body" name="body-{{post.id}}" (blur)="updatePost(post)"></textarea>
          <button pButton type="button" label="Delete" severity="danger" (click)="deletePost(post.id)"></button>
        </div>
      </div>
    }
  `
})
export class PostsCrudComponent {
  readonly store: PostsCrudStore = inject(POSTS_CRUD_STORE_TOKEN);
  newTitle = '';
  newBody = '';

  trackById = (_: number, item: Post) => item.id;

  async addPost() {
    const title = this.newTitle.trim();
    const body = this.newBody.trim();
    if (!title || !body) return;
    await this.store.createPost({ title, body });
    this.newTitle = '';
    this.newBody = '';
  }

  async updatePost(post: Post) {
    await this.store.updatePost(post);
  }

  async deletePost(id: number) {
    await this.store.deletePost(id);
  }
}
