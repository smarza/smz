import { Injectable } from '@angular/core';
import { GlobalStore } from './global-store';

/**
 * FeatureStore behaves like a GlobalStore but is not provided in the root
 * injector. It exists only while the feature that provided it is active.
 */
@Injectable()
export abstract class FeatureStore<T> extends GlobalStore<T> {}
