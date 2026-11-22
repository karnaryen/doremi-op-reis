# apps-doremi-module-homepage

Public pages:

| Route          | Screen                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------- |
| `home`         | The homepage for guests: what the app is and how it works, sign-in and sign-up buttons   |
| `signIn`       | Email and password                                                                       |
| `signUp`       | Teacher sign-up: name, email, password                                                   |
| `setPassword`  | Opened from the invitation link (`/set-password#token=...`): a parent chooses a password |
| `about`        | "About"                                                                                  |
| `designSystem` | Developer page with the theme colors, typography and components. English only            |

A signed-in user who opens one of the first four pages is sent to the section "Main".

The forms use the validation of the browser; the API checks every value again and its error codes are shown by `ErrorAlert` of `apps-doremi-ui-layout`.

Screens: [mobile-design.md](../../../../docs/product/mobile-design.md#mvp-screens).
