# Features

## MVP

| Feature            | Description                                                                                                                                                                                                                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Teacher sign-up    | A teacher creates an account from the homepage.                                                                                                                                                                                                                                                                                    |
| Parent accounts    | The teacher adds a parent with the child's name; the parent gets an invitation email and sets a password. The teacher can delete a parent. See [users.md](users.md#account-rules).                                                                                                                                                 |
| Sign-in            | Email and password for teachers and parents.                                                                                                                                                                                                                                                                                       |
| Students           | The teacher manages own students; each student is linked to a parent.                                                                                                                                                                                                                                                              |
| Assign a piece     | The teacher selects a student, enters a title, a general instruction (for all students), a personal instruction (for this student) and a parent hint, adds sheet music (a PDF, image files or photos from the phone camera) and an audio example. Both instructions are optional. One student can have several active Assignments. |
| Reuse a Material   | The teacher selects several students in the assign form. Each student gets an own Assignment with an own personal instruction and parent hint; the general instruction and the files are stored once.                                                                                                                              |
| Download materials | "Download" opens the sheet music file; the phone's share menu handles printing or sending by email.                                                                                                                                                                                                                                |
| Upload a recording | Video or audio, or both. Native file picker or camera, progress bar, retry on error, confirmation.                                                                                                                                                                                                                                 |
| Review             | The teacher plays a recording and chooses "Complete" or "Ask to try again". Both actions are equal; text feedback is required for both. After "Ask to try again" the status becomes "Try again".                                                                                                                                   |
| Review in sequence | The teacher goes from one new recording to the next without returning to the list.                                                                                                                                                                                                                                                 |
| Complete           | The teacher completes an Assignment from the review screen or the student screen. It moves to "Completed".                                                                                                                                                                                                                         |
| Materials list     | In the Profile section the teacher sees all own Materials, uploads new ones and deletes them. A Material that an Assignment uses cannot be deleted. Materials are not deleted with Assignments.                                                                                                                                    |
| Auto-deletion      | Completed Assignments are deleted after 30 days. See [assignment-lifecycle.md](assignment-lifecycle.md).                                                                                                                                                                                                                           |

Status rules and recording replacement are in [assignment-lifecycle.md](assignment-lifecycle.md).

## Languages

- All UI text is available in English and Dutch.
- The language switcher is in the Profile section, for teachers and parents.
- Default language: the browser language if it is English or Dutch, otherwise English.
- Content written by the teacher (instructions, feedback) is not translated.

## UX rules

- A sent recording does not create a duty for the teacher to answer quickly. Parents see no red warnings.
- On the piece card, the teacher's task (what to practise at home) is shown prominently. The title alone does not tell the parent what to do.
- Feedback is a text field on the Assignment, not a chat thread.
- Completed Assignments show the day of deletion (30 days after completion): "This work will be deleted on 22 December 2026. Save the materials you need."
- Recording length is limited. Audio is a full alternative to video.

## Workload estimate

30 recordings per week × 3 minutes = 90 minutes of review. With three times more recordings it is 4.5 hours. This is why review in sequence exists: the review must be fast.

## Later

| Phase | Feature                                                                                                                                         |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 6     | Short voice feedback.                                                                                                                           |
| 6     | Email notifications: new Assignment, new feedback.                                                                                              |
| 6     | Material library: search in the Materials list.                                                                                                 |
| 6     | Music postcards: an optional message from the teacher's travels to all own students (text, place, small task). Not homework, not a social feed. |
| —     | Several children per parent: the Main header shows the child's name; tapping it switches to another child.                                      |
| —     | Practice mood on upload: "It went well", "It was difficult", "Need help".                                                                       |
| —     | Timestamp comments: feedback linked to a second of the recording. Only if one comment per recording is not enough.                              |

Phases are defined in [roadmap.md](../roadmap.md).
