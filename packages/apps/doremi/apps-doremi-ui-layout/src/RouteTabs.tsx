import { useLingui } from '@lingui/react/macro'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useTabs, type AppRouteId } from '@doremi/apps-doremi-utils-routes'
import { Link as RouterLink } from 'react-router'

type Props = {
  /** Route whose children with `nav: 'tab'` are the tabs. */
  parent: AppRouteId
  'aria-label': string
}

/** Tabs built from the route table. A tab the user may not open is not drawn. */
export function RouteTabs({ parent, 'aria-label': ariaLabel }: Props) {
  const { t } = useLingui()
  const tabs = useTabs(parent)
  const active = tabs.find((tab) => tab.active)?.id

  return (
    <Tabs value={active ?? false} aria-label={ariaLabel} variant="scrollable" scrollButtons="auto">
      {tabs.map(({ id, to, label }) => (
        <Tab key={id} component={RouterLink} to={to} value={id} label={t(label)} />
      ))}
    </Tabs>
  )
}
