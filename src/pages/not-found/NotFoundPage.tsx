import { Trans } from '@lingui/react/macro'
import { faSignsPost } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'
import { paths } from '@/shared/config/paths'

export function NotFoundPage() {
  return (
    <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', py: 8 }}>
      <Typography color="text.secondary" sx={{ fontSize: 48 }}>
        <FontAwesomeIcon icon={faSignsPost} />
      </Typography>
      <Typography variant="h4" component="h1">
        <Trans>Page not found</Trans>
      </Typography>
      <Button component={RouterLink} to={paths.home} variant="contained">
        <Trans>Back home</Trans>
      </Button>
    </Stack>
  )
}
