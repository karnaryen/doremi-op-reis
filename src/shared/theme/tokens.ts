/**
 * Primitive design tokens: raw colors, fonts, radii and motion.
 * Components must not import these directly — use theme palette keys (`primary.main`, `brand.surface`).
 *
 * Source: doremipiano.nl (plum #8D2F59, peach #FFE4D1, blush #F5E0E9, taupe #73675E,
 * orange #FF842E and #FFAB70, Merriweather and Lato).
 * Changes for the app: a lighter page background, darker text for better contrast,
 * and a 50–900 scale for each brand color.
 */

export const white = '#FFFFFF'

/** Near-black with a plum tint. Main text color in light mode. */
export const ink = '#2E2327'

/** Plum: primary brand color. Step 600 is the plum of doremipiano.nl. */
export const plum = {
  50: '#FCF3F7',
  100: '#F5E0E9', // doremipiano.nl blush
  200: '#EDC6D8',
  300: '#E09DBD',
  400: '#C96D98',
  500: '#AD4677',
  600: '#8D2F59', // doremipiano.nl plum
  700: '#742549',
  800: '#5B1C39',
  900: '#3E1227',
} as const

/** Apricot: secondary color, based on the orange and peach colors of doremipiano.nl. */
export const apricot = {
  50: '#FFF7F1',
  100: '#FFE4D1', // doremipiano.nl peach
  200: '#FFCDAA',
  300: '#FFAB70', // doremipiano.nl orange (light)
  400: '#FF842E', // doremipiano.nl orange
  500: '#EB6A21',
  600: '#CC5516',
  700: '#983C0C',
  800: '#7E340F',
  900: '#3F1806',
} as const

/** Taupe: neutral colors (grey with a brown tint). Step 600 is the text color of doremipiano.nl. */
export const taupe = {
  50: '#FBF8F6',
  100: '#F4EEE9',
  200: '#E8DFD8',
  300: '#D3C7BE',
  400: '#B0A298',
  500: '#8D7F75',
  600: '#73675E', // doremipiano.nl text
  700: '#564C45',
  800: '#3A322E',
  900: '#221C1A',
} as const

/** Aubergine: dark colors for backgrounds in dark mode. */
export const aubergine = {
  700: '#3A2A33',
  800: '#2D2129',
  900: '#221920',
  950: '#170F13',
} as const

/** Status colors (success, info, warning, error), chosen to match plum and apricot. */
export const sage = {
  200: '#A5CDB7',
  300: '#7FB79A',
  600: '#377D5C',
  700: '#2A6148',
  950: '#10261B',
} as const

export const lake = {
  200: '#A9C6E3',
  300: '#86AED6',
  600: '#3A6C9E',
  700: '#2A5078',
  950: '#0F2034',
} as const

/** Honey: warning color, based on the yellow #FFCC00 of doremipiano.nl. */
export const honey = {
  200: '#FFE29A',
  300: '#FFD66B',
  400: '#FFC233',
  500: '#E8A700',
  800: '#7A5600',
  950: '#3A2A00',
} as const

export const brick = {
  200: '#F0A99C',
  300: '#E98A7A',
  600: '#C23D2B',
  700: '#8F2A1D',
  950: '#3A0F08',
} as const

export const fonts = {
  heading: '"Merriweather", "Georgia", "Times New Roman", serif',
  body: '"Lato", "Helvetica Neue", "Arial", sans-serif',
} as const

/** Corner radius in px. */
export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const

/** Transition durations in ms. */
export const duration = {
  fast: 160,
  normal: 200,
} as const
