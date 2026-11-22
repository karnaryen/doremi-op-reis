import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography, { type TypographyProps } from '@mui/material/Typography'
import { ShowcaseSection } from './ShowcaseSection'

type Sample = { variant: NonNullable<TypographyProps['variant']>; meta: string; text: string }

const SAMPLES: Sample[] = [
  { variant: 'h1', meta: 'h1 · Merriweather 400', text: 'Muziek op reis' },
  { variant: 'h2', meta: 'h2 · Merriweather 400', text: 'Muziekles aan huis' },
  { variant: 'h3', meta: 'h3 · Merriweather 400', text: 'Lesrooster' },
  { variant: 'h4', meta: 'h4 · Merriweather 400', text: 'Leerlingen deze week' },
  { variant: 'h5', meta: 'h5 · Merriweather 700', text: 'Volgende les: dinsdag 16:30' },
  { variant: 'h6', meta: 'h6 · Merriweather 700', text: 'Toonladders en akkoorden' },
  {
    variant: 'lead',
    meta: 'lead · Lato 400 / 1.25rem',
    text: 'Plan je lessen aan huis en zie in één keer de beste route.',
  },
  {
    variant: 'body1',
    meta: 'body1 · Lato 400 / 1rem',
    text: 'Elke leerling krijgt een vaste dag en tijd. Als een les uitvalt, kun je een nieuwe tijd kiezen in het rooster.',
  },
  {
    variant: 'body2',
    meta: 'body2 · Lato 400 / 0.875rem',
    text: 'Lessen van 30, 45 of 60 minuten, wekelijks of om de twee weken.',
  },
  { variant: 'subtitle1', meta: 'subtitle1 · Lato 700', text: 'Doremi — muziekles aan huis' },
  { variant: 'overline', meta: 'overline · Lato 700 / 0.14em', text: 'Nieuw lesrooster' },
  {
    variant: 'caption',
    meta: 'caption · Lato 400 / 0.8125rem',
    text: 'Laatst bijgewerkt 19 november',
  },
]

export function TypographyScale() {
  return (
    <ShowcaseSection
      eyebrow="Foundations"
      title="Typography"
      description="Headings use Merriweather, the Doremi brand font. Body text uses Lato. Headings h1–h3 change size with the screen width."
    >
      <Stack divider={<Divider flexItem />} spacing={2.5}>
        {SAMPLES.map(({ variant, meta, text }) => (
          <Stack
            key={variant}
            direction={{ xs: 'column', md: 'row' }}
            spacing={{ xs: 0.5, md: 4 }}
            sx={{ alignItems: { md: 'baseline' } }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ width: { md: 220 }, flexShrink: 0, fontFamily: 'monospace' }}
            >
              {meta}
            </Typography>
            <Typography variant={variant} component="p">
              {text}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </ShowcaseSection>
  )
}
