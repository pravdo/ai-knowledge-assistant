import { build } from 'esbuild';

// Bundles the handler for Lambda deployment. Kept separate from the CDK stack so `pnpm build` can
// produce a deployable artifact without requiring AWS credentials.
await build({
  entryPoints: ['src/handler.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: 'dist/handler.mjs',
  sourcemap: true,
  external: ['@aws-sdk/*'],
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
});
