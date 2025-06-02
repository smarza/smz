import {
  provideZonelessChangeDetection,
  NgModule,
  signal,
} from '@angular/core';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { getTestBed } from '@angular/core/testing';
import { LoggingConfig, provideSmzLogging } from '@smz-ui/core';

@NgModule({
  providers: [
    provideZonelessChangeDetection(),
    provideSmzLogging(() => [{ logging: signal<LoggingConfig>({
      enabled: true,
      production: false,
      level: 'debug',
      restrictedScopes: []
    }) }]),
  ],
})
export class ZonelessTestModule {}

getTestBed().initTestEnvironment(
  [BrowserDynamicTestingModule, ZonelessTestModule],
  platformBrowserDynamicTesting(),
);