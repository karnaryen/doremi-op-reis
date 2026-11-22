import { msg } from '@lingui/core/macro'
import { faCircleUser, faHouse, faMusic, faUserGroup } from '@fortawesome/free-solid-svg-icons'
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
 * - A child with the path `''` is the screen of its parent's own URL (see `students.list`).
 *
 * Sections and tabs: docs/product/users.md#navigation. Screens: docs/product/mobile-design.md#mvp-screens.
 */
export const appRoutes = defineRoutes({
  // Everyone may open the homepage, but only a guest has it in the navigation:
  // a signed-in user has "Main" instead.
  home: {
    path: '',
    meta: { label: msg`Home`, icon: faHouse, nav: 'section', navFor: ['guest'] },
  },
  about: { path: 'about', meta: { label: msg`About` } },
  // Developer page: the colors, the typography and the components of the theme.
  designSystem: { path: 'design-system', meta: { label: msg`Design system` } },

  // Open to everyone: a signed-in user is sent on to "Main" by the screen itself.
  signIn: { path: 'sign-in', meta: { label: msg`Sign in` } },
  signUp: { path: 'sign-up', meta: { label: msg`Teacher sign-up` } },
  // The page of the invitation link: /set-password#token=...
  setPassword: { path: 'set-password', meta: { label: msg`Choose a password` } },

  teacher: {
    path: 'teacher',
    access: ['teacher'],
    index: 'toReview',
    meta: { label: msg`Main`, icon: faMusic, nav: 'section' },
    children: {
      toReview: { path: 'to-review', meta: { label: msg`To review`, nav: 'tab' } },
      active: { path: 'active', meta: { label: msg`Active`, nav: 'tab' } },
      completed: { path: 'completed', meta: { label: msg`Completed`, nav: 'tab' } },
      // One Assignment: the recording, the feedback field, "Complete" and "Ask to try again".
      assignment: { path: 'assignments/:assignmentId', meta: { label: msg`Piece` } },
    },
  },

  students: {
    path: 'students',
    access: ['teacher'],
    meta: { label: msg`Students`, icon: faUserGroup, nav: 'section' },
    children: {
      list: { path: '' },
      add: { path: 'add', meta: { label: msg`Add parent` } },
      student: { path: ':studentId', meta: { label: msg`Student` } },
      parent: { path: ':studentId/parent', meta: { label: msg`Parent` } },
      assign: { path: ':studentId/assign', meta: { label: msg`Assign a piece` } },
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
      // The piece card.
      assignment: { path: 'assignments/:assignmentId', meta: { label: msg`Piece` } },
      upload: {
        path: 'assignments/:assignmentId/upload',
        meta: { label: msg`Send a recording` },
      },
    },
  },

  profile: { path: 'profile', meta: { label: msg`Profile`, icon: faCircleUser, nav: 'section' } },
})

/** Every route id of the app. */
export type AppRouteId = RouteId<typeof appRoutes>

/** Link helpers typed with `appRoutes`: a wrong route id or a missing param is a type error. */
export const { RouteLink, useLinkTo, useCanOpen, useTabs, defineScreens } = bindRoutes(appRoutes)

/**
 * The URL of the section "Main" of the signed-in user, or `null` for a guest.
 * A teacher may open only `teacher`, a parent only `parent`, so the route table already has the answer.
 */
export function useMainLink(): string | null {
  const linkTo = useLinkTo()
  return linkTo('teacher') ?? linkTo('parent')
}
