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

- Teacher sign-up: open for everyone, or approved by the app owner. Since phase 4 it is open, with a limit of 5 sign-ups per hour for one IP address.
- One own domain for the SPA and the API (for example `app.` and `api.`), before the first parents use the app: Safari blocks the sign-in cookie between two different sites ([backend.md](tech/backend.md#production-one-site-for-the-spa-and-the-api)).
- Email provider for invitations, for example AWS SES.
- A parent with children at two teachers: the email must be unique, so this needs a second email address or shared parent accounts.
- Production PHP host with a scheduler: choose before all families start.
- Maximum recording length and file size. Since phase 4: video 200 MB, audio 30 MB, as a first choice ([backend.md](tech/backend.md#allowed-files)). With 200 MB videos the 10 GB of the R2 free plan hold fewer recordings than the estimate in [stack.md](tech/stack.md#storage-estimate) (30 MB per video).
- Sheet music images: maximum number of pages (since phase 4: 10), and whether HEIC photos from iPhones are converted to JPEG (now: not accepted).
- Objects in R2 without a database row (a failed deletion, an upload that was never confirmed) stay until the daily job of phase 5 exists. Until then: an R2 lifecycle rule that deletes `uploads/` after 1 day ([backend.md](tech/backend.md#signed-urls)).
- Privacy policy page and the legal basis ([privacy.md](product/privacy.md)): needed before the first real parents use the app. The upload screen already shows the notice for parents.
- From [mobile-design.md](product/mobile-design.md), not built in phase 4: the recording length in the "To review" list (the length of a recording is not stored), and recording audio inside the app (audio is a file from the phone; video can use the camera).
- Change password, "forgot password" and "sign out everywhere": not in the MVP list of [features.md](product/features.md). Without them a teacher who forgets the password cannot get in again.
