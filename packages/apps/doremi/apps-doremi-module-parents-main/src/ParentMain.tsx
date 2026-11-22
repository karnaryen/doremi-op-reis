import { Trans, useLingui } from '@lingui/react/macro'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Outlet } from 'react-router'
import { useProfile } from '@doremi/apps-doremi-data-profile'
import { RouteTabs } from '@doremi/apps-doremi-ui-layout'
import { useTabs } from '@doremi/apps-doremi-utils-routes'

/**
 * Section "Main" of the parent: the name of the child, the tabs and the open tab.
 * The piece card and the upload screen are child routes too, but not tabs: they get the whole page.
 */
export function ParentMain() {
  const { t } = useLingui()
  const childName = useProfile()?.childName
  const tabOpen = useTabs('parent').some((tab) => tab.active)

  if (!tabOpen) return <Outlet />

  return (
    <Stack spacing={3}>
      <Typography variant="h3" component="h1">
        {childName ? <Trans>Pieces of {childName}</Trans> : <Trans>Main</Trans>}
      </Typography>
      <RouteTabs parent="parent" aria-label={t`Pieces`} />
      <Outlet />
    </Stack>
  )
}
