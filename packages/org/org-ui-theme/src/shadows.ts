import type { Shadows } from '@mui/material/styles'
import { plum } from './tokens'

/** Hex color to the "r g b" format used inside `rgba(r g b / a)`. */
const toRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ')

/**
 * CSS variables for the shadow color and strength. They are set in `MuiCssBaseline`
 * per color scheme: dark plum in light mode, black and stronger in dark mode.
 */
export const shadowVars = {
  light: { '--app-shadow-rgb': toRgb(plum[800]), '--app-shadow-strength': '1' },
  dark: { '--app-shadow-rgb': '0 0 0', '--app-shadow-strength': '3' },
} as const

const layer = (alpha: number) =>
  `rgba(var(--app-shadow-rgb) / calc(${alpha} * var(--app-shadow-strength)))`

/** The 24 elevation shadows (index 0 is "none"), colored by `shadowVars`. */
export const shadows = [
  'none',
  ...Array.from({ length: 24 }, (_, i) => {
    const e = i + 1
    const y = Math.round(e * 0.9 + 1)
    const blur = Math.round(e * 2.4 + 2)
    const spread = Math.round(e / 3)
    const a = Math.min(0.06 + e * 0.004, 0.14)
    return `0 ${y}px ${blur}px -${spread}px ${layer(a)}, 0 1px 2px ${layer(0.04)}`
  }),
] as Shadows
