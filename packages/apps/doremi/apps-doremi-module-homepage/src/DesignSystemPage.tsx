import { Trans } from '@lingui/react/macro'
import { faArrowRight, faPalette } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { tokens } from '@doremi/org-ui-theme'
import { ButtonsShowcase } from './showcase/ButtonsShowcase'
import { CardsShowcase } from './showcase/CardsShowcase'
import { ColorPalette } from './showcase/ColorPalette'
import { FeedbackShowcase } from './showcase/FeedbackShowcase'
import { FormsShowcase } from './showcase/FormsShowcase'
import { TypographyScale } from './showcase/TypographyScale'

/**
 * Developer page that shows the MUI theme: colors, typography and components.
 * Only the hero is translated; the showcase sections are English-only developer content.
 * No navigation item points here: open /design-system.
 */
export function DesignSystemPage() {
  return (
    <Stack spacing={{ xs: 8, md: 10 }}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: `${tokens.radius.xl}px`,
          bgcolor: 'brand.surface',
          color: 'brand.onSurface',
          px: { xs: 3, md: 8 },
          py: { xs: 6, md: 10 },
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            width: 420,
            height: 420,
            borderRadius: '50%',
            right: -120,
            top: -160,
            bgcolor: 'brand.blush',
            opacity: 0.9,
          }}
        />
        <Box
          aria-hidden
          sx={(theme) => ({
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: '50%',
            right: 140,
            bottom: -120,
            bgcolor: 'secondary.light',
            opacity: 0.35,
            ...theme.applyStyles('dark', { bgcolor: 'secondary.main', opacity: 0.12 }),
          })}
        />
        <Stack spacing={3} sx={{ position: 'relative', maxWidth: 640 }}>
          <Chip
            icon={<FontAwesomeIcon icon={faPalette} />}
            label={<Trans>Design system</Trans>}
            sx={{
              alignSelf: 'flex-start',
              bgcolor: 'background.paper',
              color: 'primary.main',
              pl: 0.5,
            }}
          />
          <Typography variant="h1">
            <Trans>Design system</Trans>
          </Typography>
          <Typography variant="lead">
            <Trans>
              An MUI theme based on the Doremi style: plum and peach colors and serif headings,
              adapted for an app.
            </Trans>
          </Typography>
          <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button
              size="large"
              variant="contained"
              endIcon={<FontAwesomeIcon icon={faArrowRight} />}
              href="#color"
            >
              <Trans>Explore tokens</Trans>
            </Button>
            <Button size="large" variant="outlined" href="#components">
              <Trans>See components</Trans>
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box id="color" sx={{ scrollMarginTop: 96 }}>
        <ColorPalette />
      </Box>
      <Divider />
      <TypographyScale />
      <Divider />
      <Box id="components" sx={{ scrollMarginTop: 96 }}>
        <ButtonsShowcase />
      </Box>
      <FormsShowcase />
      <FeedbackShowcase />
      <Divider />
      <CardsShowcase />
    </Stack>
  )
}
