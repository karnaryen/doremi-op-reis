import type { TypographyVariantsOptions } from '@mui/material/styles'
import { fonts } from './tokens'

const heading = { fontFamily: fonts.heading, fontWeight: 400 } as const

/**
 * Headings use Merriweather (Doremi brand font), body text uses Lato.
 * h1–h3 change size with the screen width (CSS clamp). All sizes are in rem.
 */
export const typography: TypographyVariantsOptions = {
  fontFamily: fonts.body,
  h1: {
    ...heading,
    fontSize: 'clamp(2.25rem, 1.6rem + 2.6vw, 3.5rem)',
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
  },
  h2: {
    ...heading,
    fontSize: 'clamp(1.875rem, 1.5rem + 1.6vw, 2.75rem)',
    lineHeight: 1.2,
    letterSpacing: '-0.015em',
  },
  h3: {
    ...heading,
    fontSize: 'clamp(1.625rem, 1.4rem + 0.9vw, 2rem)',
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
  },
  h4: { ...heading, fontSize: '1.375rem', lineHeight: 1.3 },
  h5: { ...heading, fontWeight: 700, fontSize: '1.1875rem', lineHeight: 1.4 },
  h6: { ...heading, fontWeight: 700, fontSize: '1.0625rem', lineHeight: 1.45 },
  subtitle1: { fontWeight: 700, fontSize: '1rem', lineHeight: 1.5 },
  subtitle2: { fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.5 },
  body1: { fontSize: '1rem', lineHeight: 1.65 },
  body2: { fontSize: '0.875rem', lineHeight: 1.6 },
  lead: { fontSize: '1.25rem', lineHeight: 1.6, fontWeight: 400 },
  button: {
    fontWeight: 700,
    textTransform: 'none',
    letterSpacing: '0.01em',
    fontSize: '0.9375rem',
  },
  caption: { fontSize: '0.8125rem', lineHeight: 1.5 },
  overline: { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.14em', lineHeight: 2 },
}
