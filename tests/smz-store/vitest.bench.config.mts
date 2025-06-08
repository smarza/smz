import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config.mts';

export default mergeConfig(
  baseConfig,
  defineConfig({
    benchmark: {
      include: ['src/**/*.bench.ts'],
      outputFile: 'benchmarks/results.json',
    },
  })
);

