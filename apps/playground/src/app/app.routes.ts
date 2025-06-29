import { Route } from '@angular/router';
import { AccessPageComponent, AppLayoutComponent, ErrorPageComponent, NotfoundPageComponent } from '@smz-ui/layout';
import { HomePageComponent } from './ui/pages/home-page.component';
import { UserResourceComponent } from './ui/pages/user-resource/user-resource.component';
import { Counter1Component } from './ui/pages/feature-store/counter-1.component';
import { Counter2Component } from './ui/pages/feature-store/counter-2.component';
import { counter1StoreProvider } from './ui/pages/feature-store/counter-1-store.provider';
import { AuthStoreDemoComponent } from './ui/pages/auth-store/auth-store-demo.component';
import { PostsCrudComponent } from './ui/pages/posts-crud/posts-crud.component';
import { postsCrudStoreProvider } from './ui/pages/posts-crud/posts-crud-store.provider';
import { AlbumsCrudComponent } from './ui/pages/albums-crud/albums-crud.component';
import { albumsCrudStoreProvider } from './ui/pages/albums-crud/albums-crud-store.provider';
import { StoreHistoryComponent } from './ui/pages/store-history/store-history.component';
import { StateStoreDemoComponent } from './ui/pages/state-store-demo/state-store-demo.component';
import { STATE_STORE_DEMO_TOKEN, stateStoreDemoProvider } from './ui/pages/state-store-demo/state-store-demo.provider';
import { createStateStoreGuard } from '@smz-ui/store';

export const appRoutes: Route[] = [
  {
    path: '',
    data: {
      smzUiRoot: true,
    },
    children: [
      {
        path: '',
        component: AppLayoutComponent,
        data: {
          smzUiRoot: true,
        },
        children: [
          { path: 'home', component: HomePageComponent, data: { title: 'Home' } },
          { path: 'user-resource', component: UserResourceComponent, data: { title: 'User Resource Store Demo' } },
          {
            path: 'counter-1',
            component: Counter1Component,
            data: { title: 'Counter 1 Provided in the Route' },
            providers: [counter1StoreProvider],
          },
          {
            path: 'counter-2',
            component: Counter2Component,
            data: { title: 'Counter 2 Provided in the Component' },
            providers: [],
          },
          {
            path: 'posts-crud',
            component: PostsCrudComponent,
            data: { title: 'Posts CRUD Demo' },
            providers: [postsCrudStoreProvider],
          },
          {
            path: 'albums-crud',
            component: AlbumsCrudComponent,
            data: { title: 'Albums CRUD Demo' },
            providers: [albumsCrudStoreProvider],
          },
          {
            path: 'auth-store',
            component: AuthStoreDemoComponent,
            data: { title: 'Auth Store Demo' },
          },
          {
            path: 'store-history',
            component: StoreHistoryComponent,
            data: { title: 'Store History' },
          },
          {
            path: 'state-store',
            component: StateStoreDemoComponent,
            data: { title: 'State Store Demo' },
            providers: [stateStoreDemoProvider],
            canActivate: [createStateStoreGuard(STATE_STORE_DEMO_TOKEN, '/error')],
          },
          { path: '', redirectTo: 'home', pathMatch: 'full' },
        ]
      },
      { path: 'notfound', component: NotfoundPageComponent },
      { path: 'access', component: AccessPageComponent },
      { path: 'error', component: ErrorPageComponent },
    ]
  },
  { path: '**', redirectTo: '/notfound' }
];
