import { useQuery } from '@tanstack/react-query'
import { Navigate, useLocation } from 'react-router'
import { profileQueryOptions } from '@doremi/apps-doremi-data-profile'
import { NotFoundPage, PageLoader } from '@doremi/apps-doremi-ui-layout'
import { useLinkTo, useMainLink } from '@doremi/apps-doremi-utils-routes'

/**
 * Drawn in the place of a screen that the current user may not open (see `toRouteObjects`).
 *
 * - The app does not know yet who the user is (the first answer of the API is on its way): wait.
 *   Without this a signed-in user who reloads a page would be sent to the sign-in page for a moment.
 *   Also wait when the answer is there but the route table does not have the role yet (it gets it one render later).
 * - A guest: go to the sign-in page, and remember the page for after the sign-in.
 * - A signed-in user with the wrong role: the page does not exist for them.
 */
export function ForbiddenScreen() {
  const { data: profile, isPending } = useQuery(profileQueryOptions())
  const linkTo = useLinkTo()
  const location = useLocation()
  const signIn = linkTo('signIn')
  const roleKnown = useMainLink() !== null

  if (isPending || (profile && !roleKnown)) return <PageLoader />
  if (!profile && signIn) {
    return <Navigate to={signIn} replace state={{ from: location.pathname }} />
  }
  return <NotFoundPage />
}
