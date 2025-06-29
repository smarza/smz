import {
  provideZonelessChangeDetection,
  NgModule,
  signal,
} from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import { LoggingConfig, provideSmzLogging } from '@smz-ui/core';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

@NgModule({
  providers: [
    provideZonelessChangeDetection(),
    provideSmzLogging(() => [{ logging: signal<LoggingConfig>({
      level: 'debug',
      restrictedScopes: []
    }) }]),
  ],
})
export class ZonelessTestModule {}

getTestBed().initTestEnvironment(
  [BrowserTestingModule, ZonelessTestModule],
  platformBrowserTesting(),
);