import { Component, inject } from '@angular/core';
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
      <div>Status: {{ store.status() }}</div>
    </div>

    <form class="flex flex-col gap-2" (ngSubmit)="addAlbum()">
      <input class="border p-1" type="text" placeholder="Title" [(ngModel)]="newTitle" name="title" />
      <button pButton type="submit" label="Create Album"></button>
    </form>

    <div class="flex gap-2">
      <button pButton type="button" label="Reload" icon="pi pi-refresh" (click)="store.reload()"></button>
    </div>

    @if (store.isLoading()) {
      <p>Loading albums...</p>
    }

    @if (store.isError()) {
      <p class="text-red-500">Error: {{ store.error()?.message }}</p>
    }

    @if (store.isResolved()) {
      <div>Number of albums: {{ store.state().albums.length }}</div>
      <div class="flex flex-col gap-2">
        <div *ngFor="let a of store.state().albums; trackBy: trackById" class="border p-2 flex gap-2 items-center">
          @if (editingAlbum?.id === a.id) {
            <input class="border p-1 flex-1" [(ngModel)]="editingAlbum.title" name="title-{{a.id}}" (blur)="saveEdit()" />
            <button pButton type="button" icon="pi pi-check" (click)="saveEdit()"></button>
            <button pButton type="button" icon="pi pi-times" (click)="cancelEdit()"></button>
          } @else {
            <div class="flex-1">{{ a.title }}</div>
            <button pButton type="button" icon="pi pi-pencil" (click)="startEdit(a)"></button>
            <button pButton type="button" icon="pi pi-trash" severity="danger" (click)="deleteAlbum(a.id)"></button>
          }
        </div>
      </div>
    }
  `
})
export class AlbumsCrudComponent {
  readonly store: AlbumsCrudStore = inject(ALBUMS_CRUD_STORE_TOKEN);
  newTitle = '';
  editingAlbum: Album | null = null;

  trackById = (_: number, item: Album) => item.id;

  async addAlbum() {
    const title = this.newTitle.trim();
    if (!title) return;
    await this.store.createAlbum({ title });
    this.newTitle = '';
  }

  startEdit(album: Album) {
    this.editingAlbum = { ...album };
  }

  cancelEdit() {
    this.editingAlbum = null;
  }

  async saveEdit() {
    if (!this.editingAlbum) return;
    await this.store.updateAlbum(this.editingAlbum);
    this.editingAlbum = null;
  }

  async deleteAlbum(id: number) {
    await this.store.deleteAlbum(id);
  }
}
