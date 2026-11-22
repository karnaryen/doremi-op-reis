# Roadmap

## Phases

| Phase                    | Goal                                 | Scope                                                                                                                                     |
| ------------------------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Monorepo              | One repository for frontend and API  | Nx monorepo                                                                                                                               |
| 2. Backend setup         | The API can save data and files      | Symfony backend, PostgreSQL database, Cloudflare R2                                                                                       |
| 3. Quality and structure | Code rules are checked automatically | PHPStan, ESLint, Prettier, module boundaries, apps structure and package boundaries, per-package dependencies with a pnpm catalog         |
| 4. MVP, part 1           | First loop: one full cycle works     | Teacher sign-up, parent invitation and deletion, sign-in, students, assign a piece, upload a recording, statuses, text feedback, complete |
| 5. MVP, part 2           | Teacher's time: review is fast       | "To review" in sequence, one Material for several students, Materials list in Profile, auto-deletion                                      |
| 6. Comfort               | Better contact                       | Voice feedback, email notifications, material library, music postcards                                                                    |

Features are described in [features.md](product/features.md). The MVP is phases 4 and 5.

## Open questions

- Teacher sign-up: open for everyone, or approved by the app owner.
- Email provider for invitations, for example AWS SES.
- A parent with children at two teachers: the email must be unique, so this needs a second email address or shared parent accounts.
- Production PHP host with a scheduler: choose before all families start.
- Maximum recording length and file size.
- Sheet music images: maximum number of pages, and whether HEIC photos from iPhones are converted to JPEG.
