# Tech stack

The stack is the same as at my work. No Next.js, Tailwind, Firebase or Supabase.

| Layer            | Technology                                                                     |
| ---------------- | ------------------------------------------------------------------------------ |
| Frontend         | React SPA, TypeScript, Vite, MUI. Details: [README](../../README.md#stack)     |
| Server state     | TanStack Query                                                                 |
| Backend          | PHP, Symfony (REST API, JSON)                                                  |
| ORM              | Doctrine                                                                       |
| Authentication   | Symfony Security                                                               |
| Database         | PostgreSQL                                                                     |
| File storage     | Cloudflare R2 (S3-compatible API)                                              |
| Storage SDK      | `aws/aws-sdk-php`                                                              |
| Background jobs  | Symfony console command, run once a day by a scheduler                         |
| Frontend hosting | Netlify                                                                        |
| Backend hosting  | Render (test period); a paid always-on PHP host with a scheduler before launch |
| Database hosting | Neon                                                                           |

No Redux and no extra layers "for scalability".

## Hosting

Netlify does not run PHP. The SPA and the API are deployed separately:

- Netlify: React SPA.
- Render: Symfony in Docker. The free plan sleeps after 15 minutes without requests; start-up takes about one minute.
- Neon: PostgreSQL, free plan 1 GB per project. Enough because media files are not stored in the database.

The Netlify proxy has a 26-second timeout, so `/api/*` is not proxied to a sleeping Render service. The SPA calls the API directly, with CORS.

## File storage: R2 or S3

Both are object storage with the same API. The same PHP SDK works with both; only the configuration changes.

|                  | Cloudflare R2              | AWS S3                                 |
| ---------------- | -------------------------- | -------------------------------------- |
| Free storage     | 10 GB-month, no time limit | Start credits; Free Plan max. 6 months |
| Download traffic | Free                       | Paid above limits                      |

**Decision:** R2. Switching to S3 is a configuration change.

## Storage estimate

30 videos × 30 MB = 0.9 GB per week; 3.6 GB in 4 weeks; 7.2 GB in 8 weeks. Auto-deletion 30 days after completion keeps the total under the 10 GB R2 limit.
