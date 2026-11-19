import { alpha, type PaletteOptions } from '@mui/material/styles'
import { apricot, aubergine, brick, honey, ink, lake, plum, sage, taupe, white } from './tokens'

/**
 * Semantic palettes for light and dark mode.
 *
 * Rules:
 * - `dark` is the hover background of a contained button. It must have 4.5:1 contrast with
 *   `contrastText`. When `contrastText` is dark, `dark` is a lighter color.
 * - `softText` is the text color on a 14% tint of `main` (soft Chip) and the text color of
 *   outlined and text buttons. It must have 4.5:1 contrast on paper.
 * - `brand.border` is the border of form controls. It must have 3:1 contrast on paper.
 * - `theme.test.ts` checks these contrast rules.
 */

export const lightPalette = {
  primary: {
    light: plum[400],
    main: plum[600],
    dark: plum[800],
    contrastText: white,
    softText: plum[700],
  },
  secondary: {
    light: apricot[300],
    main: apricot[500],
    dark: apricot[400],
    contrastText: apricot[900],
    softText: apricot[700],
  },
  success: {
    light: sage[300],
    main: sage[600],
    dark: sage[700],
    contrastText: white,
    softText: sage[700],
  },
  info: {
    light: lake[300],
    main: lake[600],
    dark: lake[700],
    contrastText: white,
    softText: lake[700],
  },
  warning: {
    light: honey[300],
    main: honey[500],
    dark: honey[400],
    contrastText: honey[950],
    softText: honey[800],
  },
  error: {
    light: brick[300],
    main: brick[600],
    dark: brick[700],
    contrastText: white,
    softText: brick[700],
  },
  grey: taupe,
  background: { default: apricot[50], paper: white },
  text: { primary: ink, secondary: taupe[700], disabled: taupe[400] },
  divider: alpha(taupe[600], 0.18),
  action: {
    hover: alpha(plum[600], 0.06),
    hoverOpacity: 0.06,
    selected: alpha(plum[600], 0.1),
    selectedOpacity: 0.1,
    focus: alpha(plum[600], 0.14),
    focusOpacity: 0.14,
    disabled: alpha(taupe[600], 0.42),
    disabledBackground: alpha(taupe[600], 0.12),
  },
  brand: {
    surface: apricot[100],
    onSurface: plum[800],
    blush: plum[100],
    border: taupe[500],
  },
} satisfies PaletteOptions

export const darkPalette = {
  primary: {
    light: plum[100],
    main: plum[300],
    dark: plum[200],
    contrastText: plum[900],
    softText: plum[200],
  },
  secondary: {
    light: apricot[100],
    main: apricot[300],
    dark: apricot[200],
    contrastText: apricot[900],
    softText: apricot[200],
  },
  success: {
    light: sage[200],
    main: sage[300],
    dark: sage[200],
    contrastText: sage[950],
    softText: sage[200],
  },
  info: {
    light: lake[200],
    main: lake[300],
    dark: lake[200],
    contrastText: lake[950],
    softText: lake[200],
  },
  warning: {
    light: honey[200],
    main: honey[300],
    dark: honey[200],
    contrastText: honey[950],
    softText: honey[200],
  },
  error: {
    light: brick[200],
    main: brick[300],
    dark: brick[200],
    contrastText: brick[950],
    softText: brick[200],
  },
  grey: taupe,
  background: { default: aubergine[950], paper: aubergine[900] },
  text: { primary: '#F7EEE9', secondary: taupe[300], disabled: taupe[600] },
  divider: alpha(apricot[100], 0.12),
  action: {
    hover: alpha(plum[300], 0.08),
    hoverOpacity: 0.08,
    selected: alpha(plum[300], 0.14),
    selectedOpacity: 0.14,
    focus: alpha(plum[300], 0.18),
    focusOpacity: 0.18,
    disabled: alpha(apricot[100], 0.32),
    disabledBackground: alpha(apricot[100], 0.1),
  },
  brand: {
    surface: aubergine[800],
    onSurface: plum[200],
    blush: '#3B2030',
    border: taupe[500],
  },
} satisfies PaletteOptions
