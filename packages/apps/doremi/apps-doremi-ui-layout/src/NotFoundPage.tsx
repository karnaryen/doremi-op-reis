import { Trans } from '@lingui/react/macro'
import { faSignsPost } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useLinkTo, useMainLink } from '@doremi/apps-doremi-utils-routes'
import { Link as RouterLink } from 'react-router'

/** Drawn for an unknown URL and for a route the current user may not open. */
export function NotFoundPage() {
  const linkTo = useLinkTo()
  const start = useMainLink() ?? linkTo('home') ?? '/'

  return (
    <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', py: 8 }}>
      <Typography color="text.secondary" sx={{ fontSize: 48 }}>
        <FontAwesomeIcon icon={faSignsPost} />
      </Typography>
      <Typography variant="h4" component="h1">
        <Trans>Page not found</Trans>
      </Typography>
      <Button component={RouterLink} to={start} variant="contained">
        <Trans>Back home</Trans>
      </Button>
    </Stack>
  )
}
