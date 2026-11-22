# apps-doremi-module-parents-main

Section "Main" of the parent ([users.md](../../../../docs/product/users.md#tabs-in-main)):

| Route                         | Screen                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| `parent.active`, `.completed` | The two tabs: the piece cards of the child with their status                        |
| `parent.assignment`           | The piece card: instructions, files to open, feedback, the recordings               |
| `parent.upload`               | Send a video or an audio recording: camera or file, progress bar, retry, the notice |

A new recording replaces the previous one of the same kind; the API deletes the old file only after the new one is saved ([assignment-lifecycle.md](../../../../docs/product/assignment-lifecycle.md#replacing-a-recording)).

Only a parent may open these routes; the access rule is in the route table, and the API checks every request.
