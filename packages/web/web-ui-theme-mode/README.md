# web-ui-theme-mode

The light / dark / system switch. Generic MUI: it works with any theme that has color schemes.

MUI stores the choice in `localStorage` (`mui-mode`). The app's `index.html` reads the same key before the app loads, to avoid a flash of the wrong mode.
