# Features

## MVP

| Feature            | Description                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sign-in            | Email-based account for parents and the teacher.                                                                                                             |
| Students           | The teacher manages students; each student is linked to a parent.                                                                                            |
| Assign a piece     | The teacher selects a student, enters a title and instruction, adds sheet music (PDF) and an audio example. One student can have several active Assignments. |
| Reuse a Material   | One Material is assigned to several students; each Assignment has its own notes.                                                                             |
| Download materials | "Download PDF" opens the file; the phone's share menu handles printing or sending by email.                                                                  |
| Upload a recording | Video or audio, or both. Native file picker or camera, progress bar, retry on error, confirmation.                                                           |
| Review             | The teacher plays a recording and chooses "Mark as viewed" or "Leave feedback". Both actions are equal; feedback is not required.                            |
| Review in sequence | The teacher goes from one new recording to the next without returning to the list.                                                                           |
| Complete           | The teacher completes an Assignment. It moves to "Completed".                                                                                                |
| Auto-deletion      | Completed Assignments are deleted after 30 days. See [assignment-lifecycle.md](assignment-lifecycle.md).                                                     |

Status rules and recording replacement are in [assignment-lifecycle.md](assignment-lifecycle.md).

## Languages

- All UI text is available in English and Dutch.
- The language switcher is in the profile settings, for both roles.
- Default language: the browser language if it is English or Dutch, otherwise English.
- Content written by the teacher (instructions, feedback) is not translated.

## UX rules

- A sent recording does not create a duty for the teacher to answer quickly. Parents see no red warnings.
- On the piece card, the task for home is more important than the title.
- Feedback is a text field on the Assignment, not a chat thread.
- Assigning a piece on a phone uses a full screen, not a small dialog.
- Completed Assignments show: "This work will be deleted in 30 days. Save the materials you need."
- Recording length is limited. Audio is a full alternative to video.

## Workload estimate

30 recordings per week × 3 minutes = 90 minutes of review. With three times more recordings it is 4.5 hours. This is why "Mark as viewed" exists.

## Later

| Phase | Feature                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 3     | Short voice feedback.                                                                                                                       |
| 3     | Email notifications: new Assignment, new feedback.                                                                                          |
| 3     | Material library: search and reuse with an individual goal.                                                                                 |
| 3     | Music postcards: an optional message from the teacher's travels to all students (text, place, small task). Not homework, not a social feed. |
| —     | Practice mood on upload: "It went well", "It was difficult", "Need help".                                                                   |
| —     | Timestamp comments: feedback linked to a second of the recording. Only if one comment per recording is not enough.                          |

Phases are defined in [roadmap.md](../roadmap.md).
