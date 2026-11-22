# apps-doremi

The Doremi op reis web app: the only application package. It starts the app and connects the packages.

- Providers (data, language, theme, route table).
- One screen for every route: it joins the screens of all modules.
- The message catalogs (`src/locales`) for the whole app. After a text change in any package run `pnpm i18n:extract` and fill in `nl`.
- Vite config, `index.html`, Netlify config.

No screens and no business logic here: they belong to the modules.
