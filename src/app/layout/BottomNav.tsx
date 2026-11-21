import { useLingui } from '@lingui/react/macro'
import { faCircleUser, faHouse } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Paper from '@mui/material/Paper'
import { Link as RouterLink, useLocation } from 'react-router'
import { paths } from '@/shared/config/paths'

/**
 * Bottom navigation with the app sections (see docs/product/users.md#navigation).
 * Role-specific sections (Students) are added with authentication.
 */
export function BottomNav() {
  const { t } = useLingui()
  const { pathname } = useLocation()

  const sections = [
    { to: paths.home, label: t`Main`, icon: faHouse },
    { to: paths.profile, label: t`Profile`, icon: faCircleUser },
  ]
  const active = sections.find((s) => s.to === pathname)?.to ?? false

  return (
    <Paper
      component="nav"
      square
      elevation={0}
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 'appBar',
        borderTop: 1,
        borderColor: 'divider',
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation showLabels value={active} sx={{ bgcolor: 'transparent' }}>
        {sections.map(({ to, label, icon }) => (
          <BottomNavigationAction
            key={to}
            component={RouterLink}
            to={to}
            value={to}
            label={label}
            icon={<FontAwesomeIcon icon={icon} fixedWidth />}
          />
        ))}
      </BottomNavigation>
    </Paper>
  )
}
