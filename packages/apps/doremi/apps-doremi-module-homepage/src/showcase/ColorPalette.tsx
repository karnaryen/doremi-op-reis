import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { getContrastRatio, useColorScheme, useTheme } from '@mui/material/styles'
import { tokens } from '@doremi/org-ui-theme'
import { ShowcaseLabel, ShowcaseSection } from './ShowcaseSection'

const { apricot, ink, plum, radius, taupe, white } = tokens

/** White or ink, whichever has the higher contrast on `hex`. */
const onColor = (hex: string) =>
  getContrastRatio(hex, white) >= getContrastRatio(hex, ink) ? white : ink

type RampProps = { name: string; scale: Record<number, string>; fromSite: number[] }

function Ramp({ name, scale, fromSite }: RampProps) {
  return (
    <Box>
      <ShowcaseLabel>{name}</ShowcaseLabel>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(5, 1fr)', sm: 'repeat(10, 1fr)' },
          borderRadius: `${radius.sm}px`,
          overflow: 'hidden',
        }}
      >
        {Object.entries(scale).map(([step, hex]) => (
          <Stack
            key={step}
            sx={{
              bgcolor: hex,
              color: onColor(hex),
              height: 84,
              p: 1,
              justifyContent: 'space-between',
              fontSize: 11,
              lineHeight: 1.3,
            }}
          >
            <span>{fromSite.includes(Number(step)) ? 'From site' : ''}</span>
            <span>
              <b>{step}</b>
              <br />
              {hex}
            </span>
          </Stack>
        ))}
      </Box>
    </Box>
  )
}

export function ColorPalette() {
  const theme = useTheme()
  const { colorScheme = 'light' } = useColorScheme()
  const p = theme.colorSchemes[colorScheme]?.palette ?? theme.palette

  const semantic = [
    { token: 'primary.main', label: 'Primary · Plum', hex: p.primary.main },
    { token: 'secondary.main', label: 'Secondary · Apricot', hex: p.secondary.main },
    { token: 'brand.surface', label: 'Brand surface', hex: p.brand.surface },
    { token: 'brand.blush', label: 'Blush', hex: p.brand.blush },
    { token: 'background.default', label: 'Background', hex: p.background.default },
    { token: 'background.paper', label: 'Paper', hex: p.background.paper },
    { token: 'text.primary', label: 'Text', hex: p.text.primary },
    { token: 'text.secondary', label: 'Text secondary', hex: p.text.secondary },
    { token: 'success.main', label: 'Success · Sage', hex: p.success.main },
    { token: 'info.main', label: 'Info · Lake', hex: p.info.main },
    { token: 'warning.main', label: 'Warning · Honey', hex: p.warning.main },
    { token: 'error.main', label: 'Error · Brick', hex: p.error.main },
  ]

  return (
    <ShowcaseSection
      eyebrow="Foundations"
      title="Color"
      description="Plum and peach are the Doremi brand colors. The theme adds a lighter page background, darker text for better contrast, and status colors that match the brand. Use the theme button in the top bar to see the dark mode colors."
    >
      <Box>
        <ShowcaseLabel>Semantic tokens ({colorScheme} mode)</ShowcaseLabel>
        <Grid container spacing={2}>
          {semantic.map(({ token, label, hex }) => (
            <Grid key={token} size={{ xs: 6, sm: 4, md: 2 }}>
              <Box
                sx={{
                  borderRadius: `${radius.md}px`,
                  overflow: 'hidden',
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Box sx={{ height: 72, bgcolor: token }} />
                <Box sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" noWrap>
                    {label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div" noWrap>
                    {token}
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    {hex}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Ramp name="Plum — primary" scale={plum} fromSite={[100, 600]} />
      <Ramp name="Apricot — secondary" scale={apricot} fromSite={[100, 300, 400]} />
      <Ramp name="Taupe — neutrals" scale={taupe} fromSite={[600]} />
    </ShowcaseSection>
  )
}
