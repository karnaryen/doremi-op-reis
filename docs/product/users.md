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

A "Materials" tab comes with the material library in phase 3 ([roadmap.md](../roadmap.md)).

## Main flows

**Parent:** open a piece → download the sheet music and listen to the example → record and upload video or audio → read the feedback and continue.

**Teacher:** open "To review" → watch or listen to a recording → mark as viewed, leave feedback or ask to try again → complete the work (deleted after 30 days).

## Access rule

A role check is not enough. The backend must check that the requested object belongs to the user: a parent can open an Assignment only if the student is their child.
