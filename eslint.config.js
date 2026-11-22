import { globSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import js from '@eslint/js'
import nx from '@nx/eslint-plugin'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'
import lingui from 'eslint-plugin-lingui'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import jsoncParser from 'jsonc-eslint-parser'
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

  // One app never imports the packages of another app: one rule for every folder in packages/apps.
  ...readdirSync(join(import.meta.dirname, 'packages/apps'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      sourceTag: `app:${entry.name}`,
      onlyDependOnLibsWithTags: ['layer:generic', 'layer:org', `app:${entry.name}`],
    })),

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

/**
 * The source files of every package with the tag `platform:common`, wherever the package is
 * (`packages/common`, but also `org-utils-auth`). Read from the tags, so a new common package
 * gets the rules below without a change in this file.
 */
const commonPlatformFiles = globSync(
  ['packages/*/*/package.json', 'packages/apps/*/*/package.json'],
  {
    cwd: import.meta.dirname,
  },
)
  .filter((manifest) => {
    const { nx } = JSON.parse(readFileSync(join(import.meta.dirname, manifest), 'utf8'))
    return nx?.tags?.includes('platform:common')
  })
  .map((manifest) => `${dirname(manifest)}/**/*.{ts,tsx}`)

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
  // An empty `files` list is an error in ESLint, so the block exists only if a common package exists.
  ...(commonPlatformFiles.length === 0
    ? []
    : [
        {
          // Common code runs on every platform: no browser globals and no browser or native libraries.
          // TypeScript also checks these packages without the DOM types (see their tsconfig.json),
          // but it does not catch a library import, so the import list below is needed.
          files: commonPlatformFiles,
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
      ]),
  {
    // Repository scripts run in Node, not in the browser.
    files: ['scripts/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    // Every package lists the libraries it imports in its own package.json, and nothing else.
    // The rule reads the imports of the files of one target, so it needs a target that every package has.
    files: ['**/package.json'],
    languageOptions: { parser: jsoncParser },
    plugins: { '@nx': nx },
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          buildTargets: ['typecheck'],
          // Tests and tool configs use devDependencies. The rule does not check that section.
          ignoredFiles: [
            '{projectRoot}/**/*.test.{ts,tsx}',
            '{projectRoot}/src/test/**',
            '{projectRoot}/*.config.ts',
          ],
          // Used without an import statement, so the rule cannot see them:
          // JSX compiles to `react/jsx-runtime`, and MUI loads Emotion as a peer dependency.
          ignoredDependencies: ['react', '@emotion/react', '@emotion/styled'],
        },
      ],
    },
  },
  prettier,
])
