import { DestroyRef, Injectable, OnDestroy, inject } from '@angular/core';
import { GlobalStore } from '../global-store/global-store';

/**
 * FeatureStore behaves like a GlobalStore but is not provided in the root
 * injector. It exists only while the feature that provided it is active.
 */
@Injectable()
export abstract class FeatureStore<T> extends GlobalStore<T> implements OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private _ttlPaused = false;

  constructor(scopeName?: string) {
    super(scopeName);
    this.destroyRef.onDestroy(() => this.ngOnDestroy());
  }

  ngOnDestroy(): void {
    this.logger.debug(`destroying`);
    this._clearTtlTimer?.();
  }

  pauseTtl(): void {
    this.logger.debug(`pausing TTL`);
    this._ttlPaused = true;
    this._clearTtlTimer?.();
  }

  resumeTtl(): void {
    this.logger.debug(`resuming TTL`);
    this._ttlPaused = false;
    if (this.isResolved()) {
      this._scheduleTtlReload();
    }
  }

  protected override _scheduleTtlReload(): void {
    if (this._ttlPaused) {
      this.logger.debug(`TTL paused, skipping reload scheduling`);
      return;
    }
    super._scheduleTtlReload();
  }

}
