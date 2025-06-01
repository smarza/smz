import { signal, WritableSignal } from '@angular/core';
import { environment } from '../../environments/environment';
import { LoggingConfig } from '@smz-ui/core';

export const appLogging: WritableSignal<LoggingConfig> = signal<LoggingConfig>({
  enabled: true,
  production: environment.production,
  level: 'debug',
  restrictedScopes: []
});