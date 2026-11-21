# Users and roles

One app with two interfaces. Settings and profile open from an icon in the top bar.

## Parent

- Signs in with email. Children have no own accounts.
- Sees only the Assignments of their own children.
- The only role that can upload recordings.

| Tab         | Content                                                           |
| ----------- | ----------------------------------------------------------------- |
| In progress | Active Assignments, upload of recordings                          |
| Completed   | Completed Assignments with the teacher's feedback, until deletion |

Each piece card shows two texts:

- **From the teacher:** the musical goal.
- **For parents:** how to help without music education (the parent hint).

## Teacher

- Uses the app from a phone, from any country.
- Sees all students.

| Tab       | Content                                                                       |
| --------- | ----------------------------------------------------------------------------- |
| To review | New recordings of all students, viewed one after another                      |
| Students  | One screen per child with all their Assignments; assigns new pieces from here |
| Materials | Sheet music and audio examples that can be given to several children          |

## Access rule

A role check is not enough. The backend must check that the requested object belongs to the user: a parent can open an Assignment only if the student is their child.
