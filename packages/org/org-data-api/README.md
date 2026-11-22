# org-data-api

The client of our API: the fetch wrapper, its error type, and the TanStack Query defaults.

The only place that reads `VITE_API_BASE_URL`. Data packages of an app (`apps-*-data-*`) build their queries on top of it; screens never call `fetch` directly.

Not here: queries for a specific resource. They belong to the app's data packages.
