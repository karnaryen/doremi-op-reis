import { createTheme } from '@mui/material/styles'
import './augmentation'
import { components } from './components'
import { darkPalette, lightPalette } from './palette'
import { shadows } from './shadows'
import { radius } from './tokens'
import { typography } from './typography'

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: { palette: lightPalette },
    dark: { palette: darkPalette },
  },
  shape: { borderRadius: radius.sm },
  shadows,
  typography,
  // Keyboard focus ring: 2px solid primary.main (MUI built-in, 7:1 contrast or more in both modes).
  focusVisible: true,
  components,
})
