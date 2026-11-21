# Architecture

## Components

```
React SPA (Netlify)
   │  REST / JSON
   ▼
Symfony API (PHP, Doctrine, Symfony Security)
   │                    │                      │
   ▼                    ▼                      ▼
PostgreSQL (Neon)    Object storage (S3)    Email provider
users, materials,    PDF, images, audio,    invitations
assignments,         video
feedback, file
metadata
```

- **React SPA:** one app with public pages (homepage, sign-in, teacher sign-up, set password) and two interfaces (teacher, parent).
- **Symfony API:** the only backend. Accounts, invitations, authentication, access checks, Assignments, statuses, feedback, file access, deletion.
- **PostgreSQL:** structured data and file metadata. No media files.
- **Object storage:** private bucket for all files.
- **Email provider:** sends emails from Symfony Mailer.

## Request flow

React → Controller → Service → Repository (Doctrine) → PostgreSQL → JSON → React

## Parent invitation flow

1. The teacher sends the parent's name and email and the child's name.
2. Symfony checks that the email is not used, then creates the parent `User` without a password, the `Student` and an invitation token with an expiry date.
3. Symfony Mailer sends an email with a link to the set-password page of the SPA.
4. The parent sets a password. Symfony checks the token, saves the password hash and removes the token.
5. If the token has expired, the teacher sends the invitation again.

## Parent deletion flow

1. The teacher confirms the deletion.
2. Symfony checks that the parent belongs to this teacher.
3. One database transaction deletes the parent and their data ([data-model.md](data-model.md#ownership)).
4. After the commit, Symfony deletes the recordings from S3. Objects that fail to delete have no record; the daily job removes them.

## Upload flow

Media files do not pass through Symfony.

1. The parent selects a video or audio file in the SPA.
2. The SPA asks Symfony for an upload URL.
3. Symfony checks that the parent may upload to this Assignment and returns a presigned upload URL.
4. The browser uploads the file directly to S3.
5. The SPA confirms the upload; Symfony checks the object in S3, saves the metadata and sets the Submission to `pending_review`.
6. Symfony deletes the previous file of the same type from S3.

If step 5 fails after a successful upload, the new object in S3 has no database record. The deletion job must find and remove such objects.

If step 6 fails, the old object stays in S3 without a record. The same job removes it.

## Playback flow

The teacher or parent requests a file. Symfony checks access and returns a short-lived presigned download URL.

## Daily deletion job

A scheduler runs a Symfony console command once a day.

1. Find Assignments where `deleteAt` is in the past.
2. Delete the child's video and audio from S3.
3. Delete sheet music and audio examples if no other Assignment uses the Material.
4. Delete the `Assignment`, its `Submission`, `Feedback` and `MediaFile` rows from PostgreSQL.
5. If an S3 deletion fails, keep the record and retry on the next run.
6. Remove S3 objects without a database record (failed uploads and deletions).
