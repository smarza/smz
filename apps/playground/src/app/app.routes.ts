import { Route } from '@angular/router';
import { AccessPageComponent, AppLayoutComponent, ErrorPageComponent, NotfoundPageComponent } from '@smz-ui/layout';
import { HomePageComponent } from './ui/pages/home-page.component';
import { UserResourceComponent } from './ui/pages/user-resource/user-resource.component';
import { CounterFeatureComponent } from './ui/pages/feature-store/counter-feature.component';
import { counterFeatureStoreProvider } from './ui/pages/feature-store/counter-feature-store.provider';
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
            component: CounterFeatureComponent,
            data: { title: 'Feature Store Demo 1' },
            providers: [counterFeatureStoreProvider],
          },
          {
            path: 'feature-store-2',
            component: CounterFeatureComponent,
            data: { title: 'Feature Store Demo 2' },
            providers: [counterFeatureStoreProvider],
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

