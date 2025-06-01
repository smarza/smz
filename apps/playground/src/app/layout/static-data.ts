import { MenuItem } from 'primeng/api';

export const INITIAL_SIDEBAR: MenuItem[] = [
    {
        label: 'Home',
        items: [
            { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
            { label: 'User Resource Store Demo', icon: 'pi pi-fw pi-user', routerLink: ['/user-resource'] },
        ]
    }
]
