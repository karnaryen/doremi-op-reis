# Roadmap

## Phases

| Phase             | Goal                 | Scope                                                                                                                                     |
| ----------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1. First loop     | One full cycle works | Teacher sign-up, parent invitation and deletion, sign-in, students, assign a piece, upload a recording, statuses, text feedback, complete |
| 2. Teacher's time | Review is fast       | "To review" in sequence, "Mark as viewed", one Material for several students, auto-deletion                                               |
| 3. Comfort        | Better contact       | Voice feedback, email notifications, material library, music postcards                                                                    |

Features are described in [features.md](product/features.md).

## Before phase 1

Test the format with the teacher and 2–3 families on a few pieces in a row. Then build the full app.

## First step

Teacher signs up, adds a parent, creates an Assignment; the parent sees it. No files and no storage yet. Entities: `User`, `Student`, `Assignment`. Materials, Submissions and Feedback follow.

## Open questions

- Teacher sign-up: open for everyone, or approved by the app owner.
- Email provider for invitations, for example AWS SES.
- A parent with children at two teachers: the email must be unique, so this needs a second email address or shared parent accounts.
- Production PHP host with a scheduler: choose before all families start.
- Maximum recording length and file size.
- Sheet music images: maximum number of pages, and whether HEIC photos from iPhones are converted to JPEG.
- Material library (phase 3): the deletion job removes a Material that no Assignment uses. With a library the teacher wants to keep it. Decide when a library Material is deleted.
