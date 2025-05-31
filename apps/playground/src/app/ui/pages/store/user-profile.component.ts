// src/app/features/users/user-profile.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { UserWithPostsFacade } from './features/users/user-with-posts.facade';

@Component({
  selector: 'app-user-profile',
  template: `
  @if (store.status() === 'loading'){
    <div>
      <p>Loading user & posts…</p>
    </div>
  }
  @else {
    <h2>{{ store.userWithPosts().user.name }}</h2>
      <p>{{ store.userWithPosts().user.email }}</p>

      <h3>Posts</h3>
      <ul>
        @for (post of store.userWithPosts().posts; track post.id) {
          <li>
            <strong>{{ post.title }}</strong>: {{ post.body }}
          </li>
        }
      </ul>
      <button (click)="store.reloadAll()">Reload All</button>
  }
  `
})
export class UserProfileComponent implements OnInit {
  public store = inject(UserWithPostsFacade);

  ngOnInit() {
    // Choose which user to show, e.g. userId = 3
    this.store.selectUser(3);
  }
}
