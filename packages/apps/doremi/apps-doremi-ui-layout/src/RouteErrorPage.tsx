import { Trans } from '@lingui/react/macro'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { isRouteErrorResponse, useRouteError } from 'react-router'

/** Rendered by React Router when a route throws (render, loader or lazy import). */
export function RouteErrorPage() {
  const error = useRouteError()
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : null

  return (
    <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', py: 8, px: 2 }}>
      <Typography color="error" sx={{ fontSize: 48 }}>
        <FontAwesomeIcon icon={faTriangleExclamation} />
      </Typography>
      <Typography variant="h4" component="h1">
        <Trans>Something went wrong</Trans>
      </Typography>
      {detail && <Typography color="text.secondary">{detail}</Typography>}
      <Button variant="contained" onClick={() => window.location.assign('/')}>
        <Trans>Reload app</Trans>
      </Button>
    </Stack>
  )
}
