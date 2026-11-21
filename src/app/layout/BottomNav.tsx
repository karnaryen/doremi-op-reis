import { useLingui } from '@lingui/react/macro'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Paper from '@mui/material/Paper'
import { Link as RouterLink } from 'react-router'
import { useSections } from './useSections'

/** Section navigation for phones. Hidden from `sm` up, where TopNav takes over. */
export function BottomNav() {
  const { t } = useLingui()
  const { sections, active } = useSections()

  return (
    <Paper
      component="nav"
      aria-label={t`Sections`}
      square
      elevation={0}
      sx={{
        display: { xs: 'block', sm: 'none' },
        position: 'sticky',
        bottom: 0,
        zIndex: 'appBar',
        borderTop: 1,
        borderColor: 'divider',
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation showLabels value={active ?? false} sx={{ bgcolor: 'transparent' }}>
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
