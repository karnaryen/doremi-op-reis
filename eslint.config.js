import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'
import lingui from 'eslint-plugin-lingui'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'src/locales']),
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
    languageOptions: {
      globals: globals.browser,
    },
  },
  prettier,
])
