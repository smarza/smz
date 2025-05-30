import { Component, inject } from '@angular/core';
import { SMZ_UI_LAYOUT_CONFIG } from '@smz-ui/layout';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-home-page',
    imports: [ButtonModule],
    template: `
        <h1>Home Page</h1>
        <div class="text-red-500">Red</div>
        <button pButton type="button" label="Toggle Menu Visibility" (click)="toggleMenuVisibility()">Toggle Menu Visibility</button>
    `
})
export class HomePageComponent {
    private readonly smzUILayoutConfig = inject(SMZ_UI_LAYOUT_CONFIG);

    toggleMenuVisibility() {
        this.smzUILayoutConfig.topbar.update((state) => ({ ...state, showMenuToggle: !state.showMenuToggle }));
    }

}