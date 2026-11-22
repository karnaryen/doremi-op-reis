# Backend setup

Roadmap phase 2: the API can reach a database and a file storage. There are no entities and no endpoints for data yet: they come with the features in phase 4.

| Concern      | Tool                                                             | Where                                                                   |
| ------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Database     | PostgreSQL 18, Doctrine ORM 3, Doctrine Migrations               | `compose.yaml`, `config/packages/doctrine.yaml`, `migrations/`          |
| File storage | Cloudflare R2 through `aws/aws-sdk-php`                          | `src/Storage/`                                                          |
| CORS         | `nelmio/cors-bundle`                                             | `config/packages/nelmio_cors.yaml`                                      |
| Dev proxy    | Vite `server.proxy`                                              | [vite.config.ts](../../packages/apps/doremi/apps-doremi/vite.config.ts) |
| Check        | Console command `app:check`                                      | `src/Command/CheckCommand.php`                                          |
| Quality      | PHPUnit, PHPStan level 8 (`phpstan-symfony`, `phpstan-doctrine`) | `tests/`, `phpstan.dist.neon`                                           |

All paths without a link are in `packages/api`.

## Commands

| Command (repository root) | What it does                                                       |
| ------------------------- | ------------------------------------------------------------------ |
| `pnpm dev:api`            | Starts the API and PostgreSQL in Docker                            |
| `pnpm test:api`           | Creates the test database if it is missing, then runs PHPUnit      |
| `pnpm nx run api:phpstan` | Static analysis                                                    |
| `pnpm nx run api:check`   | Runs `app:check`: is PostgreSQL reachable, does R2 save and delete |

After a change in `Dockerfile` or `compose*.yaml`: `pnpm nx run api:docker-build`.

## Database

### Local

