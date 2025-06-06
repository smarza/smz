import { signal, WritableSignal } from '@angular/core';
import { Topbar } from '@smz-ui/layout';

export const appTopbar: WritableSignal<Topbar> = signal<Topbar>({
  showMenuToggle: true,
  showBackButton: true,
  logoPath: {
    light: 'horizontal-light.svg',
    dark: 'horizontal-dark.svg'
  },
  appName: 'Playground',
  showConfigurator: true,
  showDarkModeToggle: true,
  menuItems: [
    // {
    //   component: {
    //     component: SmzTenantSwitchComponent,
    //     inputs: [],
    //     outputs: []
    //   }
    // },
    {
        icon: 'pi pi-calendar',
        label: 'Calendar',
        routerLink: '/calendar',
        callback: () => {
            console.log('Calendar');
        }
    },
    {
        icon: 'pi pi-user',
        label: 'Profile',
        callback: () => {
            console.log('Profile');
        }
    },
    {
        icon: 'pi pi-inbox',
        label: 'Messages',
        callback: () => {
            console.log('Messages');
        }
    }
  ]
})