/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import babel from '@rolldown/plugin-babel'
import { lingui } from '@lingui/vite-plugin'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Compiles .po catalogs on import + expands Lingui macros natively (before Babel runs).
    lingui({ macroTransform: true }),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      output: {
        // Stable vendor chunks: cache survives app-code deploys.
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/,
            },
            { name: 'mui', test: /node_modules[\\/](@mui|@emotion)[\\/]/ },
            { name: 'fontawesome', test: /node_modules[\\/]@fortawesome[\\/]/ },
            { name: 'vendor', test: /node_modules[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
