import type { RouteObject } from 'react-router'
import { RouteErrorPage } from '@/pages/error/RouteErrorPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { paths } from '@/shared/config/paths'
import { RootLayout } from './layout/RootLayout'

/** Route tree. All pages are lazy-loaded for smaller initial bundles. */
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('@/pages/home/HomePage')).HomePage }),
      },
      {
        path: paths.about,
        lazy: async () => ({ Component: (await import('@/pages/about/AboutPage')).AboutPage }),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
