import { InjectionToken } from '@angular/core';

export function getTokenName(token: InjectionToken<unknown>): string {
  return token.toString().replace('InjectionToken ', '').replace('_TOKEN', '');
}
