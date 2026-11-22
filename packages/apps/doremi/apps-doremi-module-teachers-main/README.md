# apps-doremi-module-teachers-main

Section "Main" of the teacher ([users.md](../../../../docs/product/users.md#tabs-in-main)):

| Route                                       | Screen                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `teacher.toReview`, `.active`, `.completed` | The three tabs: lists of piece cards of the own students                                   |
| `teacher.assignment`                        | One Assignment: recordings, the required feedback field, "Ask to try again" and "Complete" |

"Review in sequence" (from one recording to the next without the list) comes in roadmap phase 5.

Only a teacher may open these routes; the access rule is in the route table, and the API checks every request.
