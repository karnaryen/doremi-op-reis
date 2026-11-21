# Privacy

Recordings of a child's hands are personal data. Families in the EU are protected by the GDPR.

## Requirements

- Files are private. Access goes only through short-lived links that the backend creates after an access check.
- Each user sees only their own data (see [users.md](users.md#access-rule)).
- A legal basis for processing and a short privacy policy.
- Deletion on request: the teacher deletes the parent account and all data of the family ([users.md](users.md#account-rules)).
- Data minimisation: only the latest recordings and auto-deletion 30 days after completion ([assignment-lifecycle.md](assignment-lifecycle.md)).

## Third-party requests

- Fonts are self-hosted: they are bundled with the app (`@fontsource` packages) and served from our own host. Do not load fonts from Google Fonts or another CDN. The Google Fonts CDN receives the visitor's IP address, which is personal data under the GDPR.
- The same rule applies to other assets (icons, scripts, styles): bundle them, do not load them from external servers.

## Notice for parents

Shown on the upload screen and repeated in the privacy policy:

> **About your recordings**
> We store only the latest video and the latest audio for each piece. A new recording replaces the previous one.
> All recordings and comments are deleted 30 days after the work is completed.
> Please film only the child's hands and the instrument, without the face.
