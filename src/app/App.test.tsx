import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '@/test/renderRoute'

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
