// src/app/features/users/user-profile.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { UserResourceStore } from './features/users/user.resource-store';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-user-resource',
  imports: [ButtonModule],
  template: `
  @if (store.status() === 'loading'){
    <div>
    <p>Loading user…</p>
    </div>
  }
  @else if (store.status() === 'resolved'){
    @let user = store.value();
    <h2>{{ user.name }}</h2>
    <p>{{ user.email }}</p>
    <button pButton type="button" (click)="store.setSelectedUserId(user.id + 1)">
      Load Next User
    </button>
  }
  `
})
export class UserResourceComponent implements OnInit {
  public store = inject(UserResourceStore);

  ngOnInit() {
    // Choose which user to show, e.g. userId = 3
    this.store.setSelectedUserId(1);
  }
}
