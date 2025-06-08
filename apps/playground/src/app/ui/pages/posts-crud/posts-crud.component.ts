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
      <button pButton type="submit" label="Create Post" [disabled]="createStatus() === 'loading'"></button>
      @if (createStatus() === 'loading') { <span>Creating...</span> }
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
      <div>Number of posts: {{ store.state().posts.length }}</div>
      <div class="flex flex-col gap-2">

        @for (p of store.state().posts; track p.id) {
        <div class="border p-2 flex flex-col gap-2">

          @if (editingPost && editingPost.id === p.id) {
            <input class="border p-1" [(ngModel)]="editingPost.title" name="title-{{p.id}}" />
            <textarea class="border p-1" rows="2" [(ngModel)]="editingPost.body" name="body-{{p.id}}"></textarea>
            <div class="flex gap-2">
              <button pButton type="button" label="Save" icon="pi pi-check" (click)="saveEdit()" [disabled]="updateStatus() === 'loading'"></button>
              <button pButton type="button" label="Cancel" icon="pi pi-times" (click)="cancelEdit()"></button>
              @if (updateStatus() === 'loading') { <span>Saving...</span> }
            </div>
          } @else {
            <div class="font-bold">{{ p.title }}</div>
            <div>{{ p.body }}</div>
            <div class="flex gap-2">
              <button pButton type="button" label="Edit" icon="pi pi-pencil" (click)="startEdit(p)" [disabled]="updateStatus() === 'loading'"></button>
              <button pButton type="button" label="Delete" severity="danger" (click)="deletePost(p.id)" [disabled]="deleteStatus() === 'loading'"></button>
              @if (deleteStatus() === 'loading') { <span>Deleting...</span> }
            </div>
          }

        </div>
        }

      </div>
    }
  `
})
export class PostsCrudComponent {
  readonly store: PostsCrudStore = inject(POSTS_CRUD_STORE_TOKEN);
  createStatus = this.store.getActionStatusSignal('createPost');
  updateStatus = this.store.getActionStatusSignal('updatePost');
  deleteStatus = this.store.getActionStatusSignal('deletePost');
  newTitle = '';
  newBody = '';
  editingPost: Post | null = null;

  trackById = (_: number, item: Post) => item.id;

  async addPost() {
    const title = this.newTitle.trim();
    const body = this.newBody.trim();
    if (!title || !body) return;
    await this.store.createPost({ title, body });
    this.newTitle = '';
    this.newBody = '';
  }

  startEdit(post: Post) {
    this.editingPost = { ...post };
  }

  cancelEdit() {
    this.editingPost = null;
  }

  async saveEdit() {
    if (!this.editingPost) return;
    await this.store.updatePost(this.editingPost);
    this.editingPost = null;
  }

  async deletePost(id: number) {
    await this.store.deletePost(id);
  }
}
