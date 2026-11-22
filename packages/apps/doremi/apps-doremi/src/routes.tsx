import { homepageScreens } from '@doremi/apps-doremi-module-homepage'
import { parentsMainScreens } from '@doremi/apps-doremi-module-parents-main'
import { profileScreens } from '@doremi/apps-doremi-module-profile'
import { teachersMainScreens } from '@doremi/apps-doremi-module-teachers-main'
import { NotFoundPage, RootLayout, RouteErrorPage } from '@doremi/apps-doremi-utils-layout'
import { appRoutes, type AppRouteId } from '@doremi/apps-doremi-utils-routes'
import { toRouteObjects, type Screen } from '@doremi/web-utils-router'
import type { RouteObject } from 'react-router'

/**
 * One screen for every route of the table. Each module gives the screens of its own routes.
 * A route without a screen is a type error here.
 */
const appScreens: Record<AppRouteId, Screen> = {
  ...homepageScreens,
  ...teachersMainScreens,
  ...parentsMainScreens,
  ...profileScreens,
}

/** React Router routes, built from the table. A route the user may not open shows the 404 page. */
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      ...toRouteObjects(appRoutes, appScreens, NotFoundPage),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
