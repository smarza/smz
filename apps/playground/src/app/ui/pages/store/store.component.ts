import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { AuthDemoComponent } from './auth-demo.component';
import { UserProfileComponent } from './user-profile.component';
import { AuthStore } from './features/auth/auth.store';
@Component({
    selector: 'app-store',
    imports: [ButtonModule, AuthDemoComponent, UserProfileComponent],
    template: `
        <h1>Store</h1>
        <app-auth-demo />
        @if (authStore.isLoggedIn()) {
            <app-user-profile />
        }
    `
})
export class StoreComponent {
    authStore = inject(AuthStore);
}