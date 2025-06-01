import { MenuItem } from 'primeng/api';

export const INITIAL_SIDEBAR: MenuItem[] = [
    {
        label: 'Home',
        items: [
            { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
            { label: 'User Resource Store Demo', icon: 'pi pi-fw pi-user', routerLink: ['/user-resource'] },
            { label: 'Feature Store Demo 1', icon: 'pi pi-fw pi-star', routerLink: ['/feature-store-1'] },
            { label: 'Feature Store Demo 2', icon: 'pi pi-fw pi-star', routerLink: ['/feature-store-2'] },
            { label: 'Global Store Demo', icon: 'pi pi-fw pi-database', routerLink: ['/global-store'] },
        ]
    }
]
