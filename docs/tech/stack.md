# Tech stack

| Layer            | Technology                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Frontend         | React SPA, TypeScript, Vite, MUI. Details: [README](../../README.md#stack)                |
| Server state     | TanStack Query                                                                            |
| Backend          | PHP, Symfony (REST API, JSON)                                                             |
| ORM              | Doctrine                                                                                  |
| Authentication   | Symfony Security                                                                          |
| Database         | PostgreSQL                                                                                |
| File storage     | Cloudflare R2 (S3-compatible API)                                                         |
| Storage SDK      | `aws/aws-sdk-php` with the R2 endpoint                                                    |
| Email            | Symfony Mailer; provider is an open question ([roadmap.md](../roadmap.md#open-questions)) |
| Background jobs  | Symfony console command, run once a day by a scheduler                                    |
| Frontend hosting | Netlify                                                                                   |
| Backend hosting  | Render (test period); a paid always-on PHP host with a scheduler before launch            |
| Database hosting | Neon                                                                                      |

No Redux and no extra layers "for scalability".

## Hosting

Netlify does not run PHP. The SPA and the API are deployed separately:

- Netlify: React SPA.
- Render: Symfony in Docker. A free web service spins down after 15 minutes without inbound traffic; the next request starts it again in about one minute. Source: [Render free instances](https://render.com/docs/free#spinning-down-on-idle).
  The same page lists no cron jobs among the free service types, so the daily job needs another host.
- Neon: PostgreSQL, free plan 1 GB storage per project (20 GB for the whole account). The page gives no end date for the free plan. Enough because media files are not stored in the database. Source: [Neon plans](https://neon.com/docs/introduction/plans#storage).

Netlify proxy rewrites time out after 26 seconds, so `/api/*` is not proxied to a sleeping Render service. The SPA calls the API directly, with CORS. Source: [Netlify rewrites and proxies](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/).

## File storage: Cloudflare R2

| Aspect           | Cloudflare R2                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Free use         | Each month: 10 GB-month storage, 1 million Class A and 10 million Class B operations. No end date given. Standard storage class only |
| Download traffic | Free (no egress fees)                                                                                                                |
| API              | S3-compatible: buckets, objects, presigned URLs                                                                                      |
| Access keys      | R2 API token (access key ID and secret access key)                                                                                   |
| Alternative      | AWS S3: the AWS free plan ends after 6 months or when the credits are used, whichever comes first; then paid                         |

R2 has the S3 API, so Symfony uses the AWS SDK for PHP with the R2 endpoint. Switching to S3 later is a configuration change.

R2 has no IAM. Access is controlled by API tokens with bucket-level permissions. The bucket is private; the browser gets files only through presigned URLs from Symfony. Presigned URLs work only on the R2 S3 API domain, not on a custom domain, and live at most 7 days. Source: [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/).

Class A operations are uploads and lists (for example `PutObject`); Class B are reads (for example `GetObject`). Deletes are free. Source: [R2 pricing](https://developers.cloudflare.com/r2/pricing/).

AWS free plan source: [AWS Free Tier](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier.html).

## Storage estimate

30 videos × 30 MB = 0.9 GB per week; 3.6 GB in 4 weeks; 7.2 GB in 8 weeks. Auto-deletion 30 days after completion keeps the total at this level, below the 10 GB of the R2 free plan.
