/**
 * TypeScript module augmentation for the custom theme keys.
 * This is a `.ts` file (not `.d.ts`) so that `tsc` checks it even with `skipLibCheck`.
 */
import type { CSSProperties } from 'react'
import '@mui/material/styles'
import '@mui/material/Chip'
import '@mui/material/Typography'

declare module '@mui/material/styles' {
  /** The theme is built with `cssVariables`, so `theme.vars` and `theme.colorSchemes` always exist. */
  interface CssThemeVariables {
    enabled: true
  }

  interface BrandPalette {
    /** Background for the hero and highlight blocks (peach in light mode, aubergine in dark mode). */
    surface: string
    /** Text and icon color on `surface`. */
    onSurface: string
    /** Light plum background for selected items, avatars and text selection. */
    blush: string
    /** Border of form controls (inputs, switch track). Has 3:1 contrast on paper. */
    border: string
  }

  interface Palette {
    brand: BrandPalette
  }

  interface PaletteOptions {
    brand?: BrandPalette
  }

  interface PaletteColor {
    /** Text color on a light tint of `main`, and for outlined and text buttons. */
    softText: string
  }

  interface SimplePaletteColorOptions {
    softText?: string
  }

  interface TypographyVariants {
    lead: CSSProperties
  }

  interface TypographyVariantsOptions {
    lead?: CSSProperties
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    lead: true
  }
}

declare module '@mui/material/Chip' {
  interface ChipPropsVariantOverrides {
    soft: true
  }
}

export {}
