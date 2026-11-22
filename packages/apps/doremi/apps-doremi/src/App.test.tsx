import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { RouteLink } from '@doremi/apps-doremi-utils-routes'
import { useSessionStore } from '@doremi/org-utils-auth'
import { useLocaleStore } from '@doremi/org-utils-i18n'
import { AppProviders } from './providers/AppProviders'
import { renderRoute } from './test/renderRoute'

afterEach(() => {
  useSessionStore.getState().setRole('guest')
  useLocaleStore.getState().setLocale('en')
})

describe('routing', () => {
  it('renders the home page', async () => {
    renderRoute('/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Doremi op reis' })).toBeVisible()
  })

  it('shows the design-system sections on the home page', async () => {
    renderRoute('/')
    for (const name of [
      'Color',
      'Typography',
      'Actions',
      'Inputs',
      'Feedback and navigation',
      'Cards',
    ]) {
      expect(await screen.findByRole('heading', { level: 2, name })).toBeInTheDocument()
    }
  })

  it('keeps an accessible name on the logo link', async () => {
    renderRoute('/')
    expect(await screen.findByRole('link', { name: 'Doremi op reis' })).toBeInTheDocument()
  })

  it('navigates to the lazy about page', async () => {
    renderRoute('/')
    await userEvent.click(await screen.findByRole('link', { name: 'About' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'About' })).toBeVisible()
  })

  it('changes the language on the profile page', async () => {
    renderRoute('/')
    await userEvent.click(await screen.findByRole('link', { name: 'Profile' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Profile' })).toBeVisible()

    await userEvent.click(screen.getByRole('radio', { name: 'Nederlands' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Profiel' })).toBeVisible()

    await userEvent.click(screen.getByRole('radio', { name: 'English' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Profile' })).toBeVisible()
  })

  it('shows 404 for unknown routes', async () => {
    renderRoute('/does-not-exist')
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeVisible()
  })
})

describe('access', () => {
  it('shows a guest the sections Home and Profile, not Main', async () => {
    renderRoute('/')
    expect(await screen.findByRole('link', { name: 'Profile' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Main' })).not.toBeInTheDocument()
  })

  it.each(['teacher', 'parent'] as const)('does not show Home to a signed-in %s', async (role) => {
    useSessionStore.getState().setRole(role)
    renderRoute('/profile')

    expect(await screen.findByRole('link', { name: 'Main' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Home' })).not.toBeInTheDocument()
  })

  it('shows 404 when a guest opens a teacher URL', async () => {
    renderRoute('/teacher/active')
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeVisible()
  })

  it('opens the first tab of the teacher section', async () => {
    useSessionStore.getState().setRole('teacher')
    const { router } = renderRoute('/')

    await userEvent.click(await screen.findByRole('link', { name: 'Main' }))

    expect(await screen.findByRole('tab', { name: 'To review', selected: true })).toBeVisible()
    expect(router.state.location.pathname).toBe('/teacher/to-review')
    expect(screen.getByText('No recordings to review yet.')).toBeVisible()
  })

  it('lets a teacher open a teacher URL directly', async () => {
    useSessionStore.getState().setRole('teacher')
    renderRoute('/teacher/active')

    expect(await screen.findByText('No active assignments yet.')).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Active', selected: true })).toBeVisible()
  })

  it('opens the first tab of the parent section', async () => {
    useSessionStore.getState().setRole('parent')
    const { router } = renderRoute('/parent')

    expect(await screen.findByRole('tab', { name: 'Active', selected: true })).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Completed' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/parent/active')
  })

  it('shows 404 when a parent opens a teacher URL', async () => {
    useSessionStore.getState().setRole('parent')
    renderRoute('/teacher/to-review')

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeVisible()
    expect(screen.queryByText('No recordings to review yet.')).not.toBeInTheDocument()
  })

  it('shows breadcrumbs only below a section', async () => {
    useSessionStore.getState().setRole('teacher')
    renderRoute('/teacher/completed')

    const crumbs = await screen.findByRole('navigation', { name: 'Breadcrumbs' })
    expect(within(crumbs).getByRole('link', { name: 'Main' })).toHaveAttribute('href', '/teacher')
    expect(within(crumbs).getByText('Completed')).toHaveAttribute('aria-current', 'page')
  })

  it('shows no breadcrumbs on a top-level page', async () => {
    renderRoute('/profile')

    expect(await screen.findByRole('heading', { level: 1, name: 'Profile' })).toBeVisible()
    expect(screen.queryByRole('navigation', { name: 'Breadcrumbs' })).not.toBeInTheDocument()
  })

  it('switches the role in the development role preview', async () => {
    renderRoute('/profile')
    await userEvent.click(await screen.findByRole('radio', { name: 'Teacher' }))
    expect(await screen.findByRole('link', { name: 'Main' })).toBeInTheDocument()
  })
})

describe('RouteLink', () => {
  function Links() {
    return (
      <>
        <RouteLink to="profile">to profile</RouteLink>
        <RouteLink to="teacher.active">to teacher</RouteLink>
      </>
    )
  }

  function renderLinks() {
    const router = createMemoryRouter([{ path: '/', element: <Links /> }])
    return render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    )
  }

  it('does not draw a link the user may not open', () => {
    renderLinks()
    expect(screen.getByRole('link', { name: 'to profile' })).toHaveAttribute('href', '/profile')
    expect(screen.queryByRole('link', { name: 'to teacher' })).not.toBeInTheDocument()
  })

  it('draws the link when the role may open the route', () => {
    useSessionStore.getState().setRole('teacher')
    renderLinks()
    expect(screen.getByRole('link', { name: 'to teacher' })).toHaveAttribute(
      'href',
      '/teacher/active',
    )
  })
})

/** Never runs: the type checker reads it. Links to the route table are typed. */
export function TypedLinks() {
  return (
    <>
      <RouteLink to="teacher.toReview">ok</RouteLink>
      {/* @ts-expect-error a route that is not in the table */}
      <RouteLink to="teacher.students">wrong</RouteLink>
      {/* @ts-expect-error this route has no parameters */}
      <RouteLink to="profile" params={{ id: 1 }}>
        wrong
      </RouteLink>
    </>
  )
}
