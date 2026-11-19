import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#2f6fde' },
        secondary: { main: '#f2994a' },
        background: { default: '#f7f8fb' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#7aa7ff' },
        secondary: { main: '#ffb877' },
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
  },
})
