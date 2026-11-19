import { useState, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { createQueryClient } from '@/shared/api/queryClient'
import { theme } from '@/shared/theme/theme'
import { AppI18nProvider } from './AppI18nProvider'

/** All global providers in one place. Router is mounted inside, in App.tsx. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <AppI18nProvider>
        <ThemeProvider theme={theme} defaultMode="system">
          <CssBaseline enableColorScheme />
          {children}
        </ThemeProvider>
      </AppI18nProvider>
      {/* Devtools are tree-shaken from production builds */}
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </QueryClientProvider>
  )
}
