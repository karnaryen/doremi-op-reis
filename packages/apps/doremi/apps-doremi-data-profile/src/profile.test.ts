import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HttpError } from '@doremi/org-data-api'
import { profileQueryKey, profileQueryOptions, setSession, type Profile } from './profile'

const profile: Profile = {
  id: 1,
  name: 'Anna',
  email: 'anna@example.com',
  role: 'teacher',
  childName: null,
}

function stubFetch(response: Response) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

afterEach(() => vi.unstubAllGlobals())

describe('profileQueryOptions', () => {
  it('fetches the profile from the API with the session cookie', async () => {
    const fetchMock = stubFetch(Response.json(profile))

    await expect(client().fetchQuery(profileQueryOptions())).resolves.toEqual(profile)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/profile')
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ credentials: 'include' })
  })

  it('is null for a guest', async () => {
    stubFetch(Response.json(null))

    await expect(client().fetchQuery(profileQueryOptions())).resolves.toBeNull()
  })

  it('fails with HttpError when the API does not work', async () => {
    stubFetch(Response.json({ error: 'server_error', message: 'Oops' }, { status: 500 }))

    await expect(client().fetchQuery(profileQueryOptions())).rejects.toBeInstanceOf(HttpError)
  })
})

describe('setSession', () => {
  it('saves the user and drops the data of the previous user', () => {
    const queryClient = client()
    queryClient.setQueryData(['students'], [{ id: 1 }])

    setSession(queryClient, profile)

    expect(queryClient.getQueryData(profileQueryKey)).toEqual(profile)
    expect(queryClient.getQueryData(['students'])).toBeUndefined()
  })
})
