import { Route } from '@angular/router';
import { AccessPageComponent, AppLayoutComponent, ErrorPageComponent, NotfoundPageComponent } from '@smz-ui/layout';
import { HomePageComponent } from './ui/pages/home-page.component';
import { UserResourceComponent } from './ui/pages/user-resource/user-resource.component';
import { CounterFeature1Component } from './ui/pages/feature-store/counter-feature-1.component';
import { CounterFeature2Component } from './ui/pages/feature-store/counter-feature-2.component';
import { counterFeature1StoreProvider } from './ui/pages/feature-store/counter-feature-1-store.provider';
import { GlobalStoreDemoComponent } from './ui/pages/global-store-demo/global-store-demo.component';
import { PostsCrudComponent } from './ui/pages/posts-crud/posts-crud.component';
import { postsCrudStoreProvider } from './ui/pages/posts-crud/posts-crud-store.provider';
import { AlbumsCrudComponent } from './ui/pages/albums-crud/albums-crud.component';
import { albumsCrudStoreProvider } from './ui/pages/albums-crud/albums-crud-store.provider';
import { StoreHistoryComponent } from './ui/pages/store-history/store-history.component';
import { StateStoreDemoComponent } from './ui/pages/state-store-demo/state-store-demo.component';
import { stateStoreDemoProvider } from './ui/pages/state-store-demo/state-store-demo.provider';

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
            path: 'feature-store-1',
            component: CounterFeature1Component,
            data: { title: 'Feature Store Demo 1 Provided in the Route' },
            providers: [counterFeature1StoreProvider],
          },
          {
            path: 'feature-store-2',
            component: CounterFeature2Component,
            data: { title: 'Feature Store Demo 2 Provided in the Component' },
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
            path: 'global-store',
            component: GlobalStoreDemoComponent,
            data: { title: 'Global Store Demo' },
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
