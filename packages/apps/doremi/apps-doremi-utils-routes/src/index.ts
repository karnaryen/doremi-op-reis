import { msg } from '@lingui/core/macro'
import { faCircleUser, faHouse, faMusic } from '@fortawesome/free-solid-svg-icons'
import type { RouteId } from '@doremi/common-utils-routes'
import type { Role } from '@doremi/org-utils-auth'
import { bindRoutes, defineRoutesFor } from '@doremi/web-utils-router'

/** Types the table: `access` accepts only the roles of the organization. */
const defineRoutes = defineRoutesFor<Role>()

/**
 * The route table of the app: every URL, who may open it, and its place in the navigation.
 * The router, the navigation, the breadcrumbs, the tabs and the access checks are built from it.
 * It has no screens: each module gives the screens of its own routes (`routeScreens.ts`).
 *
 * - Route id: the path of keys, for example `teacher.toReview`.
 * - `access`: roles that may open the route. Children inherit it or narrow it. No `access`: everyone.
 *   It only hides links and screens. It is not security: the API must check access itself.
 * - `index`: the child that opens when the user opens the route itself.
 * - `meta.navFor`: roles that see the route in the navigation. Omitted: all roles that may open it.
 * - `meta.nav`: `section` is an item of the main navigation (in table order), `tab` a tab of its parent.
 *
 * Sections and tabs: docs/product/users.md#navigation.
 */
export const appRoutes = defineRoutes({
  // Everyone may open the homepage, but only a guest has it in the navigation:
  // a signed-in user has "Main" instead.
  home: {
    path: '',
    meta: { label: msg`Home`, icon: faHouse, nav: 'section', navFor: ['guest'] },
  },
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
