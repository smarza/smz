import { MenuItem } from 'primeng/api';

export const INITIAL_SIDEBAR: MenuItem[] = [
    {
        label: 'Home',
        items: [
            { label: 'Dashboard', icon: 'fa-solid fa-house', routerLink: ['/'] },
            { label: 'Store History', icon: 'fa-solid fa-clock', routerLink: ['/store-history'] },
        ]
    },
    {
      label: 'Resource Stores',
      items: [
          { label: 'User Resource Store Demo', icon: 'fa-solid fa-user', routerLink: ['/user-resource'] },
      ]
    },
    {
      label: 'App Provided Stores',
      items: [
          { label: 'Auth Store Demo', icon: 'fa-solid fa-user-shield', routerLink: ['/auth-store'] },
      ]
    },
    {
      label: 'Route Provided Stores',
      items: [
          { label: 'Counter 1', icon: 'fa-solid fa-counter', routerLink: ['/counter-1'] },
          { label: 'State Store Demo', icon: 'fa-solid fa-database', routerLink: ['/state-store'] },
          { label: 'Posts CRUD Demo', icon: 'fa-solid fa-file-pen', routerLink: ['/posts-crud'] },
          { label: 'Albums CRUD Demo', icon: 'fa-solid fa-album', routerLink: ['/albums-crud'] },
      ]
    },
    {
      label: 'Component Provided Stores',
      items: [
          { label: 'Counter 2', icon: 'fa-solid fa-counter', routerLink: ['/counter-2'] },
      ]
    },
]
