// Shared ESLint flat-config rules for plain TypeScript packages (packages/*, apps/chat-stream,
// infrastructure). Angular (apps/web) and NestJS (apps/api) keep their own framework-specific
// configs and import `baseRules` below to stay consistent on the core TypeScript rules.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export const baseRules = tseslint.config(
  {
    // Config/build files are plain JS/TS that isn't part of any tsconfig "include" — type-aware
    // rules need a TS program, so these must stay out of the type-checked file set.
    ignores: ['dist/**', 'cdk.out/**', 'coverage/**', '**/*.js', '*.config.mjs', '*.config.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        // Auto-discovers the nearest tsconfig.json for each linted file (typed-linting needs a
        // TS program). Rooted at the caller's cwd, i.e. the package that imports baseRules —
        // eslint always runs with cwd set to that package's directory.
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  prettier,
);

export default tseslint.config(...baseRules);
