import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AppProviders } from '@/app/providers/AppProviders'
import { routes } from '@/app/routes'

/** Renders the real route tree + providers at a given URL. */
export function renderRoute(url = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [url] })
  return {
    router,
    ...render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    ),
  }
}
