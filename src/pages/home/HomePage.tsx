import { Trans } from '@lingui/react/macro'
import { faCompass, faMapLocationDot, faMusic } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

type Highlight = { icon: typeof faMusic; title: ReactNode; body: ReactNode }

export function HomePage() {
  const highlights: Highlight[] = [
    {
      icon: faCompass,
      title: <Trans>Explore</Trans>,
      body: <Trans>Placeholder for the first feature.</Trans>,
    },
    {
      icon: faMapLocationDot,
      title: <Trans>Plan</Trans>,
      body: <Trans>Placeholder for the second feature.</Trans>,
    },
    {
      icon: faMusic,
      title: <Trans>Enjoy</Trans>,
      body: <Trans>Placeholder for the third feature.</Trans>,
    },
  ]

  return (
    <Stack spacing={6}>
      <Stack spacing={2} sx={{ textAlign: 'center', alignItems: 'center' }}>
        <Typography variant="h2" component="h1">
          Doremi op reis
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 560 }}>
          <Trans>Welcome! This is the MVP skeleton — features coming soon.</Trans>
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        {highlights.map(({ icon, title, body }, i) => (
          <Grid key={i} size={{ xs: 12, md: 4 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Typography color="primary" sx={{ fontSize: 28 }}>
                    <FontAwesomeIcon icon={icon} />
                  </Typography>
                  <Typography variant="h6" component="h2">
                    {title}
                  </Typography>
                  <Typography color="text.secondary">{body}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}
