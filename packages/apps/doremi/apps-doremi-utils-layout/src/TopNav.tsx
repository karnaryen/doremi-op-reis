import { useLingui } from '@lingui/react/macro'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { useSections } from '@doremi/web-utils-router'
import { Link as RouterLink } from 'react-router'

/** Section navigation in the top bar for tablet and desktop. Hidden on phones. */
export function TopNav() {
  const { t } = useLingui()
  const sections = useSections()

  return (
    <Stack
      component="nav"
      aria-label={t`Sections`}
      direction="row"
      spacing={1}
      sx={{ display: { xs: 'none', sm: 'flex' }, mr: 1 }}
    >
      {sections.map(({ id, to, label, icon, active }) => (
        <Button
          key={id}
          component={RouterLink}
          to={to}
          aria-current={active ? 'page' : undefined}
          startIcon={icon && <FontAwesomeIcon icon={icon} fixedWidth />}
          sx={{
            fontWeight: 400,
            color: active ? 'primary.contrastText' : 'text.secondary',
            bgcolor: active ? 'primary.main' : 'transparent',
            '&:hover': { bgcolor: active ? 'primary.dark' : 'action.hover' },
          }}
        >
          {t(label)}
        </Button>
      ))}
    </Stack>
  )
}
