# Monorepo

One repository for the frontend, the API and (later) native apps. Tasks run through [Nx](https://nx.dev/docs/getting-started/intro); packages are linked with [pnpm workspaces](https://pnpm.io/workspaces).

The folder structure and the tags are our own. They differ from the Nx defaults (`apps/`, `libs/`, `shared`) on purpose; the reasons are below.

## Folders

```
packages/
  api/      Symfony API (PHP). Not a pnpm package: Nx reads its project.json
  common/   code that runs on every platform: no browser code, no native code
  web/      browser only: MUI components, router, layouts, styles
  native/   native only. Empty for now, but its rules exist
  org/      everything that knows our organization: API, brand, theme, auth, languages
  apps/     one tree per app
    doremi/
      apps-doremi                        the app: entry point, providers, composed route table
      apps-doremi-utils-routes           the route table of the app and its typed link helpers
      apps-doremi-utils-layout           header, footer, navigation, 404 and error pages
      apps-doremi-data-profile           TanStack Query options for the profile
      apps-doremi-module-homepage        public pages
      apps-doremi-module-profile         section "Profile"
      apps-doremi-module-teachers-main   section "Main" of the teacher
      apps-doremi-module-parents-main    section "Main" of the parent
scripts/    repository scripts
```

- The Nx folder `apps` is `packages` here. All projects are in `packages/`.
- The folder name is the package name: `packages/web/web-utils-router` is `@doremi/web-utils-router`. The name has the form `<folder>-<type>-<name>`.
- Only `apps-doremi` has `projectType: application`. All other packages are libraries. Both are set in `package.json` → `nx`.
- A package has no build step. Its `package.json` exports `src/index.ts`, and Vite and TypeScript read the source.

### Why `common` and not `shared`

Once there is a `web` and a `native` folder, "shared" does not say what is special about the folder: a MUI component used by three apps is shared too, but it is web only. `common` means "common to all platforms" (Kotlin Multiplatform uses the word the same way).

It is checked, not only named:

- Packages in `common` are type-checked without the browser types (`lib: ["ES2023"]`, no `DOM`). `document.title` in `common` fails `pnpm typecheck`.
- ESLint forbids `window`, `document`, `navigator` and `localStorage` there.

### Why `org`

Generic code and organization code do not sit side by side. Generic code (`common`, `web`, `native`) never imports from `org`. `org` may import generic code. An app may import both.

## Tags and import rules

Every package has one tag of each kind, in `package.json` → `nx.tags`:

| Kind     | Tags                                                            | Rule                                                                                                           |
| -------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Platform | `platform:common`, `platform:web`, `platform:native`            | `common` imports only `common`. `web` and `native` import `common` and their own platform.                     |
| Layer    | `layer:generic`, `layer:org`, `layer:app`                       | `generic` imports only `generic`. `org` imports `generic` and `org`. `app` imports all three.                  |
| App      | `app:doremi`                                                    | An app package imports generic, org and packages of the same app.                                              |
| Type     | `type:app`, `type:module`, `type:data`, `type:ui`, `type:utils` | `app` imports everything except apps. `module` imports `data`, `ui`, `utils`: never another module or the app. |

The rules are in [eslint.config.js](../../eslint.config.js), checked by the Nx rule [`@nx/enforce-module-boundaries`](https://nx.dev/docs/features/enforce-module-boundaries). A package must satisfy all rules that match its tags. Nx also reports circular dependencies.

`packages/api` has the tag `platform:api`. It has no rule: PHP code is not checked by ESLint.

## Routes and links

One typed table per app describes its routes: [apps-doremi-utils-routes/src/index.ts](../../packages/apps/doremi/apps-doremi-utils-routes/src/index.ts). The router, the navigation, the breadcrumbs, the tabs and the access checks are built from this table.

| Package                    | Content                                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `common-utils-routes`      | The table types, `indexRoutes`, `canAccess`, `fillPath`, `createPathBuilder`. No React: native can use it too. |
| `web-utils-router`         | React Router bindings: `toRouteObjects`, `bindRoutes`, `useSections`, `useBreadcrumbs`, `RouteTableProvider`.  |
| `org-utils-auth`           | The roles (`guest`, `teacher`, `parent`), the current role, and `defineRoutes` typed with these roles.         |
| `apps-doremi-utils-routes` | `appRoutes` (the table) and the helpers typed with it: `RouteLink`, `useLinkTo`, `useCanOpen`, `useTabs`.      |
| `apps-doremi-module-*`     | The screens of the module's routes (`routeScreens.ts`).                                                        |
| `apps-doremi`              | Joins the screens of all modules ([routes.tsx](../../packages/apps/doremi/apps-doremi/src/routes.tsx)).        |

```ts
// packages/apps/doremi/apps-doremi-utils-routes/src/index.ts
export const appRoutes = defineRoutes({
  teacher: {
    path: 'teacher',
    access: ['teacher'], // children inherit it
    index: 'toReview', // opening /teacher opens the first tab
    meta: { label: msg`Main`, icon: faMusic, nav: 'section' },
    children: {
      toReview: { path: 'to-review', meta: { label: msg`To review`, nav: 'tab' } },
    },
  },
})
```

Rules:

- A route id is the path of keys: `teacher.toReview`.
- `meta.nav: 'section'` puts the route in the main navigation; `'tab'` makes it a tab of its parent.
- `access` lists the roles that may open the route. No `access` at all: everyone.
- A link the user may not open is not drawn: `RouteLink` returns nothing and `useLinkTo()` returns `null`. Opening such a URL shows the 404 page.
- Links are typed: `<RouteLink to="teacher.students">` (no such route) and a missing `params` are type errors, in every package.

### New screen or module

1. Add the route to `appRoutes`.
2. Add its screen to the `routeScreens.ts` of the module (a new module: a new package, then add its screens to `appScreens` in the app).

A route without a screen is a type error in the app. A screen for an unknown route is a type error in the module.

### Trade-off

Every module imports the one table, so a link from any module to any route is type-checked in the module itself. The cost: a new route always edits a shared file. The alternative (each module owns its branch, the app composes them) keeps modules independent, but then a module cannot see the full table when it is checked alone.

## Tasks

| Command                            | What it does                                                |
| ---------------------------------- | ----------------------------------------------------------- |
| `pnpm dev`                         | Vite dev server of the app                                  |
| `pnpm dev:api`                     | Symfony API in Docker, https://localhost                    |
| `pnpm build`                       | Production build to `packages/apps/doremi/apps-doremi/dist` |
| `pnpm typecheck` / `lint` / `test` | The target in all projects (`nx run-many`)                  |
| `pnpm check`                       | Everything CI should run                                    |
| `pnpm graph`                       | The project graph in the browser                            |
| `pnpm nx run api:install`          | `composer install` in the API container                     |
| `pnpm nx run api:test`             | PHPUnit in the API container                                |

- A `package.json` script is an Nx target ([Nx project configuration](https://nx.dev/docs/reference/project-configuration)). `nx.json` → `targetDefaults` makes `build`, `typecheck`, `lint` and `test` cacheable.
- The API targets are in `packages/api/project.json` and run `docker compose`. They need a running Docker. The API `test` target is part of `pnpm test`.
- The Nx documentation lists no official PHP plugin (checked November 2026), so the API uses plain commands.

## API package

`packages/api` is the Symfony skeleton (`composer create-project symfony/skeleton:"8.1.*"`, see [Symfony setup](https://symfony.com/doc/current/setup.html)). Symfony 8.1 needs PHP 8.4 or higher ([Symfony releases](https://symfony.com/releases)).

- PHP runs in Docker, set up from the [symfony-docker](https://github.com/dunglas/symfony-docker) template ([existing project guide](https://github.com/dunglas/symfony-docker/blob/main/docs/existing-project.md)). Web server: [FrankenPHP](https://frankenphp.dev/) (Caddy with PHP built in), in worker mode. PHP's built-in server was dropped: PHP says it is "not intended for production usage" ([PHP manual](https://www.php.net/manual/en/features.commandline.webserver.php)).
- One `Dockerfile`, several stages: `frankenphp_dev` (Xdebug, file watcher) for local work, `frankenphp_prod` (the last stage, so the default build) for deploy.
- `compose.yaml` + `compose.override.yaml` = local dev (Compose merges the override automatically). `compose.prod.yaml` is for a single server with Docker Compose; Render does not use it.
- Removed from the template: the Mercure hub and browser hot reload (it needs Mercure). The app has no real-time features. To add them back, compare with the template.
- One endpoint exists: `GET /api/health` → `{"status":"ok"}`.
- Secrets: copy `.env.local.example` to `.env.local` and set `APP_SECRET`. `.env` and `.env.dev` have no secrets.
- Deploy on Render: Docker web service from `packages/api/Dockerfile` (builds `frankenphp_prod`). Render terminates HTTPS and sends HTTP to the port in `PORT`, default 10000 ([Render web services](https://render.com/docs/web-services)). So set the env vars `SERVER_NAME=:10000` (HTTP only, see [symfony-docker production](https://github.com/dunglas/symfony-docker/blob/main/docs/production.md)) and `APP_SECRET`. Checked locally with `docker run -e SERVER_NAME=:10000 …`.
- Database, R2 and CORS come in phase 2 ([roadmap.md](../roadmap.md)).

## Deploy (Netlify)

`netlify.toml` is in `packages/apps/doremi/apps-doremi`. In the Netlify UI set the **Package directory** to this folder and leave the **Base directory** empty. The build runs in the repository root; `publish` is relative to the root. Source: [Netlify monorepos](https://docs.netlify.com/build/configure-builds/monorepos/). The page does not mention Nx or pnpm.
