import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiError, LOGGING_SERVICE } from '@smz-ui/core';

@Injectable({
  providedIn: 'root'
})
export class CounterApiService {
  private readonly ERROR_CHANCE = 0.2;
  private readonly MIN_DELAY = 1000;
  private readonly MAX_DELAY = 3000;

  private readonly logger = inject(LOGGING_SERVICE).scoped('CounterApiService');

  private async delay(): Promise<void> {
    const delay = Math.floor(Math.random() * (this.MAX_DELAY - this.MIN_DELAY) + this.MIN_DELAY);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private createApiError(): ApiError {
    const err: HttpErrorResponse = new HttpErrorResponse({
      status: 400,
      error: {
        message: 'Simulated API error',
        details: 'The server is currently unavailable',
        timestamp: new Date().toISOString(),
        requestId: `req_${Math.random().toString(36).substring(2, 15)}`
      } as Record<string, unknown>
    });

    return {
      code: err.status,
      message: err.error?.message || err.message,
      details: {
        originalError: err.error,
        timestamp: (err.error as Record<string, unknown>)?.['timestamp'] || new Date().toISOString(),
        requestId: (err.error as Record<string, unknown>)?.['requestId'],
        endpoint: 'counter/load',
        method: 'GET'
      }
    };
  }

  async getRandomCount(): Promise<{ count: number }> {
    this.logger.debug('------> The API is called');
    await this.delay();

    if (Math.random() < this.ERROR_CHANCE) {
      throw this.createApiError();
    }

    const MIN_COUNT = -10;
    const MAX_COUNT = 20;

    return { count: Math.floor(Math.random() * (MAX_COUNT - MIN_COUNT + 1)) + MIN_COUNT };
  }
}