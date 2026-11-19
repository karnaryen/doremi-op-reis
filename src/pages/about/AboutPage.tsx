import { Trans } from '@lingui/react/macro'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export function AboutPage() {
  return (
    <Stack spacing={2} sx={{ maxWidth: 720 }}>
      <Typography variant="h3" component="h1">
        <Trans>About</Trans>
      </Typography>
      <Typography color="text.secondary">
        <Trans>Doremi op reis is a React single-page app. Content will follow.</Trans>
      </Typography>
    </Stack>
  )
}
