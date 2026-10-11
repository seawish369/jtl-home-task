import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const base = defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
]);

// Import boundaries. Every package forbids deep imports and imports from the app;
// each package adds the restrictions below that apply to it.
// allowTypeImports stays false (the default): `import type` is a dependency too.
const alwaysForbidden = [
  {
    regex: '^@todo-app/[^/]+/src(/|$)',
    message: 'Import from the package entry point (e.g. @todo-app/core), not its src/ files.',
  },
  {
    group: ['@todo-app/web', '@todo-app/web/*'],
    message: 'Packages must not import the app. apps/web depends on packages, never the other way round.',
  },
];

const restrictions = {
  users: {
    group: ['@todo-app/users', '@todo-app/users/*'],
    message:
      '@todo-app/users is a feature package. Other features and shared packages must not import it; compose features in apps/web.',
  },
  todos: {
    group: ['@todo-app/todos', '@todo-app/todos/*'],
    message:
      '@todo-app/todos is a feature package. Other features and shared packages must not import it; compose features in apps/web.',
  },
  router: {
    group: ['@tanstack/react-router', '@tanstack/react-router/*'],
    message: 'Only apps/web uses the router. Take navigation as a callback prop (e.g. onCreated).',
  },
  jotai: {
    group: ['jotai', 'jotai/*'],
    message: 'Only apps/web uses Jotai. Take UI state as props.',
  },
};

/**
 * Shared config for every package.
 * @param {{ forbid?: Array<keyof typeof restrictions> }} [options]
 */
export function createConfig({ forbid = [] } = {}) {
  return defineConfig([
    base,
    {
      files: ['**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          { patterns: [...alwaysForbidden, ...forbid.map((name) => restrictions[name])] },
        ],
      },
    },
  ]);
}
