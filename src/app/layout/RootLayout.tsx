import { Trans, useLingui } from '@lingui/react/macro'
import { faSuitcaseRolling } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { NavLink, Outlet, Link as RouterLink } from 'react-router'
import { LocaleSwitcher } from '@/features/locale-switcher/LocaleSwitcher'
import { ThemeModeToggle } from '@/features/theme-mode/ThemeModeToggle'
import { paths } from '@/shared/config/paths'

const year = new Date().getFullYear()

export function RootLayout() {
  const { t } = useLingui()

  const nav = [
    { to: paths.home, label: t`Home` },
    { to: paths.about, label: t`About` },
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          <Stack
            component={RouterLink}
            to={paths.home}
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', color: 'inherit', textDecoration: 'none', mr: 3 }}
          >
            <FontAwesomeIcon icon={faSuitcaseRolling} size="lg" />
            <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
              Doremi op reis
            </Typography>
          </Stack>

          <Stack component="nav" direction="row" spacing={1} sx={{ flexGrow: 1 }}>
            {nav.map(({ to, label }) => (
              <Button
                key={to}
                component={NavLink}
                to={to}
                end
                color="inherit"
                sx={{ '&.active': { textDecoration: 'underline', textUnderlineOffset: 6 } }}
              >
                {label}
              </Button>
            ))}
          </Stack>

          <LocaleSwitcher />
          <ThemeModeToggle />
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ flexGrow: 1, py: { xs: 3, md: 6 } }}>
        <Outlet />
      </Container>

      <Box component="footer" sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">
          <Trans>© {year} Doremi op reis</Trans>
        </Typography>
      </Box>
    </Box>
  )
}
