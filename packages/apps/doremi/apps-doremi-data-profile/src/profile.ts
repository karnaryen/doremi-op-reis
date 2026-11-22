import { queryOptions } from '@tanstack/react-query'
import { http } from '@doremi/org-data-api'

/** The signed-in user, as the API returns it. */
export type Profile = {
  name: string
  email: string
  role: 'teacher' | 'parent'
}

/**
 * TanStack Query options for the profile of the signed-in user.
 * The endpoint does not exist yet: it comes with sign-in (roadmap phase 4), so no screen uses this.
 * Use: `useQuery(profileQueryOptions())`.
 */
export function profileQueryOptions() {
  return queryOptions({
    queryKey: ['profile'],
    queryFn: ({ signal }) => http<Profile>('/api/profile', { signal }),
  })
}
