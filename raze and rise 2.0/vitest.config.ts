import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    // Phase 3 adds co-located pure-helper suites under src/**/__tests__ alongside
    // the existing top-level tests/ tree. Both roots must be collected or the
    // src/lib/__tests__ suites silently never run.
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/__tests__/**/*.test.{ts,tsx}'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
