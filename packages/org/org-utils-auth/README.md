# org-utils-auth

The roles of the organization: `guest`, `teacher`, `parent`.

No browser and no router code (`platform:common`), so a native app can use it too.

The package has only the role names and their type. Who the current user is comes from the API: the app asks `GET /api/profile` (`apps-doremi-data-profile`) and gives the role to the route table. A role in the browser only hides links and screens; the API checks every request itself.

Roles and their rights: [users.md](../../../docs/product/users.md).
