# apps-doremi-ui-assignments

Components that draw an Assignment ("piece card"), used by the modules of the teacher and of the parent: the status chip, the list of cards, the three texts of a piece, the feedback, a player for a recording, a button that opens a file, and the notices about deletion and privacy.

The components get plain values as props and load nothing: a `ui` package may not import a `data` package ([monorepo.md](../../../../docs/tech/monorepo.md#tags-and-import-rules)). The module loads the data and gives it to the component. This is why `types.ts` repeats the status names of the API.

Statuses and texts: [assignment-lifecycle.md](../../../../docs/product/assignment-lifecycle.md), [features.md](../../../../docs/product/features.md#ux-rules).
