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
import { ThemeModeToggle } from '@doremi/web-ui-theme-mode'
import { useLinkTo } from '@doremi/apps-doremi-utils-routes'
import { BottomNav } from './BottomNav'
import { RouteBreadcrumbs } from './RouteBreadcrumbs'
import { TopNav } from './TopNav'

const year = new Date().getFullYear()

export function RootLayout() {
  const linkTo = useLinkTo()
  const about = linkTo('about')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AppBar position="sticky">
        <Toolbar>
          <Stack
            component={RouterLink}
            to={linkTo('home') ?? '/'}
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

          <TopNav />
          <ThemeModeToggle />
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ flexGrow: 1, py: { xs: 3, md: 6 } }}>
        <RouteBreadcrumbs />
        <Outlet />
      </Container>

      <Box component="footer" sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">
          <Trans>© {year} Doremi op reis</Trans>
          {about && (
            <>
              {' · '}
              <Link component={RouterLink} to={about} color="inherit">
                <Trans>About</Trans>
              </Link>
            </>
          )}
        </Typography>
      </Box>

      <BottomNav />
    </Box>
  )
}
