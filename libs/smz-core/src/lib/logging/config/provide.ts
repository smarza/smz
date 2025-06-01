import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { SmzLogging, SmzLoggingConfigType } from './config';

export const SMZ_LOGGING_CONFIG = new InjectionToken<SmzLoggingConfigType>('SMZ_LOGGING_CONFIG');

export function provideSmzLogging(initializers: (() => SmzLoggingConfigType[])): EnvironmentProviders {
  const features = initializers();

  const providers = features?.map((feature) => ({
      provide: SMZ_LOGGING_CONFIG,
      useValue: feature,
      multi: false
  }));

  const initializer = provideAppInitializer(() => {
      const SmzLoggingConfig = inject(SmzLogging);
      features?.forEach((feature) => SmzLoggingConfig.setConfig(feature));
      return;
  });

  return makeEnvironmentProviders([...providers, initializer]);
}
