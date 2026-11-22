# org-utils-auth

Who the user is: the roles of the organization and the current role.

No browser and no router code (`platform:common`), so a native app can use it too.

There is no sign-in yet (roadmap phase 4): everyone is a guest, and the role can be changed only by the development role preview and by tests. When sign-in comes, the session from the API replaces the store; the packages that read the role do not change.

Roles and their rights: [users.md](../../../docs/product/users.md).
