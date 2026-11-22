# apps-doremi-data-profile

The signed-in user and the session, on top of TanStack Query.

- `profileQueryOptions()` / `useProfile()`: `GET /api/profile`. The data is `null` for a guest.
- `useSignIn()`, `useSignUp()`, `useAcceptInvitation()`, `useSignOut()`: mutations. Each of them saves the new session with `setSession()`, which also drops all other cached data, so one user never sees the data of the previous user of the browser.

The API keeps the session in an `HttpOnly` cookie: JavaScript never sees a token ([backend.md](../../../../docs/tech/backend.md#sign-in-and-cookies)).

The pattern for data packages:

- one package per resource;
- it exports query options, mutation hooks and types, no components;
- modules use them with `useQuery`.
