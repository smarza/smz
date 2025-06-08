import { Injectable, signal, WritableSignal } from '@angular/core';
import { LoggingConfig } from '../logging-config';
export type SmzLoggingConfigType = {
    logging: WritableSignal<LoggingConfig>;
};

@Injectable({ providedIn: 'root' })
export class SmzLogging {
    logging = signal<LoggingConfig>({
      level: 'debug',
      restrictedScopes: []
    });

    setConfig(config: SmzLoggingConfigType): void {
        const { logging } = config || {};

        if (logging) {
            this.logging = logging;
        };
    }
}
