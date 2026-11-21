# Architecture

## Components

```
React SPA (Netlify)
   │  REST / JSON
   ▼
Symfony API (PHP, Doctrine, Symfony Security)
   │                    │                      │
   ▼                    ▼                      ▼
PostgreSQL (Neon)    Object storage (R2)    Email provider
users, materials,    PDF, images, audio,    invitations
assignments,         video
feedback, file
metadata
```

- **React SPA:** one app with public pages (homepage, sign-in, teacher sign-up, set password) and two interfaces (teacher, parent).
- **Symfony API:** the only backend. Accounts, invitations, authentication, access checks, Assignments, statuses, feedback, file access, deletion.
- **PostgreSQL:** structured data and file metadata. No media files.
- **Object storage:** Cloudflare R2, private bucket for all files.
- **Email provider:** sends emails from Symfony Mailer.

## Request flow

React → Controller → Service → Repository (Doctrine) → PostgreSQL → JSON → React

## Parent invitation flow

1. The signed-in teacher submits the "Add parent" form. The SPA sends a request, for example `POST /api/parents`, with the parent's name, the parent's email and the child's name.
2. Symfony validates the request body and checks that the email is unique. The teacher comes from the authenticated user, not from the request body.
3. In one database transaction Symfony creates:
   - the parent `User`: role parent, no password hash, `teacher` = the current teacher;
   - the `Student`, linked to this parent;
   - an invitation token with an expiry date.
4. When the transaction succeeds and all rows are saved in PostgreSQL, Symfony Mailer sends the parent an email. The email contains a link to the set-password page of the SPA, with the token in the URL. If the transaction fails, nothing is saved and no email is sent.
5. The parent opens the link and enters a password. The SPA sends the token and the password, for example `POST /api/invitations/accept`.
6. Symfony checks that the token exists and has not expired. It saves the password hash and deletes the token. The parent can now sign in.
7. If the token has expired or the email was not sent, the teacher resends the invitation, for example `POST /api/parents/{id}/invitation`. Symfony replaces the token and sends a new email.

## Parent deletion flow

1. The teacher confirms the deletion.
2. Symfony checks that the parent belongs to this teacher.
3. One database transaction deletes the parent and their data ([data-model.md](data-model.md#ownership)).
4. When the transaction succeeds and the rows are deleted from PostgreSQL, Symfony deletes the recordings from R2. Objects that fail to delete have no record; the daily job removes them.

## Upload flow

Media files do not pass through Symfony.

1. The parent selects a video or audio file in the SPA.
2. The SPA asks Symfony for an upload URL.
3. Symfony checks that the parent may upload to this Assignment and returns a presigned upload URL.
4. The browser uploads the file directly to R2.
5. The SPA confirms the upload; Symfony checks the object in R2, creates the `Submission` if this is the first upload, saves the metadata and sets the Submission to `pending_review`.
6. Symfony deletes the previous file of the same type from R2.

If step 5 fails after a successful upload, the new object in R2 has no `Recording` row. The deletion job must find and remove such objects.

If step 6 fails, the old object stays in R2 without a record. The same job removes it.

## Material deletion flow

1. The teacher deletes a Material in the Materials list and confirms.
2. Symfony checks that the Material belongs to this teacher and that no Assignment uses it.
3. One database transaction deletes the `Material` and its `MaterialFile` rows.
4. When the transaction succeeds, Symfony deletes the files from R2. Objects that fail to delete have no record; the daily job removes them.

## Playback flow

The teacher or parent requests a file. Symfony checks access and returns a short-lived presigned download URL.

## Daily deletion job

A scheduler runs a Symfony console command once a day.

1. Find Assignments where `deleteAt` is in the past.
2. Delete the child's video and audio from R2.
3. Delete the `Assignment`, its `Submission`, `Feedback` and `Recording` rows from PostgreSQL. The `Material` and its files are kept.
4. If an R2 deletion fails, keep the record and retry on the next run.
5. Remove R2 objects without a database record (failed uploads and deletions).