- `compose.yaml` has a `database` service: `postgres:18-alpine`. Neon supports PostgreSQL 14 to 19, and 18 is the default for a new project ([Neon version policy](https://neon.com/docs/postgresql/postgres-version-policy)), so local and production run the same major version.
- The `php` service gets `DATABASE_URL` from `compose.yaml`. The host in the URL is `database`: the service name. A real env var wins over the `.env` files ([Symfony configuration](https://symfony.com/doc/current/configuration.html)).
- `serverVersion=18` in the URL tells Doctrine the server version, so it does not ask the server ([Symfony Doctrine](https://symfony.com/doc/current/doctrine.html#configuring-the-database)).
- The data is in the Docker volume `database_data`. It is mounted at `/var/lib/postgresql`, not at `/var/lib/postgresql/data`: the PostgreSQL 18 image keeps its data in `/var/lib/postgresql/18/docker` (checked with `docker image inspect postgres:18-alpine`).
- The database port is published only on `127.0.0.1`, on a random port. Find it with `docker compose port database 5432`. User `app`, password `!ChangeMe!`, database `app`: a local password only.
- `docker compose down -v` deletes the volume and all local data.

### Tests

- Tests use a second database, `app_test`: `doctrine.yaml` adds the suffix `_test` in the test environment ([Symfony testing](https://symfony.com/doc/current/testing.html#configuring-a-database-for-tests)).
- `pnpm test:api` creates it with `doctrine:database:create --if-not-exists`.
- There are no tables yet. With the first entity, add a step that runs the migrations in the test environment, and a way to reset the data between tests. The Symfony docs recommend `dama/doctrine-test-bundle`.

### Migrations

- Schema changes go through migration files in `migrations/`, never through `doctrine:schema:update` ([Symfony Doctrine](https://symfony.com/doc/current/doctrine.html#migrations-creating-the-database-tables-schema)).
- The container runs `doctrine:migrations:migrate` at every start, if `migrations/` has a file (`frankenphp/docker-entrypoint.sh`). This is true for local Docker and for production.
- Before that, the same script waits for the database: `.env` now has a `DATABASE_URL` line, and this turns the wait on. If the database does not answer in 60 seconds, the container stops with an error.

### Production (Neon)

Not set up yet. When the Neon project exists, set `DATABASE_URL` in the hosting settings, never in a committed file.

**Before the first deploy of this phase:** the production container no longer starts with `SERVER_NAME` and `APP_SECRET` alone. It needs a reachable `DATABASE_URL` (see the wait above) and `CORS_ALLOW_ORIGIN` (without it every request, also `/api/health`, answers 500). Set both on Render first, or the deploy fails its health check.

- Use the **direct** connection string, not the pooled one (host with `-pooler`). The pooler is PgBouncer in transaction mode; Neon says to use a direct connection for schema migrations ([Neon connection pooling](https://neon.com/docs/connect/connection-pooling)). The migrations run at container start with the same `DATABASE_URL`.
- Add `serverVersion=18` and `sslmode`. Neon recommends `sslmode=verify-full`; its own connection strings use `sslmode=require` ([Neon: connect securely](https://neon.com/docs/connect/connect-securely)). With `require`, libpq checks the server certificate only if a root certificate file is present ([libpq](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-SSLMODE)), so prefer `verify-full`.
  - `verify-full` needs the root certificates. libpq reads `~/.postgresql/root.crt` by default; `sslrootcert=system` uses the certificates of the system instead (same libpq page). Doctrine passes `sslmode` and `sslrootcert` from the URL to the driver ([Doctrine DBAL configuration](https://www.doctrine-project.org/projects/doctrine-dbal/en/current/reference/configuration.html)). The image has libpq 17.
  - Not tested against Neon yet: the local database has no TLS. Check `sslmode=verify-full&sslrootcert=system` on the first deploy.
- A free Neon compute suspends after 5 minutes without queries and starts again in a few hundred milliseconds ([Neon scale to zero](https://neon.com/docs/introduction/scale-to-zero)). FrankenPHP keeps PHP running between requests, so a connection would stay open and then break. `idle_connection_ttl: 240` in `doctrine.yaml` closes a connection that is older than 240 seconds before the next request.

## File storage (Cloudflare R2)

### Setup

1. Create a bucket in the Cloudflare dashboard. Choose the **EU jurisdiction** if the recordings must stay in the EU ([privacy.md](../product/privacy.md)): a jurisdiction is a guarantee, a location hint is not, and the jurisdiction cannot be changed later ([R2 data location](https://developers.cloudflare.com/r2/reference/data-location/)).
2. Create an R2 API token with the permission **Object Read & Write**, for this bucket only. Copy the Access Key ID and the Secret Access Key: the secret is shown once ([R2 API tokens](https://developers.cloudflare.com/r2/api/tokens/)).
3. Put four values into `packages/api/.env.local` (git ignores it), and later into the hosting settings:

| Variable               | Value                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `R2_ENDPOINT`          | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`; with the EU jurisdiction `https://<ACCOUNT_ID>.eu.r2.cloudflarestorage.com` |
| `R2_BUCKET`            | The bucket name                                                                                                              |
| `R2_ACCESS_KEY_ID`     | From the token                                                                                                               |
| `R2_SECRET_ACCESS_KEY` | From the token                                                                                                               |

4. Run `pnpm nx run api:check`.

The app starts without these values. Only code that uses the storage fails then, with a `StorageException`: "R2 is not configured", or "R2_ENDPOINT must be a URL that starts with https://". Plain `http://` is refused: the files of children would travel without encryption.

### Code

| Class              | Purpose                                                                                                                                                                                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ObjectStorage`    | Interface with the four operations the app needs. Features depend on it, not on the AWS SDK.                                                                                                                                                                                           |
| `S3ObjectStorage`  | The implementation on the S3 API.                                                                                                                                                                                                                                                      |
| `S3ClientFactory`  | Builds the AWS SDK client with the R2 endpoint and `region: auto` ([R2 with aws-sdk-php](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-php/)). Refuses empty settings (the SDK would read an empty endpoint as "Amazon S3") and an endpoint that is not an `https://` URL. |
| `ObjectInfo`       | Size and MIME type of one object.                                                                                                                                                                                                                                                      |
| `StorageException` | The one error type of the storage.                                                                                                                                                                                                                                                     |

| Method              | What happens                                     | Request to R2          |
| ------------------- | ------------------------------------------------ | ---------------------- |
| `createUploadUrl`   | Returns a signed URL for HTTP `PUT` requests     | None: signing is local |
| `createDownloadUrl` | Returns a signed URL for HTTP `GET` requests     | None                   |
| `getInfo`           | Size and type of an object, or `null`            | `HeadObject` (Class B) |
| `delete`            | Deletes an object; no error if it does not exist | `DeleteObject` (free)  |

Operation classes and prices: [R2 pricing](https://developers.cloudflare.com/r2/pricing/).

### Signed URLs

Facts from [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/):

- A signed URL is made on our server from the secret key, without a request to R2. It lives from 1 second to 7 days.
- R2 supports `GET`, `HEAD`, `PUT` and `DELETE`. `POST` (an HTML form upload) is not supported.
- They work only on the S3 API domain (`<ACCOUNT_ID>.r2.cloudflarestorage.com`), not on a custom domain.

What an upload URL does **not** limit:

- The AWS SDK for PHP signs only the `host` header of a presigned request: it removes `Content-Type` and `Content-Length` before signing (`getPresignHeaderDenyList()` and `getHeaderBlacklist()` in `vendor/aws/aws-sdk-php/src/Signature/SignatureV4.php`, version 3.407). The R2 page says a signed `Content-Type` is possible, but this SDK does not do it.
- A signed URL is not a one-time URL. It works for any number of requests until it expires, and a second `PUT` replaces the object.
- So a person with the URL can upload a file of any type and any size under this one key, again and again, until the URL expires.
- The rules for phase 4:
  - A short lifetime for upload URLs.
  - After the upload the service calls `getInfo()` and checks size and type **before** it saves a row. A wrong object is deleted. This is step 5 of the upload flow in [architecture.md](architecture.md#upload-flow).
  - One check is not enough while the upload URL still works: the parent could upload a good file, wait for the check, and then replace it with another file. Close this gap in the upload feature. Two ways: copy the checked object to a new key that no upload URL exists for, or check again after the URL has expired.
  - A download URL sends the stored MIME type to the browser. For a download, R2 can replace it: the S3 parameters `ResponseContentType` and `ResponseContentDisposition` are part of the signed URL. Add them to `createDownloadUrl()` when the playback feature needs them. Not tested against R2.
- The MIME type in `ObjectInfo` is what the uploader sent. R2 does not look into the file.

One more trap: `createPresignedRequest()` of the SDK reads a number as a Unix timestamp, not as a number of seconds. `S3ObjectStorage` passes `'+900 seconds'`; a test checks `X-Amz-Expires`.

### Bucket CORS (phase 4)

The browser uploads to R2 directly, so the **bucket** needs its own CORS policy; without it, browser uploads and downloads with signed URLs fail ([R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/)). This is a setting in Cloudflare, not in Symfony. It is not needed for `app:check`, which is not a browser. Example for the dashboard (Settings → CORS policy):

```json
[
  {
    "AllowedOrigins": ["https://<the SPA origin>"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### `app:check`

`bin/console app:check` runs `SELECT 1`, then uploads a small text object through a signed URL (as a browser will do), reads its size with `getInfo()`, downloads it through a signed URL and deletes it.

It is a console command, not an HTTP endpoint. A public endpoint would let anybody make the API call the database and R2. `GET /api/health` stays a check of the PHP process only. It is the health check path on Render ([Render health checks](https://render.com/docs/health-checks)); a database query in it would run on every health check and could stop the Neon compute from suspending (our reasoning, not a statement from the Neon docs).

The output never shows a signed URL. With `-vv` the Symfony HTTP client logs every request with its full URL: the URLs of this command live 60 seconds.

Not tested against a real bucket yet: there is no R2 account. The tests use the mock handler of the AWS SDK and an in-memory fake.

### Tests

- `S3ObjectStorage` unit tests use `Aws\MockHandler`: it answers instead of R2 ([AWS SDK handlers](https://docs.aws.amazon.com/sdk-for-php/v3/developer-guide/guide_handlers-and-middleware.html)).
- In the test environment the container gives `InMemoryObjectStorage` to every class that asks for `ObjectStorage` (`config/services.yaml`, `when@test`), and the HTTP client is a mock that serves the URLs of this fake (`framework.http_client.mock_response_factory`, [Symfony HTTP client testing](https://symfony.com/doc/current/http_client.html#testing)). No test sends a request to the network.

### Trade-offs

- **No local S3 server (MinIO or similar).** Fewer moving parts, but signed URLs and `app:check` are proven only with a real R2 bucket. Add an emulator if phase 4 needs uploads without the network.
- **`aws/aws-sdk-php` and not a smaller client.** It is the SDK from the Cloudflare example and the choice in [stack.md](stack.md). It is large, and it cannot sign `Content-Type` in a presigned URL (see above).

## CORS and local HTTPS

Two origins must work together: the SPA and the API.

| Where       | SPA origin              | API origin          | Solution                                                           |
| ----------- | ----------------------- | ------------------- | ------------------------------------------------------------------ |
| Development | `http://localhost:5173` | `https://localhost` | Vite proxies `/api`: for the browser there is one origin           |
| Production  | Netlify                 | Render              | CORS: the API allows the SPA origin ([stack.md](stack.md#hosting)) |

### Development: the Vite proxy

- The SPA calls `/api/...` with an empty `VITE_API_BASE_URL`. The Vite dev server sends these requests to the API ([Vite `server.proxy`](https://vite.dev/config/server-options#server-proxy)).
- This answers the open point of phase 1: the browser never sees the certificate of the local API, so nobody has to trust the local CA of Caddy. Vite skips the certificate check, but only if the target host is `localhost`, `127.0.0.1` or `[::1]`.
- Target: `https://localhost`. With other ports, set `API_PROXY_TARGET=https://localhost:8443` in the shell or in `packages/apps/doremi/apps-doremi/.env.local`. The name has no `VITE_` prefix, so the value is not in the browser bundle.
- `vite preview` uses the same proxy ([Vite preview options](https://vite.dev/config/preview-options)).

### Production: CORS

- `CORS_ALLOW_ORIGIN` is a **regular expression** for the whole `Origin` header, for example `https://doremi\.example\.com`. `nelmio_cors.yaml` wraps the value in `^(?:` … `)$`, so it cannot match a part of a longer origin such as `https://doremi.example.com.evil.test`. Escape the dots: a plain `.` matches any character.
- The variable has no default in `.env`. Without the variable every request fails with status 500 and the log names the variable. `.env.dev` has a value for local origins.
- Why the wrapping matters: the bundle tests the origin with `preg_match()` and adds no anchors itself (`checkOrigin()` in `vendor/nelmio/cors-bundle/EventListener/CorsListener.php`). Without `^(?:` … `)$` an empty value would match every origin.
- Only paths under `/api/`, only the header `Content-Type`.
- `allow_credentials` is off. If sign-in uses cookies, turn it on together with the sign-in (phase 4); then the origin must stay an exact match.
- A request from another origin is not blocked: it gets no `Access-Control-Allow-Origin` header, and the browser hides the answer from the page. CORS is not access control. A program that is not a browser ignores it.
- Config reference: [NelmioCorsBundle](https://symfony.com/bundles/NelmioCorsBundle/current/index.html).

## Env vars in production

| Variable                                                               | Where   | Note                                                             |
| ---------------------------------------------------------------------- | ------- | ---------------------------------------------------------------- |
| `APP_SECRET`                                                           | Render  | Since phase 1                                                    |
| `SERVER_NAME`                                                          | Render  | `:10000`, since phase 1 ([monorepo.md](monorepo.md#api-package)) |
| `DATABASE_URL`                                                         | Render  | Neon direct connection string, see above                         |
| `CORS_ALLOW_ORIGIN`                                                    | Render  | Regex of the Netlify origin                                      |
| `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Render  | From the R2 token                                                |
| `VITE_API_BASE_URL`                                                    | Netlify | Origin of the API. Not a secret: it is in the browser bundle     |

Render gives the env vars of a service to the container at runtime, and also to the Docker build as build arguments ([Render Docker secrets](https://render.com/docs/docker-secrets)). Our `Dockerfile` reads none of them as `ARG`, so no secret is saved in an image layer. Keep it this way.

Netlify: set the variable in the UI (Project configuration → Environment variables); a change needs a new build ([Netlify environment variables](https://docs.netlify.com/build/environment-variables/overview/)).

Pre-deploy commands on Render are for paid services ([Render deploys](https://render.com/docs/deploys)), so the migrations run at container start.
