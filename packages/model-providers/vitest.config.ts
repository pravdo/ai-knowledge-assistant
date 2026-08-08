import { defineConfig } from 'vitest/config';

// This package is currently pure TypeScript interfaces (no runtime logic to test) — adapters
// implementing them land in Week 7 (Bedrock) and Week 14 (NVIDIA), with their own tests.
export default defineConfig({
  test: {
    passWithNoTests: true,
  },
});
