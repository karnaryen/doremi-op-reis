# Roadmap

## Phases

| Phase             | Goal                 | Scope                                                                                           |
| ----------------- | -------------------- | ----------------------------------------------------------------------------------------------- |
| 1. First loop     | One full cycle works | Authentication, students, assign a piece, upload a recording, statuses, text feedback, complete |
| 2. Teacher's time | Review is fast       | "To review" in sequence, "Mark as viewed", one Material for several students, auto-deletion     |
| 3. Comfort        | Better contact       | Voice feedback, email notifications, material library, music postcards                          |

Features are described in [features.md](product/features.md).

## First step

Teacher creates an Assignment, parent sees it. No files and no storage yet. Entities: `User`, `Student`, `Assignment`. Materials, Submissions and Feedback follow.

## Open questions

- How parent accounts are created: invitation by the teacher or self sign-up.
- Production PHP host with a scheduler: choose before all families start.
- Maximum recording length and file size.
