import { queryOptions, useQuery, type QueryClient } from '@tanstack/react-query'
import { http } from '@doremi/org-data-api'

/** The signed-in user, as the API returns it. */
export type Profile = {
  id: number
  name: string
  email: string
  role: 'teacher' | 'parent'
  /** For a parent: the name of the child. */
  childName: string | null
}

export const profileQueryKey = ['profile'] as const

/**
 * TanStack Query options for the signed-in user. The API answers `null` for a guest:
 * "nobody is signed in" is a normal state of the app, not an error.
 * Use: `useQuery(profileQueryOptions())`, or `useProfile()`.
 */
export function profileQueryOptions() {
  return queryOptions({
    queryKey: profileQueryKey,
    queryFn: ({ signal }) => http<Profile | null>('/api/profile', { signal }),
    // The session changes only by the mutations in auth.ts, and they update this entry themselves.
    staleTime: 5 * 60_000,
  })
}

/** The signed-in user, or `null` for a guest and while the first answer of the API is on its way. */
export function useProfile(): Profile | null {
  return useQuery(profileQueryOptions()).data ?? null
}

/**
 * Saves who is signed in now (`null`: nobody) and drops all other cached data:
 * the data of one user must never be shown to the next user of the same browser.
 */
export function setSession(client: QueryClient, profile: Profile | null) {
  client.setQueryData(profileQueryKey, profile)
  client.removeQueries({ predicate: (query) => query.queryKey[0] !== profileQueryKey[0] })
}
