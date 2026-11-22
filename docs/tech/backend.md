# Backend setup

The API saves data in PostgreSQL and files in Cloudflare R2 (roadmap phase 2), and since phase 4 it has sign-in, accounts, Assignments and uploads. The flows are in [architecture.md](architecture.md), the tables in [data-model.md](data-model.md).

| Concern      | Tool                                                             | Where                                                                   |
| ------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Database     | PostgreSQL 18, Doctrine ORM 3, Doctrine Migrations               | `compose.yaml`, `config/packages/doctrine.yaml`, `migrations/`          |
| File storage | Cloudflare R2 through `aws/aws-sdk-php`                          | `src/Storage/`                                                          |
| Sign-in      | Symfony Security: `json_login`, session cookie, voters           | `config/packages/security.yaml`, `src/Security/`                        |
| Validation   | `#[MapRequestPayload]` with `symfony/validator`                  | `src/Dto/`                                                              |
| Email        | Symfony Mailer; Mailpit in local Docker                          | `src/Service/InvitationMailer.php`, `compose.override.yaml`             |
| CORS         | `nelmio/cors-bundle`                                             | `config/packages/nelmio_cors.yaml`                                      |
| Dev proxy    | Vite `server.proxy`                                              | [vite.config.ts](../../packages/apps/doremi/apps-doremi/vite.config.ts) |
| Check        | Console command `app:check`                                      | `src/Command/CheckCommand.php`                                          |
| Quality      | PHPUnit, PHPStan, PHP-CS-Fixer: see [quality.md](quality.md#api) | `tests/`, `phpstan.dist.neon`, `.php-cs-fixer.dist.php`                 |

All paths without a link are in `packages/api`.

## Commands

| Command (repository root) | What it does                                                       |
| ------------------------- | ------------------------------------------------------------------ |
| `pnpm dev:api`            | Starts the API and PostgreSQL in Docker                            |
| `pnpm test:api`           | Creates the test database, runs the migrations, then runs PHPUnit  |
| `pnpm nx run api:phpstan` | Static analysis                                                    |
| `pnpm check:api`          | All API checks: format, `validate`, PHPStan, tests                 |
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
- `pnpm test:api` also runs `doctrine:migrations:migrate` in the test environment, so the tests use the tables of the migrations and not of `schema:create`.
- [`dama/doctrine-test-bundle`](https://github.com/dmaicher/doctrine-test-bundle) wraps every test in a transaction and rolls it back: a test never sees the rows of another test. It is the bundle that the [Symfony testing page](https://symfony.com/doc/current/testing.html#resetting-the-database-automatically-before-each-test) names. Its PHPUnit extension is in `phpunit.dist.xml`.
- `tests/SchemaTest.php` fails when an entity was changed and no migration was written for the change.
- The API tests (`tests/Api/`) send real requests through the whole application; `ApiTestCase` has the helpers. The clock stands still in tests (`symfony/clock`), so dates are compared exactly.

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
| `ObjectStorage`    | Interface with the six operations the app needs. Features depend on it, not on the AWS SDK.                                                                                                                                                                                            |
| `S3ObjectStorage`  | The implementation on the S3 API.                                                                                                                                                                                                                                                      |
| `S3ClientFactory`  | Builds the AWS SDK client with the R2 endpoint and `region: auto` ([R2 with aws-sdk-php](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-php/)). Refuses empty settings (the SDK would read an empty endpoint as "Amazon S3") and an endpoint that is not an `https://` URL. |
| `ObjectInfo`       | Size and MIME type of one object.                                                                                                                                                                                                                                                      |
| `StorageException` | The one error type of the storage.                                                                                                                                                                                                                                                     |

| Method              | What happens                                     | Request to R2                                            |
| ------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| `createUploadUrl`   | Returns a signed URL for HTTP `PUT` requests     | None: signing is local                                   |
| `createDownloadUrl` | Returns a signed URL for HTTP `GET` requests     | None                                                     |
| `getInfo`           | Size and type of an object, or `null`            | `HeadObject` (Class B)                                   |
| `copy`              | Copies an object to a new key inside the bucket  | `CopyObject` (Class A)                                   |
| `delete`            | Deletes an object; no error if it does not exist | `DeleteObject` (free)                                    |
| `deletePrefix`      | Deletes every object under a key prefix          | `ListObjectsV2` per page, then `DeleteObject` per object |

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
- What the app does about it (`src/Upload/Uploads.php`, since phase 4):
  - Upload URLs live 15 minutes and point to a temporary key under `uploads/`.
  - Before the URL is made, the API checks the type and the size that the browser reports (`src/Upload/FileRule.php`).
  - After the upload, `accept()` **copies** the object to a final key (`recordings/...` or `materials/...`) and checks the size and the type of the copy with `getInfo()`. A wrong file is deleted, with its upload.
  - Why a copy: one check is not enough while the upload URL still works. The parent could upload a good file, wait for the check, and then replace it. No upload URL exists for the final key, so the checked file cannot change. R2 supports `CopyObject` ([R2 S3 API](https://developers.cloudflare.com/r2/api/s3/api/)); it is a Class A operation ([R2 pricing](https://developers.cloudflare.com/r2/pricing/)).
  - The database row is saved only after the check. The temporary object and a replaced recording are deleted after the row is saved; if that deletion fails, the request still succeeds and the object stays without a row, for the daily job (roadmap phase 5).
  - An upload that is never confirmed stays under `uploads/` (the app was closed, the network failed). When a parent is deleted, the app deletes everything under `uploads/recordings/<assignment id>/` of the family, so no video of the child stays. For all other cases set an **object lifecycle rule** on the bucket: delete objects with the prefix `uploads/` after 1 day. R2 has such rules, with a prefix; the page says objects are typically removed within 24 hours after they expire, and gives no minimum age ([R2 object lifecycles](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)). This is a setting in Cloudflare, not in Symfony. Not set up or tested yet.
  - The number of upload URLs is limited per user ([Limits](#limits)): a URL lets the browser put a file of any size into the bucket.
  - A download URL sends the stored MIME type to the browser. It is one of the allowed types, because the copy was checked. The S3 parameters `ResponseContentType` and `ResponseContentDisposition` are not used.
- The MIME type in `ObjectInfo` is what the uploader sent. R2 does not look into the file.

One more trap: `createPresignedRequest()` of the SDK reads a number as a Unix timestamp, not as a number of seconds. `S3ObjectStorage` passes `'+900 seconds'`; a test checks `X-Amz-Expires`.

### Bucket CORS

The browser uploads to R2 directly, so the **bucket** needs its own CORS policy; without it, browser uploads and downloads with signed URLs fail ([R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/)). This is a setting in Cloudflare, not in Symfony. It is not needed for `app:check`, which is not a browser. Example for the dashboard (Settings → CORS policy):

```json
[
  {
    "AllowedOrigins": ["https://<the SPA origin>", "http://localhost:5173"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

- `PUT` with the header `Content-Type` is what `uploadToSignedUrl()` of `org-data-api` sends; `GET` is for the players and the file links.
- List the local origin only on a bucket for development. An origin has no path, and a port is never a wildcard: every local port is its own entry (same page).

### Allowed files

| File             | Types                                      | Largest size |
| ---------------- | ------------------------------------------ | ------------ |
| Recording, video | MP4, QuickTime (`.mov` of an iPhone), WebM | 200 MB       |
| Recording, audio | MP3, MP4/M4A, AAC, WAV, WebM, Ogg          | 30 MB        |
| Sheet music      | one PDF, or 1 to 10 images (JPEG, PNG)     | 15 MB each   |
| Audio example    | as a recording, audio                      | 30 MB        |

The sizes are a first choice, in `src/Upload/FileRule.php`: the maximum recording length is an open question ([roadmap.md](../roadmap.md#open-questions)). One `PUT` to R2 takes at most 5 GiB ([R2 limits](https://developers.cloudflare.com/r2/platform/limits/)), so no multipart upload is needed. HEIC photos are not accepted (open question).

### `app:check`

`bin/console app:check` runs `SELECT 1`, then uploads a small text object through a signed URL (as a browser will do), reads its size with `getInfo()`, downloads it through a signed URL and deletes it.

It is a console command, not an HTTP endpoint. A public endpoint would let anybody make the API call the database and R2. `GET /api/health` stays a check of the PHP process only. It is the health check path on Render ([Render health checks](https://render.com/docs/health-checks)); a database query in it would run on every health check and could stop the Neon compute from suspending (our reasoning, not a statement from the Neon docs).

The output never shows a signed URL. With `-vv` the Symfony HTTP client logs every request with its full URL: the URLs of this command live 60 seconds.

The tests use the mock handler of the AWS SDK and an in-memory fake. Against a real bucket, `app:check` and the upload of a file from the browser were checked by hand in phase 4.

### Tests

- `S3ObjectStorage` unit tests use `Aws\MockHandler`: it answers instead of R2 ([AWS SDK handlers](https://docs.aws.amazon.com/sdk-for-php/v3/developer-guide/guide_handlers-and-middleware.html)).
- In the test environment the container gives `InMemoryObjectStorage` to every class that asks for `ObjectStorage` (`config/services.yaml`, `when@test`), and the HTTP client is a mock that serves the URLs of this fake (`framework.http_client.mock_response_factory`, [Symfony HTTP client testing](https://symfony.com/doc/current/http_client.html#testing)). No test sends a request to the network.

### Trade-offs

- **No local S3 server (MinIO or similar).** Fewer moving parts, but uploads in the local app need a real R2 bucket and the network. Add an emulator if that becomes a problem.
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
- `allow_credentials` is on: the SPA sends the session cookie. So `CORS_ALLOW_ORIGIN` must match exactly one origin; a wide pattern would let other sites read answers with the cookie of the user.
- A request from another origin is not blocked: it gets no `Access-Control-Allow-Origin` header, and the browser hides the answer from the page. CORS is not access control. A program that is not a browser ignores it.
- Config reference: [NelmioCorsBundle](https://symfony.com/bundles/NelmioCorsBundle/current/index.html).

## Sign-in and cookies

Symfony Security does the sign-in (`config/packages/security.yaml`, [Symfony Security](https://symfony.com/doc/current/security.html)).

| Step      | What happens                                                                                                                                                                                                                                 |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sign-in   | `POST /api/login` with `{"email", "password"}`. The `json_login` authenticator checks the password hash and saves the user in the session ([json_login](https://symfony.com/doc/current/security.html#json-login))                           |
| Session   | The browser gets the session id in a cookie: `HttpOnly` (JavaScript cannot read it), `Secure` in production, `SameSite=Lax` ([session configuration](https://symfony.com/doc/current/session.html#configuration))                            |
| Remember  | A second cookie, `REMEMBERME`, signs the user in again when the session is gone. Signed with `APP_SECRET` and the password hash, 30 days, nothing in the database ([remember me](https://symfony.com/doc/current/security/remember_me.html)) |
| Sign-out  | `POST /api/logout` ends the session and clears both cookies                                                                                                                                                                                  |
| Who am I  | `GET /api/profile`: the user, or `null` for a guest                                                                                                                                                                                          |
| Passwords | Hashed with the `auto` hasher; at least 10 characters. The database never has a password                                                                                                                                                     |

Why a session cookie and not a token in `localStorage`: JavaScript cannot read an `HttpOnly` cookie, so a script that got into the page cannot steal the sign-in. The cost is the cookie rules of browsers, see below.

Why the remember-me cookie: the session files are on the disk of the container. A deploy or a restart deletes them, and a free Render service stops after 15 minutes without requests ([stack.md](stack.md#hosting)). Without the second cookie every parent would have to sign in again and again. The alternative, sessions in PostgreSQL ([Symfony: sessions in a database](https://symfony.com/doc/current/session.html#store-sessions-in-a-relational-database-mariadb-mysql-postgresql)), needs one more table.

### Production: one site for the SPA and the API

- Safari blocks all third-party cookies: "ITP by default blocks all third-party cookies" ([WebKit tracking prevention](https://webkit.org/tracking-prevention/)). A cookie is third-party when the page and the API are on different **sites**. A site is the registrable domain with all its subdomains (same page).
- `doremi.netlify.app` and `doremi.onrender.com` are two sites: on an iPhone the sign-in would not work. `app.example.com` and `api.example.com` are one site: the cookie works, also with `SameSite=Lax`.
- So before the first parents use the app, the SPA and the API need subdomains of one own domain. This is an open question in [roadmap.md](../roadmap.md#open-questions). Render makes TLS certificates for custom domains ([Render custom domains](https://render.com/docs/custom-domains)); its page lists the included domains for the paid plans only and does not say what a free service gets. The Netlify pages we read do not name plan limits for custom domains.
- Development has one origin (the Vite proxy), so the cookie always works. The local API uses HTTPS and marks the cookie `Secure`; the dev proxy removes this flag, because the page is plain HTTP ([vite.config.ts](../../packages/apps/doremi/apps-doremi/vite.config.ts)).
- Not tested in production: there is no deploy with sign-in yet.

### Behind the proxy of the host

Render ends HTTPS at its load balancer and sends plain HTTP to the container ([Render web services](https://render.com/docs/web-services)). Without more settings Symfony sees the IP address of the proxy as the client, and `http` as the scheme ([Symfony: proxies](https://symfony.com/doc/current/deployment/proxies.html)). Two things depend on it:

- The limits per IP address (below) would count all users as one.
- `cookie_secure: auto` would not set `Secure`. This is why production sets `cookie_secure: true` and `remember_me.secure: true` and does not depend on the proxy headers.

Set on Render: `SYMFONY_TRUSTED_PROXIES=REMOTE_ADDR` and `SYMFONY_TRUSTED_HEADERS=x-forwarded-for,x-forwarded-proto,x-forwarded-port`. Symfony reads both variables without a line in `framework.yaml` (they are the defaults of `framework.trusted_proxies` and `framework.trusted_headers` in `vendor/symfony/framework-bundle/DependencyInjection/Configuration.php`, version 8.1; the Symfony page names the variables but not this detail). `REMOTE_ADDR` trusts whoever connects, so it is right only when all traffic comes through the proxy of the host; the Symfony page says the same. The Render page does not list the headers that its proxy sends: check `X-Forwarded-For` on the first deploy.

### Access rules

Three layers, from wide to narrow:

1. `access_control` in `security.yaml`: everything under `/api/` needs a signed-in user, except health, sign-in, sign-out, profile, teacher sign-up and "accept invitation".
2. The role: `#[IsGranted('ROLE_TEACHER')]` on a controller.
3. The object: a voter in `src/Security/Voter/` answers "may this user do this with this Assignment, student or parent?" ([Symfony voters](https://symfony.com/doc/current/security/voters.html)). A teacher who asks for the Assignment of another teacher gets 403.

Lists never take an owner from the request: the repository gets the signed-in user.

### CSRF

A request that changes data must have `Content-Type: application/json`, also without a body (`src/EventListener/JsonBodySubscriber.php`). A page of another site cannot send this type without a CORS preflight ([MDN: simple requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS#simple_requests)), and the preflight allows only our SPA. `SameSite=Lax` on the cookies is the second protection.

### Limits

| What              | Limit                                                              | Where                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Failed sign-ins   | 5 per minute for one email and IP; 25 per minute for one IP        | `login_throttling` in `security.yaml` ([Symfony: limiting login attempts](https://symfony.com/doc/current/security.html#limiting-login-attempts)) |
| Teacher sign-ups  | 5 per hour for one IP                                              | `config/packages/rate_limiter.yaml`                                                                                                               |
| Invitation emails | 30 per hour for one teacher; 300 per day for all teachers together | `config/packages/rate_limiter.yaml`                                                                                                               |
| Upload URLs       | 60 per hour for one user                                           | `config/packages/rate_limiter.yaml`                                                                                                               |

`src/Security/Limiter.php` has one method per limit; a controller calls it before the work. Over a limit the answer is 429. The counters are in the cache of the app (files in the container), so a restart resets them. Names in the invitation email: the email goes to an address that a teacher types, and it has the names of the teacher and of the parent. A name is therefore only words of letters, with spaces, hyphens, apostrophes and a dot after a word, at most 80 characters (`src/Dto/PersonName.php`). A link or a web address does not fit this rule.

Known trade-offs, all of them because sign-up is open and has no confirmation email:

- Sign-up and "add parent" answer "this email already has an account". A person can find out this way if an email is known to the app. The time of a sign-in answer tells the same: the slow password check runs only for an account that exists and has a password.
- A person can sign up with the email address of somebody else, or add it as a parent. The real owner then cannot use this address, and gets an invitation from a stranger.
- The remember-me cookie cannot be taken back: a stolen cookie works for up to 30 days, until the password changes. The app has no "change password" and no "sign out everywhere" yet.

A confirmation email at sign-up, or sign-up approved by the app owner, closes the first two. It is an open question in [roadmap.md](../roadmap.md#open-questions).

## Requests and errors

- A controller gets the JSON body as a typed object: `#[MapRequestPayload]` fills a class of `src/Dto/` and checks its `#[Assert\...]` rules ([Symfony: mapping request payload](https://symfony.com/doc/current/controller.html#mapping-request-payload)). An invalid body never reaches the controller.
- Every error under `/api/` has one JSON shape, made by `src/EventListener/ApiExceptionSubscriber.php`:

```json
{
  "error": "validation_failed",
  "message": "Some fields are not valid.",
  "violations": [{ "field": "email", "message": "This value is not a valid email address." }]
}
```

- `error` is a stable code. The frontend shows its own translated text for a code (`ErrorAlert` in `apps-doremi-ui-layout`); `message` is English text for a developer.
- A rule of the product (the email is taken, the Assignment is completed) is a `RuleViolation` (`src/Exception/RuleViolation.php`) with its own code and status. An unexpected exception is 500 without details.
- The Assignment has a version column ([Doctrine: optimistic locking](https://www.doctrine-project.org/projects/doctrine-orm/en/current/reference/transactions-and-concurrency.html#optimistic-locking)). Two requests that change one Assignment at the same moment: the second one gets 409 `changed_meanwhile`. A review also sends the version that the teacher has on the screen; if the parent sent a new recording since then, the review gets the same 409 ([data-model.md](data-model.md#concurrent-changes)).

## Email

- Symfony Mailer sends the invitation ([Symfony Mailer](https://symfony.com/doc/current/mailer.html)). Without Symfony Messenger an email is sent at once, inside the request.
- Local: Docker starts [Mailpit](https://mailpit.axllent.org/), which catches every email. Open http://localhost:8025 to read them. No email leaves the computer. Another port: `MAILPIT_PORT`.
- Tests: emails are not sent; a test reads them with `getMailerMessage()`. `config/packages/mailer.yaml` sets `null://null` for the test environment. `.env.test` is not enough: local Docker sets `MAILER_DSN` as a real env var, and a real env var wins over the `.env` files. Without this line the tests pass only while Mailpit runs.
- Production: set `MAILER_DSN` of the provider on the host. The provider is an open question ([roadmap.md](../roadmap.md#open-questions)). `.env` has `null://null`: nothing is sent.
- The link in the email is `<APP_FRONTEND_URL>/set-password#token=...`. The token is in the fragment: a browser does not send a fragment to a server, so the token is not in the access log of the web host. The database has only the SHA-256 hash of the token; it works once and for 7 days.
- If the email cannot be sent, the parent account stays and the answer says `"invitationSent": false`: the teacher sends the invitation again.

## Env vars in production

| Variable                                                               | Where   | Note                                                              |
| ---------------------------------------------------------------------- | ------- | ----------------------------------------------------------------- |
| `APP_SECRET`                                                           | Render  | Since phase 1                                                     |
| `SERVER_NAME`                                                          | Render  | `:10000`, since phase 1 ([monorepo.md](monorepo.md#api-package))  |
| `DATABASE_URL`                                                         | Render  | Neon direct connection string, see above                          |
| `CORS_ALLOW_ORIGIN`                                                    | Render  | Regex of the one SPA origin                                       |
| `SYMFONY_TRUSTED_PROXIES`, `SYMFONY_TRUSTED_HEADERS`                   | Render  | See [Behind the proxy of the host](#behind-the-proxy-of-the-host) |
| `MAILER_DSN`, `MAILER_FROM`                                            | Render  | Email provider and the sender address                             |
| `APP_FRONTEND_URL`                                                     | Render  | Origin of the SPA, for the link in the invitation email           |
| `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Render  | From the R2 token                                                 |
| `VITE_API_BASE_URL`                                                    | Netlify | Origin of the API. Not a secret: it is in the browser bundle      |

Render gives the env vars of a service to the container at runtime, and also to the Docker build as build arguments ([Render Docker secrets](https://render.com/docs/docker-secrets)). Our `Dockerfile` reads none of them as `ARG`, so no secret is saved in an image layer. Keep it this way.

Netlify: set the variable in the UI (Project configuration → Environment variables); a change needs a new build ([Netlify environment variables](https://docs.netlify.com/build/environment-variables/overview/)).

Pre-deploy commands on Render are for paid services ([Render deploys](https://render.com/docs/deploys)), so the migrations run at container start.
