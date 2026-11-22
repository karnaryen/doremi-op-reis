# Doremi op reis

A mobile-first web app for a travelling music teacher. The teacher assigns pieces; parents upload recordings of the child; the teacher reviews them.

An Nx monorepo: the React frontend (deployed on Netlify) and the Symfony API. Product and technical docs: [docs/README.md](docs/README.md). Structure, import rules and routes: [docs/tech/monorepo.md](docs/tech/monorepo.md).

## Stack

| Concern      | Tool                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------- |
| Monorepo     | Nx 24 (task runner, cache, module boundaries), pnpm workspaces                                     |
| UI           | React 19 + **React Compiler** (no manual `useMemo`/`useCallback`)                                  |
| Build        | Vite 8 (Rolldown), pnpm                                                                            |
| Language     | TypeScript 7 (`tsc`), TS 6 API alias for typescript-eslint                                         |
| Components   | MUI 9 (CSS variables, light/dark/system color schemes)                                             |
| Design       | MUI theme in `org-ui-theme`, fonts Merriweather + Lato (`@fontsource`)                             |
| Icons        | Font Awesome 7 Free (solid)                                                                        |
| Routing      | React Router 8 (data router, lazy routes), built from a typed route table                          |
| Server state | TanStack Query 5                                                                                   |
| Client state | Zustand 5                                                                                          |
| i18n         | Lingui 6 (`en` source, `nl`), `.po` catalogs                                                       |
| Quality      | ESLint 10 (+ React Compiler rules, Lingui), Prettier, Vitest 5 + Testing Library                   |
| Checks       | Structure check, PHP-CS-Fixer, PHPat, GitHub Actions: [docs/tech/quality.md](docs/tech/quality.md) |
| API          | PHP 8.5 (FrankenPHP), Symfony 8.1, Doctrine, PHPUnit, PHPStan; in Docker                           |
| Data         | PostgreSQL 18 (Docker locally), Cloudflare R2 for files                                            |

## Getting started

```bash
pnpm install
```

```bash
pnpm dev
```

The API needs a running Docker. First time: copy `packages/api/.env.local.example` to `packages/api/.env.local`, set `APP_SECRET`, then install the PHP packages.

```bash
pnpm nx run api:install
```

```bash
pnpm dev:api
```

Frontend: http://localhost:5173. API: https://localhost/api/health. The first time, the browser warns about the local TLS certificate: accept it ([symfony-docker TLS](https://github.com/dunglas/symfony-docker/blob/main/docs/tls.md)). Ports 80 and 443 must be free. If they are in use: `HTTP_PORT=8080 HTTPS_PORT=8443 HTTP3_PORT=8443 pnpm dev:api`, then https://localhost:8443.

`pnpm dev:api` also starts PostgreSQL. The frontend calls the API through the Vite dev server: http://localhost:5173/api/health gives the same answer, without a certificate warning. If the API runs on other ports, start the frontend with `API_PROXY_TARGET=https://localhost:8443 pnpm dev`.

