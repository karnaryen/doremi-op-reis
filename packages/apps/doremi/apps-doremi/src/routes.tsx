import { homepageScreens } from '@doremi/apps-doremi-module-homepage'
import { parentsMainScreens } from '@doremi/apps-doremi-module-parents-main'
import { profileScreens } from '@doremi/apps-doremi-module-profile'
import { teachersMainScreens } from '@doremi/apps-doremi-module-teachers-main'
import { teachersStudentsScreens } from '@doremi/apps-doremi-module-teachers-students'
import { NotFoundPage, RootLayout, RouteErrorPage } from '@doremi/apps-doremi-ui-layout'
import { appRoutes, type AppRouteId } from '@doremi/apps-doremi-utils-routes'
import { toRouteObjects, type Screen } from '@doremi/web-utils-router'
import type { RouteObject } from 'react-router'
import { ForbiddenScreen } from './ForbiddenScreen'

/**
 * One screen for every route of the table. Each module gives the screens of its own routes.
 * A route without a screen is a type error here.
 */
const appScreens: Record<AppRouteId, Screen> = {
  ...homepageScreens,
  ...teachersMainScreens,
  ...teachersStudentsScreens,
  ...parentsMainScreens,
  ...profileScreens,
}

/**
 * React Router routes, built from the table. For a route the user may not open,
 * `ForbiddenScreen` is drawn: a guest goes to the sign-in page, another role sees the 404 page.
 */
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      ...toRouteObjects(appRoutes, appScreens, ForbiddenScreen),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
