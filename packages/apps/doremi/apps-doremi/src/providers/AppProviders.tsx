import { useState, type ReactNode } from 'react'
import { QueryClientProvider, useQuery, type QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { profileQueryOptions } from '@doremi/apps-doremi-data-profile'
import { appRoutes } from '@doremi/apps-doremi-utils-routes'
import { theme } from '@doremi/org-ui-theme'
import { RouteTableProvider } from '@doremi/web-utils-router'
import { AppI18nProvider } from './AppI18nProvider'
import { createAppQueryClient } from './queryClient'

/**
 * Gives the route table the role of the current user. The role comes from the API (`GET /api/profile`):
 * `guest` until the answer is there, and for a visitor who is not signed in.
 * The role only decides which links and screens are drawn. The API checks every request itself.
 */
function SessionRoutes({ children }: { children: ReactNode }) {
  const { data: profile } = useQuery(profileQueryOptions())

  return (
    <RouteTableProvider table={appRoutes} role={profile?.role ?? 'guest'}>
      {children}
    </RouteTableProvider>
  )
}

type Props = {
  children: ReactNode
  /** Tests give a client that already knows the user, so no test calls the API. */
  queryClient?: QueryClient
}

/** All global providers in one place. Router is mounted inside, in App.tsx. */
export function AppProviders({ children, queryClient }: Props) {
  const [client] = useState(() => queryClient ?? createAppQueryClient())

  return (
    <QueryClientProvider client={client}>
      <AppI18nProvider>
        {/* noSsr: client-only app, read the saved mode on the first render.
            disableTransitionOnChange: no color animations when the mode changes. */}
        <ThemeProvider theme={theme} noSsr disableTransitionOnChange>
          <CssBaseline enableColorScheme />
          <SessionRoutes>{children}</SessionRoutes>
        </ThemeProvider>
      </AppI18nProvider>
      {/* Devtools are tree-shaken from production builds */}
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </QueryClientProvider>
  )
}
