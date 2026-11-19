/** Typed access to build-time env vars. Never read import.meta.env elsewhere. */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  isDev: import.meta.env.DEV,
} as const
