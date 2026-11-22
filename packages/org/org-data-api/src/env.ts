// Gives `import.meta.env` its type in every package that imports this file,
// so a package that uses the API client needs no Vite types of its own.
/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    /** The origin of the API. Empty in development: the Vite dev server proxies /api. */
    readonly VITE_API_BASE_URL?: string
  }
}

/** Typed access to build-time env vars. Never read import.meta.env elsewhere. */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  isDev: import.meta.env.DEV,
} as const
