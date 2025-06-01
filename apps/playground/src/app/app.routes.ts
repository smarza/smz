import { Route } from '@angular/router';
import { AccessPageComponent, AppLayoutComponent, ErrorPageComponent, NotfoundPageComponent } from '@smz-ui/layout';
import { HomePageComponent } from './ui/pages/home-page.component';
import { UserResourceComponent } from './ui/pages/user-resource/user-resource.component';
import { CounterFeature1Component } from './ui/pages/feature-store/counter-feature-1.component';
import { CounterFeature2Component } from './ui/pages/feature-store/counter-feature-2.component';
import { counterFeature1StoreProvider } from './ui/pages/feature-store/counter-feature-1-store.provider';
import { GlobalStoreDemoComponent } from './ui/pages/global-store-demo/global-store-demo.component';

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
          { path: 'global-store', component: GlobalStoreDemoComponent, data: { title: 'Global Store Demo' } },
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

