# Tech stack

The stack is the same as at my work. No Next.js, Tailwind, Firebase or Supabase.

| Layer            | Technology                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Frontend         | React SPA, TypeScript, Vite, MUI. Details: [README](../../README.md#stack)                |
| Server state     | TanStack Query                                                                            |
| Backend          | PHP, Symfony (REST API, JSON)                                                             |
| ORM              | Doctrine                                                                                  |
| Authentication   | Symfony Security                                                                          |
| Database         | PostgreSQL                                                                                |
| File storage     | AWS S3                                                                                    |
| Storage SDK      | `aws/aws-sdk-php`                                                                         |
| Email            | Symfony Mailer; provider is an open question ([roadmap.md](../roadmap.md#open-questions)) |
| Background jobs  | Symfony console command, run once a day by a scheduler                                    |
| Frontend hosting | Netlify                                                                                   |
| Backend hosting  | Render (test period); a paid always-on PHP host with a scheduler before launch            |
| Database hosting | Neon                                                                                      |

No Redux and no extra layers "for scalability".

## Hosting

Netlify does not run PHP. The SPA and the API are deployed separately:

- Netlify: React SPA.
- Render: Symfony in Docker. The free plan sleeps after 15 minutes without requests; start-up takes about one minute.
- Neon: PostgreSQL, free plan 1 GB per project. Enough because media files are not stored in the database.

The Netlify proxy has a 26-second timeout, so `/api/*` is not proxied to a sleeping Render service. The SPA calls the API directly, with CORS.

## File storage: AWS S3

**Decision:** AWS S3, because it is the storage at my work and a learning goal.

| Aspect           | AWS S3                                            |
| ---------------- | ------------------------------------------------- |
| Free use         | Start credits; Free Plan max. 6 months            |
| Download traffic | Paid above the free limits                        |
| Alternative      | Cloudflare R2: S3-compatible, permanent free plan |

R2 uses the same API and the same PHP SDK. If S3 costs become a problem, switching is a configuration change.

## Storage estimate

30 videos × 30 MB = 0.9 GB per week; 3.6 GB in 4 weeks; 7.2 GB in 8 weeks. Auto-deletion 30 days after completion keeps the total at this level.
