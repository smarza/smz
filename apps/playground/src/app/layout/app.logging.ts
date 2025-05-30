import { signal, WritableSignal } from '@angular/core';
import { environment } from '../../environments/environment';
import { LoggingConfig as LoggingConfigLayout, LoggingScope as LoggingScopeLayout } from '@smz-ui/layout';


export const appLoggingLayout: WritableSignal<LoggingConfigLayout> = signal<LoggingConfigLayout>({
  enabled: true,
  production: environment.production,
  level: 'debug',
  restrictedScopes: [LoggingScopeLayout.NavigationService, LoggingScopeLayout.PageTitleService]
});