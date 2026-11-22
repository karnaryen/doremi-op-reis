import { useLingui } from '@lingui/react/macro'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'

/** Shown while the data of a screen is loading. */
export function PageLoader() {
  const { t } = useLingui()

  return (
    <Stack sx={{ alignItems: 'center', py: 8 }}>
      <CircularProgress aria-label={t`Loading`} />
    </Stack>
  )
}
