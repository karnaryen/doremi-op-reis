# Architecture

## Components

```
React SPA (Netlify)
   │  REST / JSON
   ▼
Symfony API (PHP, Doctrine, Symfony Security)
   │                    │
   ▼                    ▼
PostgreSQL (Neon)    Object storage (S3)
users, materials,    PDF, audio, video
assignments,
feedback, file
metadata
```

- **React SPA:** one app, two interfaces (parent, teacher).
- **Symfony API:** the only backend. Authentication, access checks, Assignments, statuses, feedback, file access, deletion.
- **PostgreSQL:** structured data and file metadata. No media files.
- **Object storage:** private bucket for all files.

## Request flow

React → Controller → Service → Repository (Doctrine) → PostgreSQL → JSON → React

## Upload flow

Media files do not pass through Symfony.

1. The parent selects a video or audio file in the SPA.
2. The SPA asks Symfony for an upload URL.
3. Symfony checks that the parent may upload to this Assignment and returns a presigned upload URL.
4. The browser uploads the file directly to S3.
5. The SPA confirms the upload; Symfony checks the object in S3, saves the metadata and sets the Submission to `pending_review`.
6. Symfony deletes the previous file of the same type from S3.

If step 5 fails after a successful upload, the new object in S3 has no database record. The deletion job must find and remove such objects.

## Playback flow

The teacher or parent requests a file. Symfony checks access and returns a short-lived presigned download URL.

## Daily deletion job

A scheduler runs a Symfony console command once a day.

1. Find Assignments where `deleteAt` is in the past.
2. Delete the child's video and audio from S3.
3. Delete sheet music and audio examples if no other Assignment uses the Material.
4. Delete feedback and metadata from PostgreSQL.
5. If an S3 deletion fails, keep the record and retry on the next run.
