import js from '@eslint/js'
import nx from '@nx/eslint-plugin'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'
import lingui from 'eslint-plugin-lingui'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * Which package may import which. Every package has one tag of each kind (package.json → nx.tags).
 * A package must satisfy all rules that match its tags. See docs/tech/monorepo.md.
 * https://nx.dev/docs/features/enforce-module-boundaries
 */
const depConstraints = [
  // Platform: common code runs everywhere, so it imports only common code.
  { sourceTag: 'platform:common', onlyDependOnLibsWithTags: ['platform:common'] },
  { sourceTag: 'platform:web', onlyDependOnLibsWithTags: ['platform:common', 'platform:web'] },
  {
    sourceTag: 'platform:native',
    onlyDependOnLibsWithTags: ['platform:common', 'platform:native'],
  },

  // Layer: generic code never imports org; org may import generic; an app may import both.
  { sourceTag: 'layer:generic', onlyDependOnLibsWithTags: ['layer:generic'] },
  { sourceTag: 'layer:org', onlyDependOnLibsWithTags: ['layer:generic', 'layer:org'] },
  { sourceTag: 'layer:app', onlyDependOnLibsWithTags: ['layer:generic', 'layer:org', 'layer:app'] },

  // One app never imports the packages of another app.
  {
    sourceTag: 'app:doremi',
    onlyDependOnLibsWithTags: ['layer:generic', 'layer:org', 'app:doremi'],
  },

  // Type: an app composes modules; a module never imports another module.
  {
    sourceTag: 'type:app',
    onlyDependOnLibsWithTags: ['type:module', 'type:data', 'type:ui', 'type:utils'],
  },
  { sourceTag: 'type:module', onlyDependOnLibsWithTags: ['type:data', 'type:ui', 'type:utils'] },
  { sourceTag: 'type:data', onlyDependOnLibsWithTags: ['type:data', 'type:utils'] },
  { sourceTag: 'type:ui', onlyDependOnLibsWithTags: ['type:ui', 'type:utils'] },
  { sourceTag: 'type:utils', onlyDependOnLibsWithTags: ['type:utils'] },
]

export default defineConfig([
  globalIgnores(['**/dist', '**/coverage', '**/src/locales', '.nx', 'packages/api']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      // Includes React Compiler rules (purity, refs, set-state-in-render, ...)
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      lingui.configs['flat/recommended'],
    ],
    plugins: { '@nx': nx },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      '@nx/enforce-module-boundaries': ['error', { allow: [], depConstraints }],
    },
  },
  {
    // Common code runs on every platform: no browser globals and no browser or native libraries.
    // TypeScript also checks these packages without the DOM types (see their tsconfig.json),
    // but it does not catch a library import, so the import list below is needed.
    files: ['packages/common/**/*.{ts,tsx}', 'packages/org/org-utils-auth/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'navigator', 'location', 'history', 'self'],
        ...['localStorage', 'sessionStorage', 'fetch', 'requestAnimationFrame'],
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react-dom', 'react-dom/*', 'react-router', 'react-router/*', '@mui/*'],
              message: 'Browser only. Common code must run on every platform.',
            },
            {
              group: [
                '@emotion/*',
                '@fortawesome/react-fontawesome',
                'react-native',
                'react-native/*',
              ],
              message: 'Platform library. Common code must run on every platform.',
            },
          ],
        },
      ],
    },
  },
  prettier,
])
