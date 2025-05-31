import { Route } from '@angular/router';
import { AccessPageComponent, AppLayoutComponent, ErrorPageComponent, NotfoundPageComponent } from '@smz-ui/layout';
import { HomePageComponent } from './ui/pages/home-page.component';
import { Page1Component } from './ui/pages/page-1.component';
import { Page2Component } from './ui/pages/page-2.component';
import { HttpResourceDemoComponent } from './ui/http-resource-demo/http-resource-demo.component';
import { UserResourceDemoComponent } from './ui/http-resource-demo/user-resource-demo.component';
import { StoreComponent } from './ui/pages/store/store.component';

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
          { path: 'page-1', component: Page1Component, data: { title: 'Page 1' } },
          { path: 'page-2', component: Page2Component, data: {} },
          { path: 'store', component: StoreComponent, data: { title: 'Store' } },
          { path: 'http-resource-demo', component: HttpResourceDemoComponent, data: { title: 'HTTP Resource Demo' } },
          { path: 'user-resource-demo', component: UserResourceDemoComponent, data: { title: 'User Resource Demo' } },
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

