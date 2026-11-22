/// <reference types="vitest/config" />
import babel from '@rolldown/plugin-babel'
import { lingui } from '@lingui/vite-plugin'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/** Hosts where the API certificate comes from the local CA of Caddy, which Node does not trust. */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' = read all variables of the .env files and of the shell, not only VITE_*.
  // API_PROXY_TARGET has no VITE_ prefix, so it never reaches the browser bundle.
  const apiProxyTarget = loadEnv(mode, process.cwd(), '').API_PROXY_TARGET || 'https://localhost'

  return {
    server: {
      // In development the browser calls /api on the Vite origin, and Vite passes the request to the API.
      // So the browser needs no CORS and never sees the local certificate of the API.
      // Production has no proxy: the SPA calls the API origin (VITE_API_BASE_URL) with CORS.
      // https://vite.dev/config/server-options#server-proxy
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          // Skip the certificate check only for a local API. A remote target is always checked.
          secure: !LOCAL_HOSTS.has(new URL(apiProxyTarget).hostname),
        },
      },
    },
    plugins: [
      react(),
      // Compiles .po catalogs on import + expands Lingui macros natively (before Babel runs).
      lingui({ macroTransform: true }),
      babel({ presets: [reactCompilerPreset()] }),
    ],
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
  }
})
