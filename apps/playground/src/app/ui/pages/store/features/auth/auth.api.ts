// src/app/features/auth/auth.api.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Credentials, User } from './auth.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private mockUser: User = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User'
  };

  // JWT válido que expira em 1 hora
  private mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IlRlc3QgVXNlciIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImV4cCI6MTczNTY4OTYwMH0.8tGcHYlwQZFU5vYtGcHYlwQZFU5vYtGcHYlwQZFU5vY';

  constructor(private http: HttpClient) {}

  async login(credentials: Credentials): Promise<{ user: User; token: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock validation
    if (credentials.username === 'test@example.com' && credentials.password === 'password') {
      return {
        user: this.mockUser,
        token: this.mockToken
      };
    }

    throw new Error('Invalid credentials');
  }

  async refreshToken(token: string): Promise<{ token: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock token refresh
    if (token === this.mockToken) {
      return {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IlRlc3QgVXNlciIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImV4cCI6MTczNTY5MDIwMH0.8tGcHYlwQZFU5vYtGcHYlwQZFU5vYtGcHYlwQZFU5vY'
      };
    }

    throw new Error('Invalid token');
  }
}
