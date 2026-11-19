import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '@/test/renderRoute'

describe('routing', () => {
  it('renders the home page', async () => {
    renderRoute('/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Doremi op reis' })).toBeVisible()
  })

  it('navigates to the lazy about page', async () => {
    renderRoute('/')
    await userEvent.click(await screen.findByRole('link', { name: 'About' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'About' })).toBeVisible()
  })

  it('shows 404 for unknown routes', async () => {
    renderRoute('/does-not-exist')
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeVisible()
  })
})
