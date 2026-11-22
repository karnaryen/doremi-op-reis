# apps-doremi-utils-routes

The route table of the app, in one file: every URL, who may open it, and its place in the navigation. Plus the link helpers typed with this table.

Every package of the app links through these helpers, never with a URL string.

To add a screen: add the route here, then its screen in the module. Details: [monorepo.md](../../../../docs/tech/monorepo.md#routes-and-links).

The access rules here only hide links and screens. They are not security: the API checks access itself.

No screens here. This package must stay small, because every module imports it.
