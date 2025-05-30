import { Component, inject } from '@angular/core';
import { HttpResourceService } from '../../services/http-resource.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-http-resource-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <h2 class="text-2xl font-bold mb-4">HTTP Resource Demo</h2>

      <!-- User ID Control -->
      <div class="mb-4">
        <label for="userIdInput" class="block mb-2">User ID:</label>
        <input
          id="userIdInput"
          type="number"
          [value]="service.userId()"
          (input)="updateUserId($event)"
          class="border p-2 rounded"
        />
      </div>

      <!-- User Resource Demo -->
      <div class="mb-6">
        <h3 class="text-xl font-semibold mb-2">User Resource</h3>
        @if (service.userResource.isLoading()) {
          <p>Loading user...</p>
        } @else if (service.userResource.error()) {
          <p class="text-red-500">Error: {{ service.userResource.error() }}</p>
        } @else if (service.userResource.value()) {
          <div class="border p-4 rounded">
            <p><strong>Name:</strong> {{ service.userResource.value()?.name }}</p>
            <p><strong>Email:</strong> {{ service.userResource.value()?.email }}</p>
          </div>
        }
        <button (click)="service.reloadUser()" class="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
          Reload User
        </button>
      </div>

      <!-- Posts Resource Demo -->
      <div class="mb-6">
        <h3 class="text-xl font-semibold mb-2">Posts Resource</h3>
        @if (service.postsResource.isLoading()) {
          <p>Loading posts...</p>
        } @else if (service.postsResource.error()) {
          <p class="text-red-500">Error: {{ service.postsResource.error() }}</p>
        } @else if (service.postsResource.value()) {
          <div class="space-y-2">
            @for (post of service.postsResource.value(); track post.id) {
              <div class="border p-4 rounded">
                <h4 class="font-semibold">{{ post.title }}</h4>
                <p>{{ post.body }}</p>
              </div>
            }
          </div>
        }
        <button (click)="service.reloadPosts()" class="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
          Reload Posts
        </button>
      </div>

      <!-- User with Posts Resource Demo -->
      <div class="mb-6">
        <h3 class="text-xl font-semibold mb-2">User with Posts Resource</h3>
        @if (service.userWithPostsResource.isLoading()) {
          <p>Loading user and posts...</p>
        } @else if (service.userWithPostsResource.error()) {
          <p class="text-red-500">Error: {{ service.userWithPostsResource.error() }}</p>
        } @else if (service.userWithPostsResource.value()) {
          <div class="border p-4 rounded mb-4">
            <h4 class="font-semibold">User Information</h4>
            <p><strong>Name:</strong> {{ service.userWithPostsResource.value()?.user?.name }}</p>
            <p><strong>Email:</strong> {{ service.userWithPostsResource.value()?.user?.email }}</p>
          </div>
          <div class="space-y-2">
            <h4 class="font-semibold">User's Posts</h4>
            @for (post of service.userWithPostsResource.value()?.posts ?? []; track post.id) {
              <div class="border p-4 rounded">
                <h5 class="font-semibold">{{ post.title }}</h5>
                <p>{{ post.body }}</p>
              </div>
            }
          </div>
        }
        <button (click)="service.reloadUserWithPosts()" class="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
          Reload User with Posts
        </button>
      </div>
    </div>
  `
})
export class HttpResourceDemoComponent {
  service = inject(HttpResourceService);

  updateUserId(event: Event) {
    const input = event.target as HTMLInputElement;
    const id = parseInt(input.value, 10);
    if (!isNaN(id)) {
      this.service.updateUserId(id);
    }
  }
} 