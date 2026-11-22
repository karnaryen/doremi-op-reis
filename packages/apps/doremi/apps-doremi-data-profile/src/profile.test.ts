import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HttpError } from '@doremi/org-data-api'
import { profileQueryOptions, type Profile } from './profile'

const profile: Profile = { name: 'Anna', email: 'anna@example.com', role: 'teacher' }

function stubFetch(response: Response) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

afterEach(() => vi.unstubAllGlobals())

describe('profileQueryOptions', () => {
  it('fetches the profile from the API', async () => {
    const fetchMock = stubFetch(Response.json(profile))

    await expect(client().fetchQuery(profileQueryOptions())).resolves.toEqual(profile)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/profile')
  })

  it('fails with HttpError when the user is not signed in', async () => {
    stubFetch(new Response(null, { status: 401, statusText: 'Unauthorized' }))

    await expect(client().fetchQuery(profileQueryOptions())).rejects.toBeInstanceOf(HttpError)
  })
})
