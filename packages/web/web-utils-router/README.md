# web-utils-router

Connects a route table (`common-utils-routes`) to React Router: routes, access guards, navigation items, breadcrumbs.

It knows no app and no roles. An app does not import the link helpers from here: it calls `bindRoutes` once, next to its table, and uses the typed result (for Doremi: `apps-doremi-utils-routes`).

The role is a plain string here. The organization's roles are in `org-utils-auth`.
