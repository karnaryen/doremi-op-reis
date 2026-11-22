import { Trans, useLingui } from '@lingui/react/macro'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Outlet } from 'react-router'
import { RouteTabs } from '@doremi/apps-doremi-ui-layout'
import { useTabs } from '@doremi/apps-doremi-utils-routes'

/**
 * Section "Main" of the teacher: title, tabs and the open tab.
 * The screen of one Assignment is a child route too, but not a tab: it gets the whole page.
 */
export function TeacherMain() {
  const { t } = useLingui()
  const tabOpen = useTabs('teacher').some((tab) => tab.active)

  if (!tabOpen) return <Outlet />

  return (
    <Stack spacing={3}>
      <Typography variant="h3" component="h1">
        <Trans>Main</Trans>
      </Typography>
      <RouteTabs parent="teacher" aria-label={t`Pieces`} />
      <Outlet />
    </Stack>
  )
}
