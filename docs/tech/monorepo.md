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
      apps-doremi                        the app: entry point, providers, the screens of all routes
      apps-doremi-utils-routes           the route table of the app and its typed link helpers
      apps-doremi-ui-layout              header, footer, navigation, 404 and error pages
      apps-doremi-data-profile           TanStack Query options for the profile
      apps-doremi-module-homepage        public pages
      apps-doremi-module-profile         section "Profile"
      apps-doremi-module-teachers-main   section "Main" of the teacher
      apps-doremi-module-parents-main    section "Main" of the parent
scripts/    repository scripts (Node). An Nx project, not a pnpm package
```

- Nx examples put projects in `apps/` and `libs/`. Here all projects are in `packages/`.
- The folder name is the package name: `packages/web/web-utils-router` is `@doremi/web-utils-router`. The name has the form `<folder>-<type>-<name>`; for app packages `apps-<app>-<type>-<name>`. Exceptions: the app itself (`apps-doremi`) and `packages/api` (Nx name `api`, not a pnpm package).
- Of the pnpm packages, only `apps-doremi` has `projectType: application`; all others are libraries. Both are set in `package.json` → `nx`. `packages/api` is an application too, set in its `project.json`.
- A package has no build step. Its `package.json` exports `src/index.ts`, and Vite and TypeScript read the source.
- `exports` has this one entry. Another package cannot import a file from inside the package: `@doremi/web-utils-router/src/hooks` is a type error.

### Why `common` and not `shared`

Once there is a `web` and a `native` folder, "shared" does not say what is special about the folder: a MUI component used by three apps is shared too, but it is web only. `common` means "common to all platforms" (Kotlin Multiplatform uses the word the same way: [`commonMain`](https://kotlinlang.org/docs/multiplatform/multiplatform-discover-project.html) is the code shared among all targets).

It is checked, not only named:

- Packages in `common` are type-checked without the browser types (`lib: ["ES2023"]`, no `DOM`). `document.title` in `common` fails `pnpm typecheck`.
- ESLint forbids browser globals there (`window`, `document`, `fetch`, `localStorage` and others) and imports of browser or native libraries (`react-dom`, `react-router`, `@mui/*`, `react-native`). TypeScript does not catch a library import, so this list is needed. Add a new platform library to the list in [eslint.config.js](../../eslint.config.js).
- `org-utils-auth` is in `org` but has the tag `platform:common`: roles are the same on every platform. It gets the same two checks: ESLint finds the common packages by their tag, not by their folder, and the [structure check](#structure-check) refuses `DOM` in their `tsconfig.json`.

### Why `org`

Generic code and organization code do not sit side by side. Generic code (`common`, `web`, `native`) never imports from `org`. `org` may import generic code. An app may import both.

## Tags and import rules

Every package has one platform, one layer and one type tag, in `package.json` → `nx.tags`. App packages also have the tag of their app.

| Kind     | Tags                                                            | Rule                                                                                                           |
| -------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Platform | `platform:common`, `platform:web`, `platform:native`            | `common` imports only `common`. `web` and `native` import `common` and their own platform.                     |
| Layer    | `layer:generic`, `layer:org`, `layer:app`                       | `generic` imports only `generic`. `org` imports `generic` and `org`. `app` imports all three.                  |
| App      | `app:doremi`                                                    | An app package imports generic, org and packages of the same app.                                              |
| Type     | `type:app`, `type:module`, `type:data`, `type:ui`, `type:utils` | `app` imports everything except apps. `module` imports `data`, `ui`, `utils`: never another module or the app. |

Other type rules: `data` imports `data` and `utils`; `ui` imports `ui` and `utils`; `utils` imports only `utils`.

Every folder in `packages/apps` gets a rule for its `app:<name>` tag: `eslint.config.js` reads the folder names. Without this rule, the layer rule alone would let one app import the packages of another app.

The rules are in [eslint.config.js](../../eslint.config.js), checked by the Nx rule [`@nx/enforce-module-boundaries`](https://nx.dev/docs/features/enforce-module-boundaries). A package must satisfy all rules that match its tags. Nx also reports circular dependencies.

`packages/api` has the tag `platform:api`. It has no rule: PHP code is not checked by ESLint. The API has its own rules for namespaces, checked by PHPStan ([quality.md](quality.md#architecture-rules-phpat)).

## Dependencies

Every package lists the libraries it imports in its own `package.json`. The root `package.json` has only the tools of the whole repository: Nx, ESLint, Prettier, TypeScript, and Vitest for `scripts/`.

```jsonc
// packages/org/org-utils-auth/package.json
"dependencies": { "react": "catalog:", "zustand": "catalog:" }

// packages/apps/doremi/apps-doremi-data-profile/package.json
"dependencies": { "@doremi/org-data-api": "workspace:*", "@tanstack/react-query": "catalog:" },
"devDependencies": { "vite": "catalog:", "vitest": "catalog:" }
```

- `workspace:*` is a package of this repository ([pnpm workspaces](https://pnpm.io/workspaces)).
- `catalog:` means "the version from the catalog". The catalog is the `catalog:` list in [pnpm-workspace.yaml](../../pnpm-workspace.yaml): one version of every library for all packages ([pnpm catalogs](https://pnpm.io/catalogs)). To update a library, change one line there and run `pnpm install`.
- `dependencies`: libraries that the source code imports. `devDependencies`: libraries for tests, tool configs and types (`vitest`, `vite`, `@types/react`).

Why per package and not all in the root:

- pnpm links into a package only the libraries it lists. An import of a library that the package does not list fails `pnpm typecheck`. One exception: Node also looks in the parent folders, so a package can reach the tools of the root `package.json`. This is why the root has tools only, and no library that application code imports.
- The `package.json` shows what a package needs. `org-utils-auth` needs `zustand` and `react`, and nothing from MUI or the router.
- The cost: 15 lists instead of one. The catalog removes the worst part of this cost, different versions in different packages.

### Add a library

```bash
pnpm add --filter @doremi/org-utils-auth clsx
```

- `catalogMode: strict` in `pnpm-workspace.yaml`: `pnpm add` writes `"clsx": "catalog:"` into the `package.json` and the version into the catalog. For a library that is already in the catalog, it takes the catalog version.
- A version outside the catalog is refused. pnpm 10.30.1 does it with an unclear message (`pnpm add --filter ... zustand@4.5.0` stops with `Invalid Version: ^5.1.0`), and changes no file.
- `cleanupUnusedCatalogs: true`: `pnpm install` removes a catalog entry that no `package.json` uses. The current pnpm docs call this setting `catalogPrune` and list the old name as deprecated ([pnpm catalogs](https://pnpm.io/catalogs)); pnpm 10.30.1 knows only `cleanupUnusedCatalogs`. Rename it with the update to a newer pnpm.
- pnpm rewrites `pnpm-workspace.yaml` when it changes the catalog and drops comments. Do not put comments there: this section is the place for them.
- Both settings act on pnpm commands. An edit by hand can still write `"react": "^19.0.0"`; the structure check finds it.

### What checks the lists

| Check                               | Finds                                                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`                    | An import of a library that neither the package nor the root lists (pnpm does not link it into the package) |
| ESLint rule `@nx/dependency-checks` | A library in `dependencies` that no source file imports; an imported library that is missing                |
| Structure check                     | A version that is not `catalog:` or `workspace:*`; `dependencies` in the root; two copies of one library    |

Notes on `@nx/dependency-checks` ([eslint.config.js](../../eslint.config.js)):

- It reads the imports from the Nx project graph. By default Nx builds this graph from the `package.json` files only, unless the root has an Nx plugin such as `@nx/js`. `pluginsConfig["@nx/js"].analyzeSourceFiles: true` in `nx.json` makes Nx read the source files. With it, the graph (`pnpm graph`) and the task cache also follow the real imports.
- The rule works only for a project that has one of its `buildTargets`. Our libraries have no build, so the rule uses `typecheck`.
- It checks `dependencies`, `peerDependencies` and `optionalDependencies`, not `devDependencies`. Test files and tool configs are left out with `ignoredFiles`.
- So nothing checks that a `devDependencies` list is complete. A package that forgets `vitest` still works, because the root has `vitest` for `scripts/`. Unused entries in `devDependencies` are not found either.
- List a library also when the code needs it without an import statement. Two cases today: `react` in a package with JSX, and `react` in a package that calls `create` of `zustand` (it is a React hook, and `react` is only an optional peer dependency of `zustand`, so pnpm does not add it).
- `react`, `@emotion/react` and `@emotion/styled` are in `ignoredDependencies`: JSX compiles to an import of `react/jsx-runtime`, and MUI loads Emotion as a peer dependency. No import statement names them, so the rule would call them unused.
- No page of the Nx docs for this rule or for `analyzeSourceFiles` was found (checked November 2026). The facts above are from the installed code: `@nx/eslint-plugin/dist/src/rules/dependency-checks.js` and `nx/dist/src/plugins/js/utils/config.js`, version 24.0.6.

### One copy of every library

pnpm resolves each package on its own. If two packages got two copies of `react`, `@mui/material` or `react-router`, the app would have two React contexts: the theme or the router of one copy is invisible to the other, and the page breaks at runtime. TypeScript and the unit tests of one package do not see it.

- The catalog gives every package the same version.
- A library with peer dependencies can still exist in two copies with the same version, when two packages give it different peers. pnpm merges such copies by default (`dedupePeerDependents`, [pnpm settings](https://pnpm.io/settings/peer-dependencies)).
- The structure check reads `pnpm-lock.yaml` and fails if two packages resolve one library in two ways. It compares the libraries that packages list in `dependencies`, not the dependencies of those libraries, and not `devDependencies`: two copies of a test tool do no harm. `pnpm why -r react` shows every copy and who uses it.

## Structure check

`pnpm structure:check` runs [scripts/check-structure.ts](../../scripts/check-structure.ts). It checks the rules of this page that ESLint and TypeScript cannot see. `pnpm check` and CI run it.

| Rule                                                                                                                           | Why                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| A package is in `packages/<common\|web\|native\|org>/` or in `packages/apps/<app>/`                                            | Other folders are not in the pnpm workspace                                                  |
| The app folder name is lower-case words with hyphens                                                                           | It becomes a part of the package names and of the `app:` tag                                 |
| Folder name: `<folder>-<data\|ui\|utils>-<name>`; in an app also `module`, and the app itself `apps-<app>`                     | The name says the platform or layer and the type                                             |
| Package name: `@doremi/<folder name>`                                                                                          | One name to search for                                                                       |
| Tags: one platform, one layer, one type; `app:<app>` only in `packages/apps/<app>`; no other tags                              | The import rules of ESLint work on tags. A wrong tag switches a rule off                     |
| The layer and type tags match the folder; in `common`, `web`, `native` the platform tag too                                    | A `type:utils` tag on a `-ui-` package would allow the wrong imports                         |
| `projectType`: `application` for the app, `library` for the others                                                             |                                                                                              |
| A library exports only `src/index.ts`, and the file exists                                                                     | One public entry                                                                             |
| `private: true`                                                                                                                | The package cannot be published to npm by mistake                                            |
| Scripts `typecheck` (`tsc -p tsconfig.json`) and `lint` (`eslint .`); `test` if the package has `*.test.*` or `*.spec.*` files | `nx run-many` skips a package without the script. `eslint src` would not lint `package.json` |
| A `platform:common` package sets `lib` in its own `tsconfig.json`, without `DOM`. The file is plain JSON, without comments     | See [above](#why-common-and-not-shared)                                                      |
| `README.md` exists                                                                                                             |                                                                                              |
| Versions are `catalog:` or `workspace:*`; the root has no `dependencies`                                                       | See [Dependencies](#dependencies)                                                            |
| Every direct dependency is resolved in one way in `pnpm-lock.yaml`                                                             | See [One copy of every library](#one-copy-of-every-library)                                  |

- The rules are functions in [scripts/structure.ts](../../scripts/structure.ts) without file system code, with tests in `structure.test.ts`.
- The file reading is in [scripts/workspace.ts](../../scripts/workspace.ts), with tests on a temporary folder.
- `scripts/` is an Nx project (`project.json`) with the targets `typecheck`, `lint` and `test`, so `pnpm check` covers the scripts too. Its tag is `platform:node`. No import rule has this tag as a source, and no package may import from `scripts/`.
- Node runs the `.ts` files directly; this is stable since Node 24.12 ([Node: TypeScript](https://nodejs.org/api/typescript.html)). Node only removes the types, so the scripts use no `enum` and write the `.ts` extension in imports.

## Routes and links

One typed table per app describes its routes: [apps-doremi-utils-routes/src/index.ts](../../packages/apps/doremi/apps-doremi-utils-routes/src/index.ts). The router, the navigation, the breadcrumbs, the tabs and the access checks are built from this table.

| Package                    | Content                                                                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `common-utils-routes`      | The table types, `indexRoutes`, `canAccess`, `fillPath`, `createPathBuilder`. No React: native can use it too.                            |
| `web-utils-router`         | React Router bindings: `toRouteObjects`, `bindRoutes`, `defineRoutesFor`, `useSections`, `useBreadcrumbs`, `RouteTableProvider`.          |
| `org-utils-auth`           | The roles (`guest`, `teacher`, `parent`) and the current role. No router code.                                                            |
| `apps-doremi-utils-routes` | `appRoutes` (the table), `AppRouteId`, and the helpers typed with it: `RouteLink`, `useLinkTo`, `useCanOpen`, `useTabs`, `defineScreens`. |
| `apps-doremi-module-*`     | The screens of the module's routes (`routeScreens.ts`).                                                                                   |
| `apps-doremi`              | Joins the screens of all modules ([routes.tsx](../../packages/apps/doremi/apps-doremi/src/routes.tsx)).                                   |

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
- `meta.navFor` lists the roles that see the route in the navigation. Example: everyone may open `home`, but only a guest has it as a section.
- `access` lists the roles that may open the route. No `access` at all: everyone. A child inherits the access of its parent and can only narrow it.
- `access` is not security. It hides links and screens in the browser, and the user can change the role there. The API must check access for every request (Symfony Security and Voters, roadmap phase 4).
- A link the user may not open is not drawn: `RouteLink` returns nothing and `useLinkTo()` returns `null`. Opening such a URL shows the 404 page.
- Links are typed: `<RouteLink to="teacher.students">` (no such route) and a missing `params` are type errors, in every package.

### New screen or module

1. Add the route to `appRoutes`.
2. Add its screen to the `routeScreens.ts` of the module (a new module: a new package, then add its screens to `appScreens` in the app).

A route without a screen is a type error in the app. A screen for an unknown route is a type error in the module.

### Trade-off

Every module imports the one table, so a link from any module to any route is type-checked in the module itself. The cost: a new route always edits a shared file. The alternative (each module has its own part of the table, and the app joins the parts) keeps modules independent, but then a module cannot see the full table when it is checked alone.

## Tasks

| Command                            | What it does                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| `pnpm dev`                         | Vite dev server of the app                                                     |
| `pnpm dev:api`                     | Symfony API and PostgreSQL in Docker, https://localhost                        |
| `pnpm build`                       | Production build to `packages/apps/doremi/apps-doremi/dist`                    |
| `pnpm typecheck` / `lint` / `test` | The target in all frontend packages (`nx run-many`)                            |
| `pnpm test:api`                    | PHPUnit in the API container (needs Docker)                                    |
| `pnpm nx run api:phpstan`          | PHPStan in the API container                                                   |
| `pnpm nx run api:check`            | `app:check`: does the API reach PostgreSQL and R2                              |
| `pnpm check`                       | Frontend and scripts: typecheck, lint, tests, structure, format, `i18n:check`  |
| `pnpm check:api`                   | API: format, `validate`, PHPStan, tests (needs Docker)                         |
| `pnpm check:all`                   | `check` and `check:api`                                                        |
| `pnpm structure:check`             | The [structure check](#structure-check)                                        |
| `pnpm i18n:check`                  | Extracts the messages and fails if a catalog file changed: commit the catalogs |
| `pnpm graph`                       | The project graph in the browser                                               |
| `pnpm nx run api:install`          | `composer install` in the API container                                        |
| `pnpm nx run api:docker-build`     | Rebuild the API image (after a change in `Dockerfile` or `frankenphp/`)        |

- A `package.json` script is an Nx target ([Nx project configuration](https://nx.dev/docs/reference/project-configuration)). `nx.json` → `targetDefaults` makes `build`, `typecheck`, `lint` and `test` cacheable.
- The API targets are in `packages/api/project.json` and run `docker compose`. They need a running Docker, so `pnpm test` and `pnpm check` do not run them: use `pnpm check:api` or `pnpm check:all`.
- CI runs `pnpm check` and `pnpm check:api` for every pull request. All checks: [quality.md](quality.md).
- `i18n:check` does not find an empty Dutch translation: check `nl/messages.po` after `pnpm i18n:extract`.
- The Nx documentation lists no official PHP plugin (checked November 2026), so the API uses plain commands.

## API package

`packages/api` is the Symfony skeleton (`composer create-project symfony/skeleton:"8.1.*"`, see [Symfony setup](https://symfony.com/doc/current/setup.html)). Symfony 8.1 needs PHP 8.4 or higher ([Symfony releases](https://symfony.com/releases)); the Docker image has PHP 8.5.

- PHP runs in Docker, set up from the [symfony-docker](https://github.com/dunglas/symfony-docker) template ([existing project guide](https://github.com/dunglas/symfony-docker/blob/main/docs/existing-project.md)). Web server: [FrankenPHP](https://frankenphp.dev/) (Caddy with PHP built in), in worker mode. PHP's built-in server was dropped: PHP says it is "not intended for production usage" ([PHP manual](https://www.php.net/manual/en/features.commandline.webserver.php)).
- One `Dockerfile`, several stages: `frankenphp_dev` (Xdebug, file watcher) for local work, `frankenphp_prod` (the last stage, so the default build) for deploy.
- `compose.yaml` + `compose.override.yaml` = local dev (Compose merges the override automatically). `compose.prod.yaml` is for a single server with Docker Compose; Render does not use it.
- Removed from the template: the Mercure hub and browser hot reload (it needs Mercure). The app has no real-time features. To add them back, compare with the template.
- One endpoint exists: `GET /api/health` → `{"status":"ok"}`. It checks the PHP process only; `bin/console app:check` checks the database and the storage.
- Secrets: copy `.env.local.example` to `.env.local` and set `APP_SECRET`; the Cloudflare R2 keys go there too ([backend.md](backend.md#file-storage-cloudflare-r2)). `.env` and `.env.dev` have no secrets.
- Deploy on Render (Docker web service). Settings: **Root Directory** `packages/api`, **Dockerfile Path** `Dockerfile` (both paths are relative to the root directory, see [Render monorepo support](https://render.com/docs/monorepo-support)), **Health Check Path** `/api/health` ([Render health checks](https://render.com/docs/health-checks)). Env vars: `SERVER_NAME=:10000`, `APP_SECRET` and the variables of the database, the storage and CORS ([backend.md](backend.md#env-vars-in-production)).
  - Why `SERVER_NAME=:10000`: Render terminates HTTPS and sends plain HTTP to the port in `PORT`, default 10000 ([Render web services](https://render.com/docs/web-services)). An address without a host name makes Caddy serve HTTP only ([symfony-docker production](https://github.com/dunglas/symfony-docker/blob/main/docs/production.md)).
  - Render has no setting for the build stage and its docs do not say which stage it builds. Docker builds the last stage by default, and that is `frankenphp_prod`. Check the first deploy log.
  - Checked locally: `docker build` of `packages/api`, then `docker run` with `SERVER_NAME=:10000`, `APP_SECRET`, `CORS_ALLOW_ORIGIN` and a `DATABASE_URL` of a running PostgreSQL, `-p 10000:10000`: it answers on `http://localhost:10000/api/health`. Without a reachable database the container stops after 60 seconds ([backend.md](backend.md#production-neon)).
  - The Render docs do not mention Docker Compose or the Dockerfile `HEALTHCHECK`.
- Local HTTPS: the dev server uses a certificate from Caddy's own local CA, so the browser warns once when you open the API directly ([symfony-docker TLS](https://github.com/dunglas/symfony-docker/blob/main/docs/tls.md)). The SPA does not need this: the Vite dev server proxies `/api` to the API.
- Database, R2, CORS and the dev proxy: [backend.md](backend.md).

## Deploy (Netlify)

`netlify.toml` is in `packages/apps/doremi/apps-doremi`. In the Netlify UI set the **Package directory** to this folder and leave the **Base directory** empty. The build runs in the repository root; `publish` is relative to the root. Source: [Netlify monorepos](https://docs.netlify.com/build/configure-builds/monorepos/). The page does not mention Nx or pnpm.
