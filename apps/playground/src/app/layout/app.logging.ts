import { signal, WritableSignal } from '@angular/core';
import { LoggingConfig as LoggingConfigLayout, LoggingScope as LoggingScopeLayout } from '@smz-ui/layout';
// import { environment } from '@environments/environment';

export const appLoggingLayout: WritableSignal<LoggingConfigLayout> = signal<LoggingConfigLayout>({
  enabled: true,
  production: false, //environment.production,
  level: 'debug',
  restrictedScopes: [LoggingScopeLayout.NavigationService, LoggingScopeLayout.PageTitleService]
});