/* eslint-disable @typescript-eslint/no-explicit-any */
// logging.service.ts
import { Injectable, InjectionToken, inject, Provider } from '@angular/core';
import { LoggingConfig } from './logging-config';
import { LoggingScope } from './logging-scope';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const LOGGING_CONFIG = new InjectionToken<LoggingConfig>('LOGGING_CONFIG');

export interface ILoggingService {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  scoped(scope: string): ILoggingService;
}

@Injectable({ providedIn: 'root' })
export class NullLoggingService implements ILoggingService {
  debug(): void {
    // Null implementation
  }
  info(): void {
    // Null implementation
  }
  warn(): void {
    // Null implementation
  }
  error(): void {
    // Null implementation
  }
  scoped(): ILoggingService {
    return this;
  }
}

@Injectable({ providedIn: 'root' })
export class LoggingService implements ILoggingService {
  private scope = 'App';
  private readonly levelRank: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
  private readonly config = inject(LOGGING_CONFIG);

  private shouldLog(method: LogLevel, scope: string): boolean {
    // Check level
    if (this.levelRank[method] < this.levelRank[this.config.level]) {
      return false;
    }

    // Check scopes
    const restrictedScopes = this.config.restrictedScopes;
    if (restrictedScopes && restrictedScopes.length > 0) {
      return restrictedScopes.some(s => s === scope || s === LoggingScope.All);
    }

    return true;
  }

  public debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug', this.scope)) {
      console.debug(`[${this.scope}] ${message}`, ...args);
    }
  }

  public info(message: string, ...args: any[]): void {
    if (this.shouldLog('info', this.scope)) {
      console.info(`[${this.scope}] ${message}`, ...args);
    }
  }

  public warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn', this.scope)) {
      console.warn(`[${this.scope}] ${message}`, ...args);
    }
  }

  public error(message: string, ...args: any[]): void {
    if (this.shouldLog('error', this.scope)) {
      console.error(`[${this.scope}] ${message}`, ...args);
    }
  }

  public scoped(scope: string): ILoggingService {
    const service = new LoggingService();
    service.scope = scope;
    return service;
  }
}

export const LOGGING_SERVICE = new InjectionToken<ILoggingService>('LOGGING_SERVICE', {
  providedIn: 'root',
  factory: () => inject(NullLoggingService)
});

export function provideLogging(config: LoggingConfig = { level: 'info' }): Provider[] {
  return [
    { provide: LOGGING_CONFIG, useValue: config },
    { provide: LOGGING_SERVICE, useClass: LoggingService }
  ];
}
