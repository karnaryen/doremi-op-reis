import { getContrastRatio } from '@mui/material/styles'
import { describe, expect, it } from 'vitest'
import { darkPalette, lightPalette } from './palette'

const COLORS = ['primary', 'secondary', 'success', 'info', 'warning', 'error'] as const

/** Paints `hex` at `alpha` over the opaque `base` and returns the result as hex. */
function blend(hex: string, alpha: number, base: string) {
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const [a, b] = [rgb(hex), rgb(base)]
  const mixed = a.map((c, i) => Math.round(c * alpha + (b[i] ?? 0) * (1 - alpha)))
  return `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

describe.each([
  ['light', lightPalette],
  ['dark', darkPalette],
])('%s palette contrast (WCAG 2.x)', (_, p) => {
  const surfaces = [p.background.default, p.background.paper]

  it('body text has 4.5:1 on every surface', () => {
    for (const bg of surfaces) {
      expect(getContrastRatio(p.text.primary, bg)).toBeGreaterThanOrEqual(4.5)
      expect(getContrastRatio(p.text.secondary, bg)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it.each(COLORS)('%s: contrastText has 4.5:1 on main and on dark (hover)', (color) => {
    const c = p[color]
    expect(getContrastRatio(c.contrastText, c.main)).toBeGreaterThanOrEqual(4.5)
    expect(getContrastRatio(c.contrastText, c.dark)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(COLORS)('%s: softText has 4.5:1 on paper and on the soft chip tint', (color) => {
    const c = p[color]
    for (const bg of surfaces) {
      expect(getContrastRatio(c.softText, bg)).toBeGreaterThanOrEqual(4.5)
      expect(getContrastRatio(c.softText, blend(c.main, 0.24, bg))).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('form control border has 3:1 on every surface', () => {
    for (const bg of surfaces) {
      expect(getContrastRatio(p.brand.border, bg)).toBeGreaterThanOrEqual(3)
    }
  })

  it('primary.main (focus ring) has 3:1 on every surface', () => {
    for (const bg of surfaces) {
      expect(getContrastRatio(p.primary.main, bg)).toBeGreaterThanOrEqual(3)
    }
  })

  it('brand.onSurface has 4.5:1 on brand.surface', () => {
    expect(getContrastRatio(p.brand.onSurface, p.brand.surface)).toBeGreaterThanOrEqual(4.5)
  })
})
