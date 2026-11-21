# Mobile-first design

Parents and the teacher use the app mainly on a phone. Every screen is designed for a phone first and then adapted for larger screens.

## Layout

- Design for a width of 360–430 px first. Add tablet and desktop layouts with `min-width` breakpoints (MUI `sm`, `md` and up).
- One column. No side panels, no wide tables on phones.
- Main navigation: a bottom navigation bar with the role's tabs (see [users.md](users.md)).
- Top bar: screen title, back button where needed, profile icon.
- Forms and multi-step actions (assign a piece, upload a recording) use a full screen, not a dialog.

## Touch

- Touch targets are at least 48 × 48 px.
- Primary actions are within reach of the thumb, at the bottom of the screen.
- No actions that need hover.

## Phone features

- File picker and camera for recordings.
- The system share menu for PDFs (print, send by email).
- Uploads work on mobile networks: progress bar, retry on error.

## MUI components

`AppBar`, `BottomNavigation`, `Card`, `Stack`, `TextField`, `Button`, `Chip` (statuses).

## Check

Test every screen at 375 px width in light and dark mode before a change is done.
