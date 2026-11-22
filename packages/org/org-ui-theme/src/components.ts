import type { Theme, ThemeOptions } from '@mui/material/styles'
import { shadowVars } from './shadows'
import { duration, fonts, radius } from './tokens'

const COLORS = ['primary', 'secondary', 'success', 'info', 'warning', 'error'] as const

/** Colors whose `main` is too light for text on paper. Outlined and text buttons use `softText`. */
const SOFT_TEXT_COLORS = ['secondary', 'success', 'info', 'warning', 'error'] as const

const transition = (...props: string[]) =>
  props.map((p) => `${p} ${duration.fast}ms ease`).join(', ')

/**
 * Default props and style overrides for MUI components.
 * Colors come from the theme palette (`theme.vars`), sizes from `tokens.ts`.
 */
export const components: ThemeOptions['components'] = {
  MuiCssBaseline: {
    styleOverrides: (theme: Theme) => ({
      ':root': shadowVars.light,
      // `colorSchemeSelector: 'class'` puts the `dark` class on <html>.
      ':root.dark': shadowVars.dark,
      body: {
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
      '::selection': {
        backgroundColor: theme.vars.palette.brand.blush,
        color: theme.vars.palette.text.primary,
      },
    }),
  },

  MuiTypography: {
    defaultProps: { variantMapping: { lead: 'p' } },
  },

  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: {
        borderRadius: radius.pill,
        paddingInline: 20,
        transition: transition('background-color', 'box-shadow', 'transform'),
        '&:active': { transform: 'translateY(1px)' },
        variants: SOFT_TEXT_COLORS.flatMap((color) =>
          (['outlined', 'text'] as const).map((variant) => ({
            props: { variant, color },
            style: ({ theme }: { theme: Theme }) => ({
              color: theme.vars.palette[color].softText,
            }),
          })),
        ),
      },
      sizeSmall: { paddingInline: 14, minHeight: 32 },
      sizeMedium: { minHeight: 40 },
      sizeLarge: { paddingInline: 28, minHeight: 50, fontSize: '1rem' },
      contained: {
        '@media (hover: hover)': {
          '&:hover': {
            boxShadow:
              '0 6px 16px -6px color-mix(in srgb, var(--variant-containedBg) 60%, transparent)',
          },
        },
      },
      outlined: { borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } },
    },
  },

  MuiIconButton: {
    styleOverrides: { root: { borderRadius: radius.sm } },
  },

  MuiToggleButtonGroup: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: radius.pill,
        padding: 3,
        gap: 2,
        backgroundColor: theme.vars.palette.action.hover,
      }),
      grouped: { border: 0, borderRadius: radius.pill, marginLeft: 0 },
    },
  },

  MuiToggleButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        fontWeight: 700,
        paddingInline: 16,
        color: theme.vars.palette.text.secondary,
        '&.Mui-selected, &.Mui-selected:hover': {
          backgroundColor: theme.vars.palette.background.paper,
          color: theme.vars.palette.primary.main,
          boxShadow: theme.vars.shadows[1],
        },
      }),
    },
  },

  MuiAppBar: {
    defaultProps: { color: 'inherit', elevation: 0 },
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: `rgba(${theme.vars.palette.background.defaultChannel} / 0.82)`,
        backdropFilter: 'saturate(160%) blur(12px)',
        borderBottom: `1px solid ${theme.vars.palette.divider}`,
        color: theme.vars.palette.text.primary,
      }),
    },
  },

  MuiPaper: {
    styleOverrides: {
      rounded: { borderRadius: radius.md },
      outlined: ({ theme }) => ({ borderColor: theme.vars.palette.divider }),
    },
  },

  MuiCard: {
    defaultProps: { variant: 'outlined' },
    styleOverrides: {
      root: {
        borderRadius: radius.lg,
        transition: transition('box-shadow', 'transform', 'border-color'),
      },
    },
  },

  MuiCardContent: {
    styleOverrides: { root: { padding: 24, '&:last-child': { paddingBottom: 24 } } },
  },

  MuiCardActions: {
    styleOverrides: { root: { padding: '0 16px 16px' } },
  },

  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: radius.pill,
        fontWeight: 700,
        variants: [
          {
            props: { variant: 'soft' },
            style: ({ theme }: { theme: Theme }) => ({
              backgroundColor: `rgba(${theme.vars.palette.text.primaryChannel} / 0.08)`,
              color: theme.vars.palette.text.primary,
            }),
          },
          ...COLORS.map((color) => ({
            props: { variant: 'soft' as const, color },
            style: ({ theme }: { theme: Theme }) => {
              const tint = (a: number) => `rgba(${theme.vars.palette[color].mainChannel} / ${a})`
              return {
                backgroundColor: tint(0.14),
                color: theme.vars.palette[color].softText,
                '&.MuiChip-clickable:hover, &.Mui-focusVisible': { backgroundColor: tint(0.24) },
                '& .MuiChip-deleteIcon': {
                  color: 'currentColor',
                  opacity: 0.7,
                  '&:hover': { color: 'currentColor', opacity: 1 },
                },
              }
            },
          })),
        ],
      },
      label: { paddingInline: 12 },
    },
  },

  MuiAvatar: {
    styleOverrides: {
      root: ({ theme }) => ({
        fontFamily: fonts.heading,
        fontWeight: 700,
        fontSize: '0.9rem',
        backgroundColor: theme.vars.palette.brand.blush,
        color: theme.vars.palette.primary.main,
      }),
    },
  },

  MuiBadge: {
    styleOverrides: { badge: { fontWeight: 700 } },
  },

  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: radius.sm,
        backgroundColor: theme.vars.palette.background.paper,
        transition: transition('box-shadow'),
        '@media (hover: hover)': {
          '&:hover:not(.Mui-focused, .Mui-error, .Mui-disabled) .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.vars.palette.text.secondary,
          },
        },
        '&.Mui-focused': {
          boxShadow: `0 0 0 4px rgba(${theme.vars.palette.primary.mainChannel} / 0.12)`,
        },
      }),
      notchedOutline: ({ theme }) => ({ borderColor: theme.vars.palette.brand.border }),
    },
  },

  MuiSelect: {
    styleOverrides: { icon: ({ theme }) => ({ color: theme.vars.palette.text.secondary }) },
  },

  MuiSwitch: {
    styleOverrides: {
      root: {
        // Custom shape for the medium size only. The small size keeps MUI's default shape.
        variants: [
          {
            props: { size: 'medium' },
            style: ({ theme }: { theme: Theme }) => ({
              width: 54,
              height: 34,
              padding: 7,
              '& .MuiSwitch-switchBase': {
                padding: 9,
                '&.Mui-checked': { transform: 'translateX(20px)' },
                '&.Mui-disabled + .MuiSwitch-track': { opacity: 0.4 },
                // MUI uses a 50% tint for the checked track; this design uses the solid color.
                ...Object.fromEntries(
                  COLORS.map((color) => [
                    `&.MuiSwitch-color${color.charAt(0).toUpperCase()}${color.slice(1)}.Mui-checked + .MuiSwitch-track`,
                    { backgroundColor: theme.vars.palette[color].main },
                  ]),
                ),
              },
              '& .MuiSwitch-thumb': {
                width: 16,
                height: 16,
                boxShadow: 'none',
                backgroundColor: theme.vars.palette.common.white,
              },
              '& .Mui-checked .MuiSwitch-thumb': theme.applyStyles('dark', {
                backgroundColor: theme.vars.palette.primary.contrastText,
              }),
              '& .MuiSwitch-track': {
                borderRadius: radius.pill,
                opacity: 1,
                backgroundColor: theme.vars.palette.brand.border,
              },
            }),
          },
        ],
      },
    },
  },

  MuiSlider: {
    styleOverrides: {
      thumb: ({ theme }) => ({
        width: 18,
        height: 18,
        backgroundColor: theme.vars.palette.background.paper,
        border: '3px solid currentColor',
        '&:hover, &.Mui-focusVisible': {
          boxShadow: '0 0 0 8px color-mix(in srgb, currentColor 16%, transparent)',
        },
      }),
      rail: { opacity: 0.38 },
    },
  },

  MuiTabs: {
    styleOverrides: { indicator: { height: 3, borderRadius: 3 } },
  },

  MuiTab: {
    styleOverrides: { root: { fontWeight: 700, fontSize: '0.9375rem', minHeight: 48 } },
  },

  MuiAlert: {
    styleOverrides: {
      root: { borderRadius: radius.md },
      standard: ({ theme }) => ({ border: `1px solid ${theme.vars.palette.divider}` }),
    },
  },

  MuiTooltip: {
    defaultProps: { arrow: true },
    styleOverrides: {
      tooltip: ({ theme }) => ({
        borderRadius: radius.xs,
        fontSize: '0.8125rem',
        fontWeight: 400,
        padding: '6px 10px',
        backgroundColor: theme.vars.palette.text.primary,
        color: theme.vars.palette.background.paper,
      }),
      arrow: ({ theme }) => ({ color: theme.vars.palette.text.primary }),
    },
  },

  MuiMenu: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: radius.md,
        marginTop: 6,
        border: `1px solid ${theme.vars.palette.divider}`,
      }),
      list: { padding: 6 },
    },
  },

  MuiMenuItem: {
    styleOverrides: { root: { borderRadius: radius.xs } },
  },

  MuiDialog: {
    styleOverrides: { paper: { borderRadius: radius.xl } },
  },

  MuiLinearProgress: {
    styleOverrides: {
      root: { height: 8, borderRadius: radius.pill },
      bar: { borderRadius: radius.pill },
    },
  },

  MuiSkeleton: {
    defaultProps: { animation: 'wave' },
    styleOverrides: { rounded: { borderRadius: radius.sm } },
  },

  MuiDivider: {
    styleOverrides: { root: ({ theme }) => ({ borderColor: theme.vars.palette.divider }) },
  },

  MuiLink: {
    defaultProps: { underline: 'hover' },
    styleOverrides: {
      root: { fontWeight: 700, textUnderlineOffset: 3, textDecorationThickness: 1.5 },
    },
  },
}
