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

1. The signed-in teacher submits the "Add parent" form. The SPA sends `POST /api/parents` with the parent's name, the parent's email and the child's name.
2. Symfony validates the request body and checks that the email is unique. The teacher comes from the authenticated user, not from the request body.
3. In one database transaction Symfony creates:
   - the parent `User`: role parent, no password hash, `teacher` = the current teacher;
   - the `Student`, linked to this parent;
   - the hash of an invitation token with an expiry date (7 days). The token itself is only in the email.
4. When the transaction succeeds and all rows are saved in PostgreSQL, Symfony Mailer sends the parent an email. The email contains a link to the set-password page of the SPA, with the token in the URL fragment (`/set-password#token=...`). If the transaction fails, nothing is saved and no email is sent. If the email fails, the account stays and the answer says so.
5. The parent opens the link and enters a password. The SPA sends the token and the password: `POST /api/invitations/accept`.
6. Symfony checks that the token exists and has not expired. It saves the password hash and deletes the token. The parent is signed in at once.
7. If the token has expired or the email was not sent, the teacher resends the invitation: `POST /api/parents/{id}/invitation`. Symfony replaces the token and sends a new email.

## Parent deletion flow

1. The teacher confirms the deletion.
2. Symfony checks that the parent belongs to this teacher.
3. One database transaction deletes the parent and their data ([data-model.md](data-model.md#ownership)).
4. When the transaction succeeds and the rows are deleted from PostgreSQL, Symfony deletes the recordings from R2, and also the uploads of the family that were never confirmed (everything under `uploads/recordings/<assignment id>/`). Objects that fail to delete have no record; the daily job removes them.

## Upload flow

Media files do not pass through Symfony.

1. The parent selects a video or audio file in the SPA.
2. The SPA asks Symfony for an upload URL: `POST /api/assignments/{id}/recordings/upload-url` with the kind, the type and the size of the file.
3. Symfony checks that the parent may upload to this Assignment and that the type and the size are allowed, and returns a presigned upload URL for a temporary key and an upload id.
4. The browser uploads the file directly to R2.
5. The SPA confirms the upload: `POST /api/assignments/{id}/recordings` with the upload id. Symfony copies the object to its final key and checks the copy ([backend.md](backend.md#signed-urls)), creates the `Submission` if this is the first upload, saves the metadata and sets the Submission to `pending_review`.
6. Symfony deletes the temporary object and the previous file of the same kind from R2.

If step 5 fails after the copy, Symfony deletes the copy. An upload that is never confirmed stays in R2 under `uploads/` without a row. The deletion job must find and remove such objects.

The files of a piece (sheet music, audio example) take the same path: `POST /api/material-uploads` gives the URL, and `POST /api/assignments` gets the upload ids and saves the `Material`, its files and the `Assignment` in one transaction.

If step 6 fails, the old object stays in R2 without a record. The same job removes it.

## Material deletion flow

1. The teacher deletes a Material in the Materials list and confirms.
2. Symfony checks that the Material belongs to this teacher and that no Assignment uses it.
3. One database transaction deletes the `Material` and its `MaterialFile` rows.
4. When the transaction succeeds, Symfony deletes the files from R2. Objects that fail to delete have no record; the daily job removes them.

## Playback flow

The teacher or parent requests a file: `GET /api/assignments/{id}/recordings/{kind}/url` or `GET /api/assignments/{id}/material-files/{fileId}/url`. Symfony checks access to the Assignment and returns a presigned download URL that lives one hour. The SPA asks for a new one after 45 minutes.

## Review flow

1. The teacher opens an Assignment, plays the recording and writes feedback.
2. The SPA sends `POST /api/assignments/{id}/review` with the feedback and the action: `complete` or `try_again`.
3. Symfony checks that the Assignment belongs to a student of this teacher, saves the `Feedback` (it replaces the old one) and sets the statuses: `try_again` needs a recording that waits for review; `complete` sets `completedAt` and `deleteAt` = `completedAt` + 30 days.
4. The request also has the `version` of the Assignment that the teacher has on the screen. If the parent sent a new recording after the teacher opened the screen, or at the same moment, the answer is 409 and nothing is saved: the feedback was written for a recording that is not the latest one. The SPA loads the Assignment again ([data-model.md](data-model.md#concurrent-changes)).

## API endpoints

All paths start with `/api`. "Teacher" and "parent" mean the signed-in role; the object check is in [backend.md](backend.md#access-rules).

| Method and path                                     | Who                              | What                                                                                |
| --------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------- |
| `GET /health`                                       | everyone                         | Does the PHP process answer?                                                        |
| `POST /teachers`                                    | guest                            | Teacher sign-up; signs in                                                           |
| `POST /login`, `POST /logout`                       | everyone                         | Sign-in, sign-out                                                                   |
| `GET /profile`                                      | everyone                         | The signed-in user, or `null`                                                       |
| `POST /invitations/accept`                          | guest                            | A parent sets a password with the token; signs in                                   |
| `GET /students`, `GET /students/{id}`               | teacher (own students)           | The list; one student with all Assignments                                          |
| `POST /parents`                                     | teacher                          | Add a parent with a child; sends the invitation                                     |
| `POST /parents/{id}/invitation`                     | teacher (own parent)             | Send the invitation again                                                           |
| `DELETE /parents/{id}`                              | teacher (own parent)             | Delete the parent and the data of the family                                        |
| `GET /assignments?filter=`                          | teacher, parent                  | A tab of "Main": `to_review` (teacher), `active`, `completed`; another value is 400 |
| `POST /material-uploads`                            | teacher                          | An upload URL for sheet music or an audio example                                   |
| `POST /assignments`                                 | teacher (own student)            | Assign a piece                                                                      |
| `GET /assignments/{id}`                             | teacher or parent of the student | The piece card                                                                      |
| `POST /assignments/{id}/review`                     | teacher of the student           | Feedback with "Complete" or "Ask to try again"                                      |
| `POST /assignments/{id}/recordings/upload-url`      | parent of the student            | An upload URL for a video or an audio recording                                     |
| `POST /assignments/{id}/recordings`                 | parent of the student            | Confirm the upload                                                                  |
| `GET /assignments/{id}/recordings/{kind}/url`       | teacher or parent of the student | A link to play the recording                                                        |
| `GET /assignments/{id}/material-files/{fileId}/url` | teacher or parent of the student | A link to open a file of the piece                                                  |

Not built yet (phase 5): the Materials list, one Material for several students, review in sequence, the daily deletion job.

## Daily deletion job

Roadmap phase 5. A scheduler runs a Symfony console command once a day.

1. Find Assignments where `deleteAt` is in the past.
2. Delete the child's video and audio from R2.
3. Delete the `Assignment`, its `Submission`, `Feedback` and `Recording` rows from PostgreSQL. The `Material` and its files are kept.
4. If an R2 deletion fails, keep the record and retry on the next run.
5. Remove R2 objects without a database record (failed uploads and deletions).