File storage: put the Cloudflare R2 values into `packages/api/.env.local`, then run `pnpm nx run api:check`. Steps: [docs/tech/backend.md](docs/tech/backend.md#file-storage-cloudflare-r2).

Frontend env vars: copy `packages/apps/doremi/apps-doremi/.env.example` → `.env.local` in the same folder (only `VITE_*` reach the client).

## Scripts

| Script                    | What it does                                                          |
| ------------------------- | --------------------------------------------------------------------- |
| `pnpm dev`                | Frontend dev server                                                   |
| `pnpm dev:api`            | Symfony API in Docker                                                 |
| `pnpm build`              | Production build to `packages/apps/doremi/apps-doremi/dist`           |
| `pnpm preview`            | Serve the production build                                            |
| `pnpm typecheck`          | TypeScript in all packages                                            |
| `pnpm lint`               | ESLint in all packages, with the import rules                         |
| `pnpm format`             | Prettier write                                                        |
| `pnpm test`               | Vitest in all frontend packages                                       |
| `pnpm test:api`           | PHPUnit in the API (needs Docker)                                     |
| `pnpm nx run api:phpstan` | PHPStan in the API (needs Docker)                                     |
| `pnpm nx run api:check`   | Checks PostgreSQL and R2 from the API (needs Docker)                  |
| `pnpm i18n:extract`       | Extract messages into the app's `src/locales/*/messages.po`           |
| `pnpm graph`              | Nx project graph                                                      |
| `pnpm check`              | Frontend: typecheck, lint, tests, structure, format, message catalogs |
| `pnpm check:api`          | API: format, `validate`, PHPStan, tests (needs Docker)                |
| `pnpm check:all`          | `check` and `check:api`                                               |
| `pnpm structure:check`    | Folders, names, tags and dependency lists of the packages             |

## Architecture

```
packages/
├── api/       # Symfony API
├── common/    # Runs on every platform (no browser, no native code)
├── web/       # Browser only: router bindings, generic MUI components
├── native/    # Native only (empty for now)
├── org/       # Knows the organization: theme, API client, auth, languages
└── apps/doremi/
    ├── apps-doremi             # Composition root: providers, the screens of all routes, locales
    ├── apps-doremi-utils-*     # Route table
    ├── apps-doremi-ui-*        # Layout
    ├── apps-doremi-data-*      # TanStack Query
    └── apps-doremi-module-*    # Screens of one section
```

**Main rules** (details in [docs/tech/monorepo.md](docs/tech/monorepo.md))

- Generic code (`common`, `web`, `native`) never imports `org`. A module never imports another module. ESLint checks this.
- New screen → add the route to `appRoutes` in `apps-doremi-utils-routes`, and its screen to the `routeScreens.ts` of its module. New module → new package, then add its screens in `apps-doremi/src/routes.tsx`.
- Link with `RouteLink` or `useLinkTo()` and a route id, never with a URL string.
- Server data goes through TanStack Query (`queryOptions` + `http()`); Zustand only for client/UI state.
- All user-visible text uses Lingui macros (`<Trans>`, `` t`...` ``, `` msg`...` ``); run `pnpm i18n:extract` and fill in `nl`.
- Import FA icons individually (`import { faX } from '@fortawesome/free-solid-svg-icons'`) to keep tree-shaking.
- A package lists the libraries it imports in its own `package.json`, with the version `catalog:`. Add one with `pnpm add --filter <package> <library>`; the versions are in `pnpm-workspace.yaml`.

## Design system

The theme is based on the Doremi brand style: plum, peach, Merriweather headings and Lato body text.
The home page shows all tokens and components in light and dark mode.

| File                               | Content                                                              |
| ---------------------------------- | -------------------------------------------------------------------- |
| `org-ui-theme/src/tokens.ts`       | Primitive tokens: color scales, fonts, radius, durations             |
| `org-ui-theme/src/palette.ts`      | Light and dark palettes (semantic colors), with the contrast rules   |
| `org-ui-theme/src/typography.ts`   | Font sizes and weights, including the custom `lead` variant          |
| `org-ui-theme/src/shadows.ts`      | 24 elevation shadows; color and strength change with the mode        |
| `org-ui-theme/src/components.ts`   | Default props and style overrides for MUI components                 |
| `org-ui-theme/src/augmentation.ts` | TypeScript types for `brand`, `softText`, `lead` and the `soft` Chip |
| `org-ui-theme/src/theme.ts`        | `createTheme` with CSS variables and light/dark color schemes        |

**Rules**

- Put new colors in `tokens.ts` and map them in `palette.ts`. Components use palette keys (`primary.main`, `brand.surface`), not hex values.
- Custom palette keys: `brand.surface`, `brand.onSurface`, `brand.blush`, `brand.border`, and `softText` on every color (text on a light tint, outlined and text buttons).
- Use `radius` from `tokens.ts` for corners. In `sx`, write px strings (`` `${radius.md}px` ``): a number is multiplied by `shape.borderRadius`.
- `theme.test.ts` checks WCAG contrast for both palettes. Run it after every color change.
- `index.html` copies three colors (theme color and first-paint background). Update them if the tokens change.

## Deploy (Netlify)

`packages/apps/doremi/apps-doremi/netlify.toml` sets build command, publish dir, Node 24, SPA fallback redirect and asset caching headers.
In the Netlify UI set **Package directory** to `packages/apps/doremi/apps-doremi` and leave **Base directory** empty.
