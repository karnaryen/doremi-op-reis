# Data model

Material and Assignment are separate entities. Example: one minuet is assigned to five students. One Assignment is completed, four continue. The sheet music is stored once and is not deleted with the completed Assignment.

## Entities

| Entity         | Fields and purpose                                                                                                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`         | Teacher or parent. Name, email, password hash, role. A parent has a `teacher` link to the teacher who created the account, and an invitation token with expiry until the password is set. |
| `Student`      | A child. Linked to one parent `User`; in the MVP a unique constraint allows one Student per parent.                                                                                       |
| `Material`     | Belongs to one teacher `User`. Title, general instruction, sheet music and audio example (`MaterialFile`).                                                                                |
| `Assignment`   | Links `Student` and `Material`. Individual instruction, parent hint, `status`, `completedAt`, `deleteAt`.                                                                                 |
| `Submission`   | Belongs to one `Assignment`. Max. one video and one audio (`Recording`), `status`.                                                                                                        |
| `Feedback`     | Belongs to one `Assignment`. Latest text, or a "viewed" mark. A new one replaces the old one.                                                                                             |
| `MaterialFile` | Sheet music page or audio example of a `Material`. Metadata of an object in S3.                                                                                                           |
| `Recording`    | Video or audio of a `Submission`. Metadata of an object in S3.                                                                                                                            |

## Relations

```
User (teacher) 1 ── * User (parent)
User (teacher) 1 ── * Material
User (parent) 1 ── * Student 1 ── * Assignment * ── 1 Material
                                       │ 1
                                       ├── 0..1 Submission ── 0..2 Recording (max. one video, one audio)
                                       └── 0..1 Feedback
Material 1 ── 0..* MaterialFile (sheet music: one PDF or several images; one audio example)
```

## Ownership

A teacher owns: parents with `teacher` = this teacher, their students and Assignments, and Materials with `teacher` = this teacher. Access checks use these links ([users.md](../product/users.md#access-rule)).

Deleting a parent deletes their students, Assignments, Submissions, Feedback and `Recording` rows. Materials are not deleted.

## Status fields

Two simple fields instead of one complex workflow.

| Field               | Values                                        |
| ------------------- | --------------------------------------------- |
| `Assignment.status` | `active`, `completed`                         |
| `Submission.status` | `not_submitted`, `pending_review`, `reviewed` |

Mapping to the UI statuses from [assignment-lifecycle.md](../product/assignment-lifecycle.md):

| UI status   | Fields                                                                    |
| ----------- | ------------------------------------------------------------------------- |
| In progress | `active` + `not_submitted`, or `active` + `reviewed` with a "viewed" mark |
| Sent        | `active` + `pending_review`                                               |
| Try again   | `active` + `reviewed` with text feedback                                  |
| Completed   | `completed`                                                               |

"Try again" is a result of feedback, not a stored value.

## Dates

- `completedAt`: set when the teacher completes the Assignment.
- `deleteAt` = `completedAt` + 30 days. The deletion job reads this field.

## Media files

Files are in S3. PostgreSQL stores only their metadata. Symfony uses these rows for access checks and creates presigned URLs from `objectKey`.

Material files and recordings are two tables, because they differ in almost everything:

|                | `MaterialFile`                                                    | `Recording`                                                   |
| -------------- | ----------------------------------------------------------------- | ------------------------------------------------------------- |
| Owner          | `Material`                                                        | `Submission`                                                  |
| Who has access | The teacher and every parent with an Assignment for this Material | The teacher and the parent of this Assignment                 |
| Lifecycle      | Kept while an Assignment uses the Material                        | Deleted 30 days after the Assignment is completed             |
| Rules          | PDF or images, page order, max. one audio example                 | Max. one video and one audio, a new file replaces the old one |

With one table, every check and query would first ask which owner is set.

### Shared fields

Both entities have the same S3 fields: `objectKey`, MIME type, size, upload date. They are in one Doctrine `#[Embeddable]` class, `StoredObject`, so the code is not repeated. In the table these are normal columns.

### MaterialFile

| Column        | Values                         | Purpose                                     |
| ------------- | ------------------------------ | ------------------------------------------- |
| `material_id` | not null                       | Foreign key, `ON DELETE CASCADE`            |
| `purpose`     | `sheet_music`, `audio_example` | What the file is in the Material            |
| `position`    | 1, 2, 3 …                      | Page order of sheet music images; else null |

S3 key prefix: `materials/`.

### Recording

| Column          | Values           | Purpose                          |
| --------------- | ---------------- | -------------------------------- |
| `submission_id` | not null         | Foreign key, `ON DELETE CASCADE` |
| `kind`          | `video`, `audio` | Type of the recording            |

S3 key prefix: `recordings/`.

### Rules in the database

- `UNIQUE (submission_id, kind)`: a Submission has max. one video and one audio.
- Partial unique index `UNIQUE (material_id) WHERE purpose = 'audio_example'`: a Material has max. one audio example.
- Each row has exactly one owner, because the foreign key is not null. No nullable keys and no `CHECK` for the owner.
- Deleting a `Submission` or `Material` row deletes its file rows (`ON DELETE CASCADE`). The S3 objects are deleted by Symfony or by the daily job.

### Rules in the service

The Symfony service checks these rules on upload:

- Sheet music is one PDF **or** one or more images, not both.
- A new recording replaces the old one of the same kind ([assignment-lifecycle.md](../product/assignment-lifecycle.md#replacing-a-recording)). The old S3 object is deleted after the new row is saved.

### Rejected alternatives

- **One `MediaFile` table with two nullable foreign keys** (`material_id`, `submission_id`) and a `CHECK` that exactly one is set. Works, but every access check, deletion and upload rule must branch on the owner, and the `CHECK` does not stop wrong combinations such as a `sheet_music` file on a Submission.
- **`owner_type` + `owner_id` columns.** No real foreign key, so PostgreSQL cannot protect the data or cascade deletes.
- **Doctrine inheritance mapping.** Too complex for two entities.
