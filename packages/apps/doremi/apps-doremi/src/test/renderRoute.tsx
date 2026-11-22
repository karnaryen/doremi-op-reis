import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { setSession, type Profile } from '@doremi/apps-doremi-data-profile'
import { AppProviders } from '../providers/AppProviders'
import { createAppQueryClient } from '../providers/queryClient'
import { routes } from '../routes'

export const teacher: Profile = {
  id: 1,
  name: 'Tessa Teacher',
  email: 'tessa@example.test',
  role: 'teacher',
  childName: null,
}

export const parent: Profile = {
  id: 2,
  name: 'Paula Parent',
  email: 'paula@example.test',
  role: 'parent',
  childName: 'Charlie',
}

/** A query client that already knows who is signed in (`null`: a guest), so no test asks the API. */
export function sessionClient(profile: Profile | null) {
  const queryClient = createAppQueryClient()
  setSession(queryClient, profile)
  return queryClient
}

/**
 * Renders the real route tree + providers at a given URL.
 * `profile` is the signed-in user (default: a guest). It is put into the query cache,
 * so the app does not ask the API who the user is.
 */
export function renderRoute(url = '/', { profile = null }: { profile?: Profile | null } = {}) {
  const queryClient = sessionClient(profile)
  const router = createMemoryRouter(routes, { initialEntries: [url] })

  return {
    router,
    queryClient,
    ...render(
      <AppProviders queryClient={queryClient}>
        <RouterProvider router={router} />
      </AppProviders>,
    ),
  }
}
