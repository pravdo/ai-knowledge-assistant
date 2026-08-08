import { defineConfig } from 'vitest/config';

// This package is currently pure TypeScript interfaces (no runtime logic to test) — the S3
// Vectors adapter lands in Week 6, with its own tests.
export default defineConfig({
  test: {
    passWithNoTests: true,
  },
});
