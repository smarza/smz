// navigation.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoggingScope, ScopedLogger, LOGGING_SERVICE } from '@smz-ui/core';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private router = inject(Router);
  private location = inject(Location);
  private history = signal<string[]>(['/']);
  private isPopping = signal(false);
  public readonly canGoBack = computed(() => this.history().length > 1);
  private logger: ScopedLogger = inject(LOGGING_SERVICE).scoped(LoggingScope.NavigationService);

  constructor() {

    this.router.events
      .pipe(filter(evt => evt instanceof NavigationEnd))
      .subscribe((evt: NavigationEnd) => {
        const raw = evt.url;
        const finalUrl = evt.urlAfterRedirects;
        const hist = this.history();

        this.logger.info(`🔔 NavigationEnd raw="${raw}", final="${finalUrl}"`);
        this.logger.debug(`   isPopping=${this.isPopping()}, history=[${hist.join(' → ')}]`);

        // 1) Caso goBack()
        if (this.isPopping()) {
          this.logger.debug(' → Caso goBack(): limpando flag isPopping');
          this.isPopping.set(false);
          return;
        }

        // 2) Primeira navegação, history === ['/']
        if (hist.length === 1 && hist[0] === '/') {
          // 2.a) redirect "/" -> "/home" (ou outro default)
          if (raw === '/' && finalUrl !== '/') {
            this.logger.debug(` → Detectado redirect "/" → "${finalUrl}", ajustando history`);
            this.history.set([finalUrl]);
            return;
          }

          // 2.b) entrou direto em sub-rota sem passar por "/"
          if (raw === finalUrl && raw !== '/') {
            this.logger.debug(` → Entrada direta em sub-rota "${finalUrl}", iniciando history ["/", "${finalUrl}"]`);
            this.history.set(['/']);
            this.history.update(h => [...h, finalUrl]);
            return;
          }

          // 2.c) navegação inicial em "/" sem redirect
          if (finalUrl === '/') {
            this.logger.debug(' → Navegação inicial em "/", mantendo history');
            return;
          }
        }

        // 3) Demais navegações internas
        this.logger.debug(` → Navegação normal para "${finalUrl}", adicionando ao history`);
        this.history.update(h => [...h, finalUrl]);
      });
  }

  /** Para template: [disabled]="!navigationService.canGoBackSignal()" */
  public canGoBackSignal(): boolean {
    return this.canGoBack();
  }

  /** Volta um passo: remove do history e chama Location.back() */
  public goBack(): void {
    this.logger.info('goBack() chamado');
    if (!this.canGoBack()) {
      this.logger.debug(' → Não há para onde voltar, abortando');
      return;
    }
    this.logger.debug(' → isPopping=true e removendo último item do history');
    this.isPopping.set(true);
    this.history.update(h => {
      const newHist = h.slice(0, -1);
      this.logger.debug(`   novo history = [${newHist.join(' → ')}]`);
      return newHist;
    });
    this.location.back();
  }
}
