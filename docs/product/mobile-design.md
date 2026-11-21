# Mobile-first design

Parents and the teacher use the app mainly on a phone. Every screen is designed for a phone first and then adapted for larger screens.

## Layout

- Design for a width of 360–430 px first. Add tablet and desktop layouts with `min-width` breakpoints (MUI `sm`, `md` and up).
- One column. No side panels, no wide tables on phones.
- Main navigation: a bottom navigation bar with the role's sections; tabs inside a section (see [users.md](users.md#navigation)).
- Top bar: screen title, back button where needed.
- Forms and multi-step actions (assign a piece, upload a recording) use a full screen, not a dialog.

## MVP screens

| Role    | Screen          | Content                                                                                                   |
| ------- | --------------- | --------------------------------------------------------------------------------------------------------- |
| Guest   | Homepage        | What the app is, for whom, how it works ([overview.md](overview.md)); sign-in and teacher sign-up buttons |
| Guest   | Sign-in         | Email, password                                                                                           |
| Guest   | Teacher sign-up | Name, email, password                                                                                     |
| Guest   | Set password    | Opened from the invitation link; the parent sets a password                                               |
| Parent  | Main            | Child's name; "Active" and "Completed" tabs with piece cards and their status                             |
| Parent  | Piece card      | Teacher's task, files to download, parent hint, upload button                                             |
| Parent  | Upload          | Video or audio, pick a file or record, the privacy notice                                                 |
| Teacher | Main            | "To review" tab (student, piece, recording length), "Active" and "Completed" tabs                         |
| Teacher | Recording       | Player, feedback field, "Mark as viewed", "Ask to try again", "Complete"                                  |
| Teacher | Students        | Section: own students with their parents, "Add parent" button                                             |
| Teacher | Add parent      | Parent's name and email, child's name; sends the invitation                                               |
| Teacher | Parent          | Name, email, child, "Delete parent" with confirmation                                                     |
| Teacher | Student         | All Assignments of one child with status, "Assign a piece" button                                         |
| Teacher | Assign a piece  | Students, title, instruction, parent hint, optional sheet music and audio                                 |
| Both    | Profile         | Section: language, sign-out                                                                               |

## Touch

- Touch targets are at least 48 × 48 px.
- Primary actions are within reach of the thumb, at the bottom of the screen.
- No actions that need hover.

## Phone features

- File picker and camera for recordings and for photos of sheet music.
- The system share menu for sheet music files (print, send by email).
- Uploads work on mobile networks: progress bar, retry on error.

## MUI components

`AppBar`, `BottomNavigation`, `Card`, `Stack`, `TextField`, `Button`, `Chip` (statuses).

## Check

Test every screen at 375 px width in light and dark mode before a change is done.
