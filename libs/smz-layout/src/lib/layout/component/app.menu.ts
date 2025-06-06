import { Component, inject, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitemComponent } from './app.menuitem';
import { SMZ_UI_LAYOUT_CONFIG } from '../../config/provide';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitemComponent, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model(); let i = index">
            <li app-menuitem *ngIf="!item.separator && hasClaim?.(item['claims'])" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenuComponent {
    public model: WritableSignal<MenuItem[]> = inject(SMZ_UI_LAYOUT_CONFIG).sidebar;
    public hasClaim = inject(SMZ_UI_LAYOUT_CONFIG).hasClaim;
}
