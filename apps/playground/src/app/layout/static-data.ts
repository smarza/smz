import { MenuItem } from 'primeng/api';

export const INITIAL_SIDEBAR: MenuItem[] = [
    {
        label: 'Home',
        items: [
            { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
            { label: 'User Resource Store Demo', icon: 'pi pi-fw pi-user', routerLink: ['/user-resource'] },
            { label: 'Feature Store Demo 1 (Provided in the Route)', icon: 'pi pi-fw pi-star', routerLink: ['/feature-store-1'] },
            { label: 'Feature Store Demo 2 (Provided in the Component)', icon: 'pi pi-fw pi-star', routerLink: ['/feature-store-2'] },
            { label: 'Global Store Demo', icon: 'pi pi-fw pi-database', routerLink: ['/global-store'] },
            { label: 'Posts CRUD Demo', icon: 'pi pi-fw pi-database', routerLink: ['/posts-crud'] },
            { label: 'Albums CRUD Demo', icon: 'pi pi-fw pi-database', routerLink: ['/albums-crud'] },
        ]
    }
]
