// src/app/features/users/user.api.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from './user.model';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  constructor(private http: HttpClient) {}

  getUserById(id: number) {
    return firstValueFrom(this.http.get<User>(`https://jsonplaceholder.typicode.com/users/${id}`));
  }

  getAllUsers() {
    return firstValueFrom(this.http.get<User[]>(`https://jsonplaceholder.typicode.com/users`));
  }
}
