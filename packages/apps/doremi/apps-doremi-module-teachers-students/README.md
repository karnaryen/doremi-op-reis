# apps-doremi-module-teachers-students

Section "Students" of the teacher ([users.md](../../../../docs/product/users.md#other-sections)):

| Route              | Screen                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `students.list`    | The own students with their parents, "Add parent"                                              |
| `students.add`     | Parent's name and email, child's name; sends the invitation                                    |
| `students.student` | One student: all Assignments with their status, "Assign a piece", a link to the parent         |
| `students.parent`  | The parent account: name, email, invitation status, "Send invitation again", "Delete parent"   |
| `students.assign`  | Assign a piece: title, instructions, parent hint, sheet music (a PDF or photos), audio example |

In the MVP one parent account has one child, so the URLs of the parent screen and of the assign form use the id of the student.

"One Material for several students" comes in roadmap phase 5: here a piece is assigned to one student.

Only a teacher may open these routes; the access rule is in the route table, and the API checks every request.
