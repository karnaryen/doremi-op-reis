# Quality checks

Roadmap phase 3: the code rules are checked by tools, not by memory. Every check runs with one command on a computer and in CI.

## Commands

| Command (repository root)      | What it checks                                                             | Needs Docker |
| ------------------------------ | -------------------------------------------------------------------------- | ------------ |
| `pnpm check`                   | Frontend and scripts: all rows of the first table below                    | No           |
| `pnpm check:api`               | API: all rows of the second table below                                    | Yes          |
| `pnpm check:all`               | Both                                                                       | Yes          |
| `pnpm format`                  | Fixes the formatting of TypeScript, JSON, YAML and Markdown files          | No           |
| `pnpm nx run api:format`       | Fixes the formatting of PHP files                                          | Yes          |
| `pnpm structure:check`         | Only the structure check                                                   | No           |
| `pnpm nx run api:format-check` | Only one API check; the same for `api:validate`, `api:phpstan`, `api:test` | Yes          |

Run `pnpm check` before a commit that changes frontend code, and `pnpm check:api` before a commit that changes `packages/api`.

## Frontend and scripts

| Check            | Tool                                    | What it catches                                                                        |
| ---------------- | --------------------------------------- | -------------------------------------------------------------------------------------- |
| Types            | `tsc`, one run per package              | Type errors; an import of a library that neither the package nor the root lists        |
| Code rules       | ESLint                                  | React and React Compiler rules, Lingui rules                                           |
| Import rules     | ESLint, `@nx/enforce-module-boundaries` | A forbidden import between packages ([monorepo.md](monorepo.md#tags-and-import-rules)) |
| Dependency lists | ESLint, `@nx/dependency-checks`         | A `package.json` that misses an imported library, or lists one that nothing imports    |
| Structure        | `scripts/structure/check.ts`            | Wrong folder, name, tags or version format; two copies of one library                  |
| Formatting       | Prettier                                | A file that is not formatted                                                           |
| Tests            | Vitest                                  | Broken behaviour                                                                       |
| Message catalogs | `pnpm i18n:check`                       | A text in the code that is not in the `.po` files                                      |

The dependency rules and the structure check are described in [monorepo.md](monorepo.md#dependencies).

## API

For a frontend developer: each PHP tool has a twin in the TypeScript world.

| Check              | Tool                                  | TypeScript twin                  | Nx target          |
| ------------------ | ------------------------------------- | -------------------------------- | ------------------ |
| Formatting         | PHP-CS-Fixer                          | Prettier                         | `api:format-check` |
| Types              | PHPStan, level 10                     | `tsc` with `strict`              | `api:phpstan`      |
| Architecture rules | PHPat (a PHPStan extension)           | `@nx/enforce-module-boundaries`  | `api:phpstan`      |
| Project files      | `composer validate`, `lint:container` | `pnpm install --frozen-lockfile` | `api:validate`     |
| Tests              | PHPUnit                               | Vitest                           | `api:test`         |

All paths below are in `packages/api`.

### Formatting: PHP-CS-Fixer

- Prettier does not format PHP (`.prettierignore` skips `packages/api`). [PHP-CS-Fixer](https://cs.symfony.com/) does it, with the `@Symfony` rule set: the [coding standard of Symfony](https://symfony.com/doc/current/contributing/code/standards.html). Its page lists PHP 7.4 to 8.5 as supported.
- Config: `.php-cs-fixer.dist.php`. It skips `var/`, `vendor/` and two generated files in `config/`.
- `check` changes no file and exits with a non-zero code if a file needs a fix; `fix` rewrites the files ([usage](https://cs.symfony.com/doc/usage.html)).
- One rule is changed: `phpdoc_to_comment` keeps `/** @var Type $x */`. The `@Symfony` set turns such a comment above a `return` into `/* ... */`, and PHPStan reads types only from `/** ... */` comments. Without the change, the formatter would silently remove type information.
- `@Symfony` puts a full stop after the first paragraph of a doc comment. A URL at the end of that paragraph would get a full stop too, so put a URL in its own paragraph.

### Types: PHPStan level 10

- Config: `phpstan.dist.neon`. Levels: [PHPStan rule levels](https://phpstan.org/user-guide/rule-levels).
- Phase 2 used level 8. Level 9 allows only one thing with an explicit `mixed` value: to pass it to another `mixed`. Level 10 does the same for a value with no type at all.
- Why now: phase 4 reads JSON from requests, and request data is `mixed`. At level 10 the code must check a value (`is_string()`, a DTO with validation) before it uses it. In TypeScript terms: `mixed` is `unknown`, and level 10 forbids an implicit `any`.
- [`phpstan-phpunit`](https://github.com/phpstan/phpstan-phpunit) is added: PHPStan understands mocks and `assert*` calls in tests, and its `rules.neon` reports weak asserts.
- Trade-off: level 10 asks for more type checks in code that reads outside data. If it costs more than it gives, lower `level` in `phpstan.dist.neon`; the PHPStan docs suggest a [baseline](https://phpstan.org/user-guide/baseline) for a large code base, which this is not.

### Architecture rules: PHPat

[PHPat](https://phpat.dev/getting-started/) is a PHPStan extension: the rules are PHP code, and `api:phpstan` checks them together with the types. There is no extra command.

The rules are in `tests/Architecture/ArchitectureRules.php`. Each public method that starts with `test` returns one rule. The class is registered in `phpstan.dist.neon` with the tag `phpat.test`. It is not a PHPUnit test, so its name does not end with `Test`.

| Rule                                              | Why                                                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Only `App\Storage` uses the `Aws\` classes        | Features use the `ObjectStorage` interface ([backend.md](backend.md#code)). A change of the SDK touches one folder |
| `App\Storage` uses no other `App\` namespace      | The storage saves objects. It does not know what a recording is                                                    |
| `App\Controller` does not use `Doctrine\` classes | A controller reads the request and builds the response. Queries and saving belong to a service or a repository     |

- A "use" is a parameter type, a return type, `new`, `extends`, `implements`, an attribute or a type in a doc comment.
- `App\Tests` is not checked by the first rule: a test of the storage needs the mock handler of the AWS SDK.
- The third rule is a decision for phase 4, taken from the data path in [learning-guide.md](../learning-guide.md): Controller → Service → Repository. A controller may still have an entity (`App\Entity\...`) as a parameter or a return value: the rule forbids the `Doctrine\` classes, for example `EntityManagerInterface`. If a small endpoint needs no service, change the rule: a rule that is always ignored is worse than no rule.
- What PHPat does not see: a method call on an object that came from somewhere else. `$repository->createQueryBuilder()->...` in a controller passes, because no `Doctrine\` class name is written there. The rule stops the common cases, not every case.
- What the third rule also stops: `catch (UniqueConstraintViolationException $e)` in a controller. The service must catch a Doctrine exception and throw its own.
- PHPat is at version 0.12, and its README says a 0.x release can break the API. `composer.json` allows only `^0.12.5`, so an update to 0.13 is a deliberate step.

### Project files: `api:validate`

- `composer validate --strict --no-check-publish`: `composer.json` is valid and `composer.lock` matches it ([Composer `validate`](https://getcomposer.org/doc/03-cli.md#validate)). `--strict` fails on warnings too. `--no-check-publish` skips the fields that only a published package needs (`name`, `description`).
- `php bin/console lint:container`: every service gets arguments of the right type. Two compiler passes do this check, and they run only in this command; the Symfony docs recommend it in CI ([Symfony: linting service definitions](https://symfony.com/doc/current/service_container.html#linting-service-definitions)).

## CI

`.github/workflows/ci.yml` runs on every pull request and on every push to `main`. Two jobs run at the same time:

| Job                    | Commands                                                             |
| ---------------------- | -------------------------------------------------------------------- |
| Frontend and structure | `pnpm install --frozen-lockfile`, `pnpm check`                       |
| API                    | `pnpm nx run api:docker-build`, `api:install`, then `pnpm check:api` |

- CI calls the same commands as a developer. There is no second list of checks to keep in sync.
- `--frozen-lockfile` fails if `pnpm-lock.yaml` does not match the `package.json` files.
- The API job builds the same Docker image as `pnpm dev:api` and starts PostgreSQL from `compose.yaml`. It needs no secrets: `.env.test` has test values, and the tests use a fake storage ([backend.md](backend.md#tests-1)).
- The repository is public, and standard GitHub-hosted runners are free for public repositories ([GitHub Actions billing](https://docs.github.com/en/billing/managing-billing-for-your-products/about-billing-for-github-actions)).
- pnpm is installed with `pnpm/action-setup`, which reads the version from `packageManager` in `package.json`. The CI page of pnpm now shows `pnpm/setup`, but that action installs pnpm 11 and newer only ([pnpm/setup](https://github.com/pnpm/setup)); the repository uses pnpm 10.
- The API job sets `XDEBUG_MODE=off`: `compose.override.yaml` turns Xdebug on for development, and it makes PHPStan and PHP-CS-Fixer slow.
- The runner is `ubuntu-24.04`, not `ubuntu-latest`: the image has Docker Compose 2 ([runner image](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md)), and a fixed name does not change under us.

Security settings of the workflow, from the [GitHub hardening guide](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions):

- `permissions: contents: read`: the token of a run can read the code and cannot write to the repository.
- Every action is pinned to a full commit SHA, with the version in a comment. A tag can be moved to other code; a commit cannot. To update an action, replace the SHA and the comment together.
- `persist-credentials: false`: the checkout step does not leave the token in the git config for later steps.
- The workflow uses no secrets, so a pull request cannot read one. It also has no `pull_request_target` trigger: that trigger runs with the rights of the base repository, and is the usual way a pull request from a fork gets a secret.

Not done:

- CI is not a required check. To block a merge when CI fails, add a branch protection rule or a ruleset for `main` in the GitHub settings.
- No Docker layer cache: the API job builds the image on every run.
- Nothing updates the pinned actions. Dependabot can open pull requests for them ([Dependabot for GitHub Actions](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/keeping-your-actions-up-to-date-with-dependabot)); it is not set up.
- The development image is not fully pinned. `Dockerfile` downloads the latest Symfony language server without a checksum, and the base images use moving tags (`dunglas/frankenphp:1-php8.5`, `postgres:18-alpine`). This comes from the symfony-docker template. The API job has no secrets and a read-only token, so a bad download could change a CI result, not the repository. The production image does not have this download step.
- No git hook runs the checks before a commit. A hook is faster feedback, but it can be skipped with `--no-verify`, so CI is the check that counts.
