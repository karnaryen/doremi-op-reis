# native

Code that runs only in a native app. Empty for now: there is no native app yet.

Rules (already checked by ESLint, see `eslint.config.js`):

- A package here has the tag `platform:native`.
- It may import `platform:common` and `platform:native` packages. It may not import `platform:web`.
- Generic packages (`layer:generic`) never import `org` or `apps`.
