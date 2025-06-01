import { DestroyRef, Injectable, OnDestroy, inject } from '@angular/core';
import { GlobalStore } from './global-store';

/**
 * FeatureStore behaves like a GlobalStore but is not provided in the root
 * injector. It exists only while the feature that provided it is active.
 */
@Injectable()
export abstract class FeatureStore<T> extends GlobalStore<T> implements OnDestroy {
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    super();
    this.destroyRef.onDestroy(() => this.ngOnDestroy());
  }

  ngOnDestroy(): void {
    (this as any)._clearTtlTimer?.();
  }
}
