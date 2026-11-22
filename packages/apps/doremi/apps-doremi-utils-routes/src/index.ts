import { msg } from '@lingui/core/macro'
import { faCircleUser, faHouse, faMusic } from '@fortawesome/free-solid-svg-icons'
import type { RouteId } from '@doremi/common-utils-routes'
import { defineRoutes } from '@doremi/org-utils-auth'
import { bindRoutes } from '@doremi/web-utils-router'

/**
 * The route table of the app: every URL, who may open it, and its place in the navigation.
 * The router, the navigation, the breadcrumbs, the tabs and the access checks are built from it.
 * It has no screens: each module gives the screens of its own routes (`routeScreens.ts`).
 *
 * - Route id: the path of keys, for example `teacher.toReview`.
 * - `access`: roles that may open the route. Children inherit it. No `access`: everyone.
 * - `index`: the child that opens when the user opens the route itself.
 * - `meta.nav`: `section` is an item of the main navigation (in table order), `tab` a tab of its parent.
 *
 * Sections and tabs: docs/product/users.md#navigation.
 */
export const appRoutes = defineRoutes({
  home: { path: '', meta: { label: msg`Home`, icon: faHouse, nav: 'section' } },
  about: { path: 'about', meta: { label: msg`About` } },

  teacher: {
    path: 'teacher',
    access: ['teacher'],
    index: 'toReview',
    meta: { label: msg`Main`, icon: faMusic, nav: 'section' },
    children: {
      toReview: { path: 'to-review', meta: { label: msg`To review`, nav: 'tab' } },
      active: { path: 'active', meta: { label: msg`Active`, nav: 'tab' } },
      completed: { path: 'completed', meta: { label: msg`Completed`, nav: 'tab' } },
    },
  },

  parent: {
    path: 'parent',
    access: ['parent'],
    index: 'active',
    meta: { label: msg`Main`, icon: faMusic, nav: 'section' },
    children: {
      active: { path: 'active', meta: { label: msg`Active`, nav: 'tab' } },
      completed: { path: 'completed', meta: { label: msg`Completed`, nav: 'tab' } },
    },
  },

  profile: { path: 'profile', meta: { label: msg`Profile`, icon: faCircleUser, nav: 'section' } },
})

/** Every route id of the app. */
export type AppRouteId = RouteId<typeof appRoutes>

/** Link helpers typed with `appRoutes`: a wrong route id or a missing param is a type error. */
export const { RouteLink, useLinkTo, useCanOpen, useTabs, defineScreens } = bindRoutes(appRoutes)
