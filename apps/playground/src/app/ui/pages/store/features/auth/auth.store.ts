// src/app/features/auth/auth.store.ts
import { Injectable, computed, inject, effect, Signal } from '@angular/core';
import { AuthApiService } from './auth.api';
import { Credentials, AuthStateModel, User } from './auth.model';
import { BaseStore } from '../base-store';

function decodeJwtExpiry(token: string): number {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  ).join(''));
  const { exp } = JSON.parse(jsonPayload);
  return exp * 1000; // Convert to milliseconds
}

@Injectable({ providedIn: 'root' })
export class AuthStore extends BaseStore<AuthStateModel>
{
  private authApi = inject(AuthApiService);

  // Exposed signals/selectors:
  readonly currentUser: Signal<User | null> = computed(() => this.state().currentUser);
  readonly authToken: Signal<string | null> = computed(() => this.state().authToken);
  readonly loading: Signal<boolean> = computed(() => this.state().loading);
  readonly error: Signal<string | null> = computed(() => this.state().error);
  readonly isLoggedIn: Signal<boolean> = computed(() => !!this.state().authToken);

  constructor()
  {
    super({
      currentUser: null,
      authToken: null,
      loading: false,
      error: null,
    });
    this.logger.debug('AuthStore: constructor', this.state());
  }

  /**
   * Attempts to log in. Will update loading → true, then on success set user & token,
   * on failure set error message.
   */
  async login(credentials: Credentials): Promise<void>
  {
    this.setState({ loading: true, error: null });
    try
    {
      this.logger.debug('AuthStore: login attempt', credentials.username);
      const { user, token } = await this.authApi.login(credentials);
      // Update state immutably
      this.setState({ currentUser: user, authToken: token, loading: false });
      this.logger.debug('AuthStore: login successful', user.id);
      // Optionally stash token in localStorage or cookie
      localStorage.setItem('auth_token', token);
    }
    catch (err: unknown)
    {
      const message = err instanceof Error ? err.message : 'Unknown login error';
      this.logger.error('AuthStore: login error', message);
      this.setState({ loading: false, error: message });
    }
  }

  /**
   * Logs out completely (clears user & token).
   */
  logout(): void
  {
    this.logger.info('AuthStore: logout');
    localStorage.removeItem('auth_token');
    this.setState({ currentUser: null, authToken: null });
  }

  /**
   * Attempt to refresh token. Could be triggered via an effect whenever authToken is close to expiring.
   */
  async refreshToken(): Promise<void>
  {
    const token = this.authToken();
    if (!token)
    {
      this.logger.warn('AuthStore: refreshToken called but no token present');
      return;
    }
    this.setState({ loading: true, error: null });
    try
    {
      this.logger.debug('AuthStore: refreshing token');
      const { token: newToken } = await this.authApi.refreshToken(token);
      this.setState({ authToken: newToken, loading: false });
      localStorage.setItem('auth_token', newToken);
      this.logger.debug('AuthStore: token refreshed successfully');
    }
    catch (err: unknown)
    {
      const message = err instanceof Error ? err.message : 'Unknown refresh error';
      this.logger.error('AuthStore: refreshToken error', message);
      this.setState({ loading: false, error: message });
      // Optionally force logout:
      // this.logout();
    }
  }

  /**
   * Optional effect: automatically refresh token if it's about to expire.
   * (This is just illustrative; you'd need logic to decode JWT expiry or track TTL separately.)
   */
  private autoRefresh = effect(() => {
    this.logger.debug('AuthStore: autoRefresh');
    const token = this.authToken();
    if (!token) {
      this.logger.debug('AuthStore: autoRefresh: no token');
      return;
    }

    // Verifica a cada 1 minuto
    const checkInterval = 60 * 1000; // 1 minuto em milissegundos
    const lastCheck = this.lastCheckTime || 0;
    const now = Date.now();

    if (now - lastCheck < checkInterval) {
      this.logger.debug('AuthStore: autoRefresh: not enough time has passed');
      return;
    }

    this.lastCheckTime = now;
    this.logger.debug('AuthStore: autoRefresh: checking token expiration');

    const expiresAt = decodeJwtExpiry(token);
    if (expiresAt - now < 5 * 60 * 1000) {
      this.logger.debug('AuthStore: autoRefresh: token expires in < 5 minutes');
      this.refreshToken();
    }
  });

  private lastCheckTime = 0;
}
