# Users and roles

Several teachers use the app. Each teacher works only with their own parents and students.

Signed-in users get one of two interfaces: teacher or parent. See [Navigation](#navigation).

## Guest

A visitor who is not signed in. Sees the homepage, which explains the app, the sign-in page and the teacher sign-up page.

## Teacher

- Creates an own account with the sign-up form.
- Creates and deletes parent accounts (see [account rules](#account-rules)).
- Sees only own students, their Assignments and recordings.
- Uses the app from a phone, from any country.

## Parent

- Gets the account from the teacher. There is no self sign-up for parents.
- Belongs to one teacher. In the MVP one parent account has one child. Children have no own accounts.
- Sees only the Assignments of their own child.
- The only role that can upload recordings.

Each piece card shows three texts. An empty text is not shown.

- **From the teacher, general instruction:** the same for all students with this piece.
- **From the teacher, personal instruction:** for this child only.
- **For parents:** how to help without music education (the parent hint).

## Navigation

- **Section:** an item in the bottom navigation bar.
- **Tab:** a tab inside a section.

| Role    | Sections                | Tabs in Main                 |
| ------- | ----------------------- | ---------------------------- |
| Guest   | Home, Profile           | —                            |
| Parent  | Main, Profile           | Active, Completed            |
| Teacher | Main, Students, Profile | To review, Active, Completed |

A signed-in user does not see the Home section: Main takes its place.

### Tabs in Main

| Tab       | Parent                                                                 | Teacher                                                  |
| --------- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| To review | —                                                                      | New recordings of own students, viewed one after another |
| Active    | The child's active Assignments with their status; upload of recordings | Active Assignments of own students                       |
| Completed | Completed Assignments with the teacher's feedback, until deletion      | Completed Assignments of own students, until deletion    |

### Other sections

- **Students** (teacher): own students with their parents; add and delete parents; one screen per student with all Assignments; assign new pieces.
- **Profile** (both roles): language, sign-out. For the teacher also the Materials list: all own Materials, upload and delete.

## Account rules

| Action                   | Result                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Teacher signs up         | A teacher account is created.                                                                                          |
| Teacher adds a parent    | The parent account and the child are created. The parent gets an invitation email and sets a password.                 |
| Teacher deletes a parent | The parent account, the child, Assignments, recordings and feedback are deleted at once. The teacher's Materials stay. |

## Main flows

**Teacher (start):** sign up → add a parent with the child's name → the parent accepts the invitation → assign pieces.

**Parent:** open a piece → download the sheet music and listen to the example → record and upload video or audio → read the feedback and continue.

**Teacher (daily):** open the "To review" tab → watch or listen to a recording → write feedback → complete the work (deleted after 30 days) or ask to try again.

## Access rule

A role check is not enough. The backend checks that the requested object belongs to the user:

- a parent opens an Assignment only if the student is their child;
- a teacher opens a parent, student, Assignment or Material only if it belongs to this teacher.
