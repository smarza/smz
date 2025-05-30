import { Injectable, signal } from '@angular/core';
import { noop } from 'rxjs';

export interface ErrorPageButton {
  label: string;
  url: string;
  command?: () => void;
  severity?: 'success' | 'info' | 'warn' | 'danger' | 'help' | 'primary' | 'secondary' | 'contrast';
}

export interface ErrorPagesConfig {
  notfound?: {
    code: number;
    title: string;
    message: string;
    links: {
      icon: string;
      title: string;
      description: string;
      url: string;
    }[];
    buttons: ErrorPageButton[];
  };
  access?: {
    icon: string;
    title: string;
    message: string;
    imagePath: string;
    buttons: ErrorPageButton[];
  };
  error?: {
    icon: string;
    title: string;
    message: string;
    imagePath: string;
    buttons: ErrorPageButton[];
  };
}

@Injectable({ providedIn: 'root' })
export class ErrorPagesConfigService {
  // Criando um signal com a configuração padrão inicial
  public readonly config = signal<ErrorPagesConfig>({
    notfound: {
      code: 404,
      title: 'Página não encontrada',
      message: 'A página que você está procurando não foi encontrada.',
      links: [],
      buttons: [
        {
          label: 'Voltar para a home',
          url: '/',
          command: noop,
          severity: 'warn'
        }
      ]
    },
    access: {
      icon: 'pi pi-fw pi-lock',
      title: 'Acesso restrito',
      message: 'Acesso restrito',
      imagePath: 'asset-access.svg',
      buttons: [
        {
          label: 'Voltar para a home',
          url: '/',
          command: noop,
          severity: 'warn'
        }
      ]
    },
    error: {
      icon: 'pi pi-fw pi-exclamation-circle',
      title: 'Ocorreu um erro',
      message: 'Ocorreu um erro ao carregar a página.',
      imagePath: 'asset-error.svg',
      buttons: [
        {
          label: 'Voltar para a home',
          url: '/',
          command: noop,
          severity: 'danger'
        },
      ]
    }
  });

  // Método para atualizar dinamicamente a configuração de forma merge
  updateConfig(newConfig: Partial<ErrorPagesConfig>): void {
    this.config.update((currentConfig) => ({
      ...currentConfig,
      ...newConfig,
      notfound: newConfig.notfound ? { ...currentConfig.notfound, ...newConfig.notfound } : currentConfig.notfound,
      access: newConfig.access ? { ...currentConfig.access, ...newConfig.access } : currentConfig.access,
      error: newConfig.error ? { ...currentConfig.error, ...newConfig.error } : currentConfig.error
    }));
  }
}
