// logging.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { SMZ_LAYOUT_LOGGING_CONFIG } from './config/provide';
import { LoggingScope } from './logging-scope';
import { LoggingConfig } from './logging-config';
import { ScopedLogger } from './scoped-logger';

@Injectable({ providedIn: 'root' })
export class LoggingService {
  private configFn = inject(SMZ_LAYOUT_LOGGING_CONFIG).logging as () => LoggingConfig;
  private enabled = signal<boolean>(this.configFn().enabled);

  // nível de each log: debug=0, info=1, warn=2, error=3
  private levelRank: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };

  /** expose current settings */
  public readonly isEnabled = computed(() => this.enabled());
  public readonly currentLevel = computed(() => this.configFn().level ?? 'debug');
  public readonly activeScopes = computed(() => this.configFn().restrictedScopes ?? []);

  /** toggle logging global */
  public enable(): void { this.enabled.set(true); }
  public disable(): void { this.enabled.set(false); }
  public toggle(): void { this.enabled.update(e => !e); }

  private shouldLog(
    method: 'debug' | 'info' | 'warn' | 'error',
    owner?: LoggingScope | string
  ): boolean {
    if (!this.enabled()) {
      return false;
    }
    const cfg = this.configFn();
    // nunca log de debug em produção
    if (cfg.production && method === 'debug') {
      return false;
    }
    // respeita nivel configurado
    const cfgLevel = cfg.level ?? 'debug';
    if (this.levelRank[method] < this.levelRank[cfgLevel]) {
      return false;
    }
    // respeita scopes se fornecido
    const scopes = cfg.restrictedScopes;
    if (scopes && scopes.length > 0 && owner) {
      if (!(scopes.includes(LoggingScope['*' as keyof typeof LoggingScope]) || scopes.includes(owner as LoggingScope))) {
        return false;
      }
    }
    return true;
  }

  public log(message?: unknown, ...optionalParams: unknown[]): void {
    if (!this.shouldLog('info')) return;
    console.log(message, ...optionalParams);
  }

  public warn(message?: unknown, ...optionalParams: unknown[]): void {
    if (!this.shouldLog('warn')) return;
    console.warn(message, ...optionalParams);
  }

  public error(message?: unknown, ...optionalParams: unknown[]): void {
    if (!this.shouldLog('error')) return;
    console.error(message, ...optionalParams);
  }

  public debug(message?: unknown, ...optionalParams: unknown[]): void {
    if (!this.shouldLog('debug')) return;
    console.debug(message, ...optionalParams);
  }

  /**
   * Retorna um logger com prefixo [owner] e restringe pelos scopes do config
   * owner agora é um LoggingScope
   */
  public scoped(owner: LoggingScope | string): ScopedLogger {
    const prefix = `[${owner}]`;
    return {
      log: (msg?: unknown, ...params: unknown[]) => {
        if (!this.shouldLog('info', owner)) return;
        console.log(prefix, msg, ...params);
      },
      warn: (msg?: unknown, ...params: unknown[]) => {
        if (!this.shouldLog('warn', owner)) return;
        console.warn(prefix, msg, ...params);
      },
      error: (msg?: unknown, ...params: unknown[]) => {
        if (!this.shouldLog('error', owner)) return;
        console.error(prefix, msg, ...params);
      },
      debug: (msg?: unknown, ...params: unknown[]) => {
        if (!this.shouldLog('debug', owner)) return;
        console.debug(prefix, msg, ...params);
      }
    };
  }
}
