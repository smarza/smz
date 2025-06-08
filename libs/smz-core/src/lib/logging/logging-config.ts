import { LoggingScope } from './logging-scope';

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  restrictedScopes?: LoggingScope[] | string[];
}
