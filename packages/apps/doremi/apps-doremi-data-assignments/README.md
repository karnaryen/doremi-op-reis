# apps-doremi-data-assignments

Assignments ("piece cards") from the API, for both roles: lists, one Assignment, "Assign a piece", the review, the upload of a recording and the links to private files.

- Queries: `assignmentsQueryOptions(filter)`, `assignmentQueryOptions(id)`, `recordingLinkQueryOptions(id, kind)`, `materialFileLinkQueryOptions(id, fileId)`.
- Mutations: `useAssignPiece()` (uploads the files of the piece, then creates the Assignment), `useReviewAssignment(id)`, `useUploadRecording(id)`.
- `uploadMaterialFile()` and `uploadRecording()` send a file directly to the file storage with a signed URL; the API only gives the URL and checks the result ([architecture.md](../../../../docs/tech/architecture.md#upload-flow)).

- `useMaterialFileLinks(assignment)` and `useRecordingLinks(assignment)` load the links of all files of one Assignment.

File links live one hour, so their queries ask for a new link after 45 minutes, and when the user comes back to the app. A review sends the `version` of the Assignment: the API refuses feedback for a state that the teacher has not seen.

No components here: the modules of the teacher and of the parent draw the data.
