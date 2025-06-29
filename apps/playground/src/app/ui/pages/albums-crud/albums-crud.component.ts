import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { AlbumsCrudStore, ALBUMS_CRUD_STORE_TOKEN } from './albums-crud-store.provider';
import { Album } from './album.model';

@Component({
  selector: 'app-albums-crud',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  host: { class: 'flex flex-col gap-4' },
  template: `
    <div class="flex flex-col gap-2">
      <div class="text-3xl font-bold">Albums CRUD Demo</div>
      <div>Status: {{ store.status.status() }}</div>
    </div>

    <form class="flex flex-col gap-2" (ngSubmit)="addAlbum()">
      <input class="border p-1" type="text" placeholder="Title" [(ngModel)]="newTitle" name="title" />
      <button pButton type="submit" label="Create Album" [disabled]="store.selectors.isLoading()"></button>
      @if (store.selectors.isLoading()) { <span>Creating...</span> }
    </form>

    <div class="flex gap-2">
      <button pButton type="button" label="Reload" icon="pi pi-refresh" (click)="store.actions.reload()"></button>
      <button pButton type="button" label="Force Reload" icon="pi pi-refresh" (click)="store.actions.forceReload()"></button>
    </div>

    @if (store.status.isLoading()) {
      <p>Loading albums...</p>
    }

    @if (store.status.isError()) {
      <p class="text-red-500">Error: {{ store.error.error()?.message }}</p>
      <button pButton type="button" label="Clear Error" (click)="store.actions.clearError()"></button>
    }

    @if (store.status.isResolved()) {
      <div>Number of albums: {{ store.selectors.albumCount() }}</div>
      <div class="flex flex-col gap-2">

      @for (a of store.state.state().albums; track a.id) {
          <div class="border p-2 flex gap-2 items-center">

            @if (editingAlbum && editingAlbum.id === a.id) {
              <input class="border p-1 flex-1" [(ngModel)]="editingAlbum.title" name="title-{{a.id}}" />
              <button pButton type="button" icon="pi pi-check" (click)="saveEdit()" [disabled]="store.selectors.isLoading()"></button>
              <button pButton type="button" icon="pi pi-times" (click)="cancelEdit()"></button>
              @if (store.selectors.isLoading()) { <span>Saving...</span> }
            } @else {
              <div class="flex-1">{{ a.title }}</div>
              <button pButton type="button" icon="pi pi-pencil" (click)="startEdit(a)" [disabled]="store.selectors.isLoading()"></button>
              <button pButton type="button" icon="pi pi-trash" severity="danger" (click)="deleteAlbum(a.id)" [disabled]="store.selectors.isLoading()"></button>
              @if (store.selectors.isLoading()) { <span>Deleting...</span> }
            }

          </div>
        }

      </div>
    }
  `
})
export class AlbumsCrudComponent implements OnInit, OnDestroy {
  readonly store: AlbumsCrudStore = inject(ALBUMS_CRUD_STORE_TOKEN);
  newTitle = '';
  editingAlbum: Album | null = null;

  ngOnInit(): void {
    this.store.controls.wakeUp();
  }

  ngOnDestroy(): void {
    this.store.controls.sleep();
  }

  trackById = (_: number, item: Album) => item.id;

  async addAlbum() {
    const title = this.newTitle.trim();
    if (!title) return;
    await this.store.actions.createAlbum({ title });
    this.newTitle = '';
  }

  startEdit(album: Album) {
    this.editingAlbum = { id: album.id, title: album.title };
  }

  cancelEdit() {
    this.editingAlbum = null;
  }

  async saveEdit() {
    if (!this.editingAlbum) return;
    await this.store.actions.updateAlbum(this.editingAlbum);
    this.editingAlbum = null;
  }

  async deleteAlbum(id: number) {
    await this.store.actions.deleteAlbum(id);
  }
}
