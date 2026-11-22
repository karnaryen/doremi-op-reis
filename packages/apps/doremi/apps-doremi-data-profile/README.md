# apps-doremi-data-profile

Server data of the signed-in user, as TanStack Query options.

The endpoint does not exist yet: it comes with sign-in (roadmap phase 4). Until then no screen uses this package; it shows the pattern for data packages:

- one package per resource;
- it exports query options and types, no components;
- modules use them with `useQuery`.
