# Data model

Material and Assignment are separate entities. Example: one minuet is assigned to five students. One Assignment is completed, four continue. The sheet music is stored once and is not deleted with the completed Assignment.

## Entities

| Entity       | Fields and purpose                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| `User`       | Teacher or parent. Email, role.                                                                           |
| `Student`    | A child. Linked to one parent `User`.                                                                     |
| `Material`   | Title, general instruction, sheet music and audio example (`MediaFile`).                                  |
| `Assignment` | Links `Student` and `Material`. Individual instruction, parent hint, `status`, `completedAt`, `deleteAt`. |
| `Submission` | Belongs to one `Assignment`. Max. one video and one audio (`MediaFile`), `status`.                        |
| `Feedback`   | Belongs to one `Assignment`. Latest text, or a "viewed" mark. A new one replaces the old one.             |
| `MediaFile`  | Metadata of a file in R2: object key, type (PDF, audio, video), MIME type, size, upload date.             |

## Relations

```
User (parent) 1 ── * Student 1 ── * Assignment * ── 1 Material
                                       │ 1
                                       ├── 0..1 Submission ── 0..2 MediaFile
                                       └── 0..1 Feedback
Material ── 0..2 MediaFile (PDF, audio example)
```

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
