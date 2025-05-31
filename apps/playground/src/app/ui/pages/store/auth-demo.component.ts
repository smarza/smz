import { Component, inject } from '@angular/core';
import { AuthStore } from './features/auth/auth.store';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-auth-demo',
  imports: [CommonModule, ButtonModule],
  template: `
    @if (authStore.loading() === false) {
      @if (authStore.isLoggedIn()) {
        <p>Welcome, {{ authStore.currentUser()?.name }}!</p>
        <button pButton type="button" (click)="authStore.logout()">Logout</button>
      } @else {
        <button pButton type="button" (click)="authStore.login(credentials)">Login</button>
      }
    } @else {
      <p>Logging in…</p>
    }
  `
})
export class AuthDemoComponent {
  authStore = inject(AuthStore);
  credentials = { username: 'test@example.com', password: 'password' };
}
