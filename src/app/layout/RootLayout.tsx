import { Trans } from '@lingui/react/macro'
import { faSuitcaseRolling } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { Outlet, Link as RouterLink } from 'react-router'
import { ThemeModeToggle } from '@/features/theme-mode/ThemeModeToggle'
import { paths } from '@/shared/config/paths'
import { BottomNav } from './BottomNav'

const year = new Date().getFullYear()

export function RootLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AppBar position="sticky">
        <Toolbar>
          <Stack
            component={RouterLink}
            to={paths.home}
            aria-label="Doremi op reis"
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: 'center',
              color: 'primary.main',
              textDecoration: 'none',
              flexGrow: 1,
            }}
          >
            <FontAwesomeIcon icon={faSuitcaseRolling} size="lg" />
            <Typography variant="h6" component="span" noWrap>
              Doremi op reis
            </Typography>
          </Stack>

          <ThemeModeToggle />
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ flexGrow: 1, py: { xs: 3, md: 6 } }}>
        <Outlet />
      </Container>

      <Box component="footer" sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">
          <Trans>© {year} Doremi op reis</Trans>
          {' · '}
          <Link component={RouterLink} to={paths.about} color="inherit">
            <Trans>About</Trans>
          </Link>
        </Typography>
      </Box>

      <BottomNav />
    </Box>
  )
}
