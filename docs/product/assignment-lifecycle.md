# Assignment lifecycle

## Statuses in the UI

| Status      | Meaning                                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| In progress | The parent has the materials; the child practises.                                                                                                                  |
| Sent        | The parent uploaded a recording; it waits for review.                                                                                                               |
| Try again   | The teacher left feedback and asked to try again; the child continues and can send a new recording. Optional step: the teacher can complete after the first review. |
| Completed   | The teacher finished the work. Deletion follows after 30 days.                                                                                                      |

The parent's Main section has two tabs: "Active" (statuses In progress, Sent, Try again) and "Completed". The word "archive" is not used.

In the database these statuses come from two separate fields (Assignment status and Submission status). See [data-model.md](../tech/data-model.md#status-fields).

## Storage rule: latest only

An Assignment keeps:

- one video: the latest;
- one audio: the latest;
- one feedback: the latest;
- the Material and the teacher's instructions (general and personal).

| Event                    | Result                                               |
| ------------------------ | ---------------------------------------------------- |
| First video uploaded     | Video is saved.                                      |
| New video uploaded       | It replaces the previous video.                      |
| Audio uploaded           | Saved next to the video.                             |
| New feedback             | It replaces the previous feedback.                   |
| Teacher completes        | Assignment moves to "Completed".                     |
| 30 days after completion | Assignment, its recordings and comments are deleted. |

## Replacing a recording

1. The parent uploads a new video.
2. The previous video is deleted **only after** the new upload succeeds. If the upload fails, the previous video stays.
3. The audio is not changed.
4. The status becomes "Sent".
5. The previous feedback stays visible with the label "Advice for the previous attempt" until the teacher writes new feedback.

## Completion and deletion

- The 30 days start when the teacher presses "Complete", not at assignment or upload time.
- Deletion removes the Assignment for both roles at the same moment.
- The Material (sheet music, audio example, general instruction) is not deleted with the Assignment. It stays in the teacher's Materials list until the teacher deletes it.
- Files a parent has already downloaded to their device are out of the app's control.

Technical steps are in [architecture.md](../tech/architecture.md#daily-deletion-job).
