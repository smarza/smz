import { Component, inject, OnInit, OnDestroy } from '@angular/core';
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
      <div>Status: {{ store.status.status() }}</div>
    </div>

    <form class="flex flex-col gap-2" (ngSubmit)="addPost()">
      <input class="border p-1" type="text" placeholder="Title" [(ngModel)]="newTitle" name="title" />
      <textarea class="border p-1" rows="3" placeholder="Body" [(ngModel)]="newBody" name="body"></textarea>
      <button pButton type="submit" label="Create Post" [disabled]="store.selectors.isLoading()"></button>
      @if (store.selectors.isLoading()) { <span>Creating...</span> }
    </form>

    <div class="flex gap-2">
      <button pButton type="button" label="Reload" icon="pi pi-refresh" (click)="store.actions.reload()"></button>
      <button pButton type="button" label="Force Reload" icon="pi pi-refresh" (click)="store.actions.forceReload()"></button>
    </div>

    @if (store.status.isLoading()) {
      <p>Loading posts...</p>
    }

    @if (store.status.isError()) {
      <p class="text-red-500">Error: {{ store.error.error()?.message }}</p>
    }

    @if (store.status.isResolved()) {
      <div>Number of posts: {{ store.selectors.postsCount() }}</div>
      <div class="flex flex-col gap-2">

        @for (p of store.state.state().posts; track p.id) {
        <div class="border p-2 flex flex-col gap-2">

          @if (editingPost && editingPost.id === p.id) {
            <input class="border p-1" [(ngModel)]="editingPost.title" name="title-{{p.id}}" />
            <textarea class="border p-1" rows="2" [(ngModel)]="editingPost.body" name="body-{{p.id}}"></textarea>
            <div class="flex gap-2">
              <button pButton type="button" label="Save" icon="pi pi-check" (click)="saveEdit()" [disabled]="store.selectors.isLoading()"></button>
              <button pButton type="button" label="Cancel" icon="pi pi-times" (click)="cancelEdit()"></button>
              @if (store.selectors.isLoading()) { <span>Saving...</span> }
            </div>
          } @else {
            <div class="font-bold">{{ p.title }}</div>
            <div>{{ p.body }}</div>
            <div class="flex gap-2">
              <button pButton type="button" label="Edit" icon="pi pi-pencil" (click)="startEdit(p)" [disabled]="store.selectors.isLoading()"></button>
              <button pButton type="button" label="Delete" severity="danger" (click)="deletePost(p.id)" [disabled]="store.selectors.isLoading()"></button>
              @if (store.selectors.isLoading()) { <span>Deleting...</span> }
            </div>
          }

        </div>
        }

      </div>
    }
  `
})
export class PostsCrudComponent implements OnInit, OnDestroy {
  readonly store: PostsCrudStore = inject(POSTS_CRUD_STORE_TOKEN);
  newTitle = '';
  newBody = '';
  editingPost: Post | null = null;

  ngOnInit(): void {
    // Wake up the store to activate plugins
    this.store.controls.wakeUp();
  }

  ngOnDestroy(): void {
    // Put the store to sleep to clean up plugins
    this.store.controls.sleep();
  }

  async addPost() {
    const title = this.newTitle.trim();
    const body = this.newBody.trim();
    if (!title || !body) return;

    try {
      await this.store.actions.createPost({ title, body });
      this.newTitle = '';
      this.newBody = '';
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  }

  startEdit(post: Post) {
    this.editingPost = { ...post };
  }

  cancelEdit() {
    this.editingPost = null;
  }

  async saveEdit() {
    if (!this.editingPost) return;

    try {
      await this.store.actions.updatePost(this.editingPost);
      this.editingPost = null;
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  }

  async deletePost(id: number) {
    try {
      await this.store.actions.deletePost(id);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  }
}
