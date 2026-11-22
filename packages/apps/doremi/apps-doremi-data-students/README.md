# apps-doremi-data-students

The students and the parent accounts of the signed-in teacher, from the API.

- Queries: `studentsQueryOptions()`, `studentQueryOptions(id)` (one student with all Assignments).
- Mutations: `useAddParent()`, `useInviteAgain()`, `useDeleteParent()`.

A parent account and the child are created together, and deleting the parent deletes the data of the family ([users.md](../../../../docs/product/users.md#account-rules)).

Only a teacher may call these endpoints; the API checks it.
