# org-data-api

The client of our API: the fetch wrapper, its error type, the upload to a signed URL, and the TanStack Query defaults.

The only place that reads `VITE_API_BASE_URL`. Data packages of an app (`apps-*-data-*`) build their queries on top of it; screens never call `fetch` directly.

- `http()` sends the session cookie (`credentials: 'include'`), and `Content-Type: application/json` with every request that changes data: the API refuses such a request without it ([backend.md](../../../docs/tech/backend.md#sign-in-and-cookies)).
- `HttpError` has the `code` of the API error (`email_already_used`, `validation_failed`, ...). Screens show a translated text for a code; the English `message` is for developers.
- `uploadToSignedUrl()` sends a file directly to the file storage with progress. The file does not pass through the API.
- `createQueryClient({ onUnauthorized })`: the app is told when any request gets 401, so it can forget the signed-in user.

Not here: queries for a specific resource. They belong to the app's data packages.
