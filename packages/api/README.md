# API (Symfony)

The Symfony API of Doremi op reis. It runs in Docker; setup and deploy: [docs/tech/monorepo.md](../../docs/tech/monorepo.md#api-package). Database, file storage and CORS: [docs/tech/backend.md](../../docs/tech/backend.md).

| Command (repository root)      | What it does                        |
| ------------------------------ | ----------------------------------- |
| `pnpm nx run api:install`      | `composer install` in the container |
| `pnpm dev:api`                 | Start the API and PostgreSQL, https://localhost |
| `pnpm test:api`                | Migrates the database `app_test`, then PHPUnit |
| `pnpm nx run api:phpstan`      | PHPStan: types and the architecture rules |
| `pnpm nx run api:format-check` | PHP-CS-Fixer: is the code formatted? |
| `pnpm nx run api:format`       | PHP-CS-Fixer: format the code       |
| `pnpm nx run api:validate`     | `composer validate` and `lint:container` |
| `pnpm check:api`               | `format-check`, `validate`, PHPStan and PHPUnit |
| `pnpm nx run api:check`        | `app:check`: PostgreSQL and R2 reachable? |
| `pnpm nx run api:docker-build` | Rebuild the image                   |

All checks: [docs/tech/quality.md](../../docs/tech/quality.md#api).

Where the code is (`src/`):

| Folder           | Content                                                                             |
| ---------------- | ----------------------------------------------------------------------------------- |
| `Controller/`    | HTTP endpoints: read the request, call a service, return JSON                       |
| `Dto/`           | The typed shape of each JSON request body, with its validation rules                |
| `Service/`       | The use cases: sign-up, parent accounts, invitations, Assignments, recordings       |
| `Upload/`        | Which files are allowed, and the two steps of every upload                          |
| `Entity/`        | The tables as PHP classes, with the rules of their own state (Assignment lifecycle) |
| `Repository/`    | Queries                                                                             |
| `Security/`      | Voters (access to one object) and the answer to a failed sign-in                    |
| `View/`          | The shape of each JSON answer                                                       |
| `EventListener/` | JSON errors, sign-out answer, the "JSON only" rule against CSRF                     |
| `Storage/`       | The file storage (Cloudflare R2)                                                    |

Local emails: http://localhost:8025 (Mailpit). Endpoints: [docs/tech/architecture.md](../../docs/tech/architecture.md#api-endpoints).

The rest of this file is the guide from the Symfony skeleton (it was `AGENTS.md`): rules for people and AI agents who write code here.

This is a Symfony project. Check `composer.json` for the exact Symfony/PHP version
in use, and read `symfony.lock` to see which recipes ran. Doctrine ORM, Doctrine
Migrations, NelmioCorsBundle, the HTTP client, SecurityBundle, Validator,
Serializer, Mailer and RateLimiter are installed. Don't assume
Twig, API Platform, Messenger, or Lock are installed unless one of those says so.

## Ask before generating

If the task doesn't specify, ask rather than guess:

- Persistence: Doctrine ORM, Doctrine ODM, or none?
- Interface: server-rendered (Twig), API (Serializer, maybe API Platform), or both?
- Auth: SecurityBundle, and which authenticator?

If you can't ask (no interactive channel), state the assumption you're making and
pick the smallest option (e.g. no persistence layer) rather than scaffolding a
full stack nobody asked for.

## Adding features: Flex, not hand-wiring

Install new capabilities with `composer require <package>` (e.g. `symfony/lock`,
`symfony/messenger`, `orm-pack`) and let the Flex recipe register the bundle and
generate its config. Don't hand-edit `config/bundles.php` or hand-write a bundle's
base config; that's what the recipe is for. Don't skip a good-fit component just
because it isn't installed yet; installing it is one command.

## Conventions

Follow https://symfony.com/doc/current/best_practices.html to write idiomatic
Symfony:

- Use PHP attributes for framework metadata, and not only on controllers:
  `#[Route]`, `#[MapRequestPayload]`, `#[IsGranted]` on actions, `#[Assert\...]`
  on properties, `#[AsCommand]`, `#[AsEventListener]`, `#[AsMessageHandler]`, and
  `#[AsAlias]` / `#[AsTaggedItem]` / `#[Autoconfigure]` on services. No YAML or
  XML routing.
- Rely on autowiring and autoconfiguration. Type-hint constructor arguments and
  let the container resolve them. Where a type-hint can't express it, stay in the
  class with `#[Autowire]` (parameters, env vars, expressions) or `#[Target]` (one
  of several implementations of an interface). A YAML service definition is the
  last resort, not the first.
- Controllers extend `AbstractController`, stay thin, and delegate to services.
- Use the framework for what it already does: Form for server-rendered forms,
  Validator for validation, Serializer for JSON, Messenger for async work,
  Security (voters, authenticators) for access control, Twig `path()`/`url()`
  instead of hardcoded URLs.
- Before hand-writing infrastructure (locks, queues, caches, HTTP clients,
  mailers, schedulers) or reaching for a third-party library, check whether a
  Symfony component covers it. It usually does.

Three specifics worth spelling out, because they are easy to get wrong:

- Bind request data with `#[MapRequestPayload]` / `#[MapQueryString]` on action
  arguments, which wires up Serializer and Validator for you, instead of calling
  `json_decode()` or `SerializerInterface` by hand. If neither package is
  installed yet, `composer require` them rather than falling back to manual
  parsing.
- Use constructor property promotion, and `readonly` for DTOs and value objects.
- Use `symfony/lock` (`LockFactory`) for mutual exclusion. A hand-built flag or
  lock file looks fine in review and is usually wrong under concurrency.

## Everyday workflow

- Run the app with `pnpm dev:api`, and commands in the container:
  `docker compose exec php bin/console ...` (in `packages/api`, while the app runs).
- When something fails, read `var/log/dev.log` before changing code. The web
  profiler is not installed (`composer require --dev symfony/profiler-pack`).
- If `maker-bundle` is installed, prefer `bin/console make:*` with every argument
  passed up front and `--no-interaction` where supported: makers prompt on a
  terminal by default, which hangs a non-interactive shell. If a maker still
  needs interactive input, hand-write the code instead.
- If Doctrine ORM is installed, schema changes go through migrations
  (`bin/console make:migration`, then `doctrine:migrations:migrate`), never
  `doctrine:schema:update` or hand-written SQL.
- `.env` is committed and holds defaults only. Real secrets belong in `.env.local`
  (git-ignored) or the secrets vault (`bin/console secrets:set`), read via
  `%env(...)%`.

## Testing

Install `symfony/test-pack` if it isn't already. Functional/HTTP tests extend
`WebTestCase`; service-level tests extend `KernelTestCase`. Run
`php bin/phpunit` (falls back to `vendor/bin/phpunit`). A feature isn't done
until it has a test that exercises it the way a caller would, an HTTP request for
a controller or a service call for a service, not just "it didn't throw."

## Code style

Symfony's coding standard, the `@Symfony` php-cs-fixer ruleset (a PSR-12-derived
superset), configured in `.php-cs-fixer.dist.php`. Check with
`pnpm nx run api:format-check`, fix with `pnpm nx run api:format`.

## Architecture rules

`tests/Architecture/ArchitectureRules.php` says which namespace may use which;
PHPStan checks it. Read it before you add a class, and see
[docs/tech/quality.md](../../docs/tech/quality.md#architecture-rules-phpat).

## Discover, don't guess

Framework APIs change between versions and your training data may be stale. Look
things up in the project instead of relying on memory:

- `bin/console about`: versions, environment, paths.
- `bin/console debug:router`, `debug:container`, `debug:autowiring <name>`,
  `debug:config <bundle>`, `config:dump-reference <bundle>`: what exists and how
  it is configured.
- `bin/console lint:container`, plus `lint:twig templates/` and
  `lint:yaml config/` where those packages are installed: validate before running.
- Read the installed source and docblocks under `vendor/`.
- Docs: https://symfony.com/doc/current/ (switch to the version matching
  `composer.json` if it differs).
