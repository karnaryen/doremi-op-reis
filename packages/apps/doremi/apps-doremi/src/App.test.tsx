import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { RouteLink } from '@doremi/apps-doremi-utils-routes'
import { useSessionStore } from '@doremi/org-utils-auth'
import { renderRoute } from './test/renderRoute'

afterEach(() => useSessionStore.getState().setRole('guest'))

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
  it('does not draw the Main section for a guest', async () => {
    renderRoute('/')
    expect(await screen.findByRole('link', { name: 'Profile' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Main' })).not.toBeInTheDocument()
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

  it('shows only the parent tabs to a parent', async () => {
    useSessionStore.getState().setRole('parent')
    renderRoute('/parent')

    expect(await screen.findByRole('tab', { name: 'Active', selected: true })).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Completed' })).toBeVisible()
    expect(screen.queryByRole('tab', { name: 'To review' })).not.toBeInTheDocument()
  })

  it('switches the role in the development role preview', async () => {
    renderRoute('/profile')
    await userEvent.click(await screen.findByRole('radio', { name: 'Teacher' }))
    expect(await screen.findByRole('link', { name: 'Main' })).toBeInTheDocument()
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
