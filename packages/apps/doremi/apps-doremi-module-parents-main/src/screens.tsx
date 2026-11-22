import { Trans, useLingui } from '@lingui/react/macro'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { RouteTabs } from '@doremi/apps-doremi-utils-layout'
import { Outlet } from 'react-router'

/** Section "Main" of the parent: title, tabs and the open tab. */
export function ParentMain() {
  const { t } = useLingui()

  return (
    <Stack spacing={3}>
      <Typography variant="h3" component="h1">
        <Trans>Main</Trans>
      </Typography>
      <RouteTabs parent="parent" aria-label={t`Assignments`} />
      <Outlet />
    </Stack>
  )
}

export function ActiveTab() {
  return (
    <Typography color="text.secondary">
      <Trans>No active assignments yet.</Trans>
    </Typography>
  )
}

export function CompletedTab() {
  return (
    <Typography color="text.secondary">
      <Trans>No completed assignments yet.</Trans>
    </Typography>
  )
}
