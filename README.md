# Doremi op reis

React single-page app, deployed on Netlify.

## Stack

| Concern      | Tool                                                                             |
| ------------ | -------------------------------------------------------------------------------- |
| UI           | React 19 + **React Compiler** (no manual `useMemo`/`useCallback`)                |
| Build        | Vite 8 (Rolldown), pnpm                                                          |
| Language     | TypeScript 7 (`tsc`), TS 6 API alias for typescript-eslint                       |
| Components   | MUI 9 (CSS variables, light/dark/system color schemes)                           |
| Icons        | Font Awesome 7 Free (solid / regular / brands)                                   |
| Routing      | React Router 8 (data router, lazy routes)                                        |
| Server state | TanStack Query 5                                                                 |
| Client state | Zustand 5                                                                        |
| i18n         | Lingui 6 (`en` source, `nl`), `.po` catalogs                                     |
| Quality      | ESLint 10 (+ React Compiler rules, Lingui), Prettier, Vitest 5 + Testing Library |

## Getting started

```bash
pnpm install
pnpm dev
```

Copy `.env.example` → `.env.local` for local env vars (only `VITE_*` reach the client).

## Scripts

| Script              | What it does                                      |
| ------------------- | ------------------------------------------------- |
| `pnpm dev`          | Dev server                                        |
| `pnpm build`        | Typecheck + production build to `dist/`           |
| `pnpm preview`      | Serve the production build                        |
| `pnpm lint`         | ESLint                                            |
| `pnpm format`       | Prettier write                                    |
| `pnpm test`         | Vitest watch mode (`test:run` for single run)     |
| `pnpm i18n:extract` | Extract messages into `src/locales/*/messages.po` |
| `pnpm check`        | Everything CI should run                          |

## Architecture

Layered, dependencies point **downward only**: `app → pages → features → shared`.

```
src/
├── app/                  # Composition root: wires everything together
│   ├── App.tsx           #   creates the router
│   ├── routes.tsx        #   route tree (lazy pages)
│   ├── layout/           #   app shell (AppBar, footer, <Outlet/>)
│   └── providers/        #   Query, Lingui, MUI theme providers
├── pages/                # One folder per route; compose features, no business logic
│   ├── home/  about/  not-found/  error/
├── features/             # User-facing capabilities, self-contained
│   ├── locale-switcher/  #   UI + model/ (Zustand store, persisted)
│   └── theme-mode/       #   light / dark / system toggle
├── shared/               # Reusable, app-agnostic building blocks
│   ├── api/              #   http() fetch wrapper, QueryClient factory
│   ├── config/           #   env, route paths
│   ├── i18n/             #   locales + catalog loading
│   └── theme/            #   MUI theme
├── locales/{en,nl}/      # Lingui .po catalogs (generated, then translated)
└── test/                 # Vitest setup + render helpers
```

**Rules of thumb**

- A feature never imports another feature; lift shared bits into `shared/`.
- Pages are thin: layout + composition of features.
- New route → add page folder, register it in `app/routes.tsx`, add the URL to `shared/config/paths.ts`.
- New feature → `features/<name>/` with `ui` components at the root and `model/` (stores, hooks), `api/` (queries) as needed.
- Server data goes through TanStack Query (`useQuery` + `http()`); Zustand only for client/UI state.
- All user-visible text uses Lingui macros (`<Trans>`, `` t`...` ``); run `pnpm i18n:extract` and fill in `nl`.
- Import FA icons individually (`import { faX } from '@fortawesome/free-solid-svg-icons'`) to keep tree-shaking.

## Deploy (Netlify)

`netlify.toml` sets build command, `dist` publish dir, Node 24, SPA fallback redirect and asset caching headers.
Connect the GitHub repo in Netlify — no extra settings needed.
