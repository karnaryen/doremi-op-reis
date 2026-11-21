import { useLingui } from '@lingui/react/macro'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { Link as RouterLink } from 'react-router'
import { useSections } from './useSections'

/** Section navigation in the top bar for tablet and desktop. Hidden on phones. */
export function TopNav() {
  const { t } = useLingui()
  const { sections, active } = useSections()

  return (
    <Stack
      component="nav"
      aria-label={t`Sections`}
      direction="row"
      spacing={1}
      sx={{ display: { xs: 'none', sm: 'flex' }, mr: 1 }}
    >
      {sections.map(({ to, label, icon }) => {
        const current = to === active
        return (
          <Button
            key={to}
            component={RouterLink}
            to={to}
            aria-current={current ? 'page' : undefined}
            startIcon={<FontAwesomeIcon icon={icon} fixedWidth />}
            sx={{
              fontWeight: 400,
              color: current ? 'primary.contrastText' : 'text.secondary',
              bgcolor: current ? 'primary.main' : 'transparent',
              '&:hover': { bgcolor: current ? 'primary.dark' : 'action.hover' },
            }}
          >
            {label}
          </Button>
        )
      })}
    </Stack>
  )
}
