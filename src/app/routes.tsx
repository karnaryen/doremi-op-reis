import type { RouteObject } from 'react-router'
import { RouteErrorPage } from '@/pages/error/RouteErrorPage'
import { HomePage } from '@/pages/home/HomePage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { paths } from '@/shared/config/paths'
import { RootLayout } from './layout/RootLayout'

/** Route tree. Eager-load the landing page, lazy-load the rest for smaller initial bundles. */
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: paths.about,
        lazy: async () => ({ Component: (await import('@/pages/about/AboutPage')).AboutPage }),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
