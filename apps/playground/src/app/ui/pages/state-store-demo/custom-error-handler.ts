import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CustomErrorHandlerService {
  handleError(error: Error): void {
    console.log('Error detected in CustomErrorHandlerService', error);
    console.error('Error detected in CustomErrorHandlerService');
  }
}