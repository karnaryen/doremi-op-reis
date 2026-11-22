import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import type { MessageDescriptor } from '@lingui/core'
import type { RouteBranch } from '@doremi/common-utils-routes'

/** What the web app needs to draw a route in the navigation. */
export type NavMeta = {
  /** Lingui message (`msg` macro). The component that draws it translates it. */
  readonly label: MessageDescriptor
  readonly icon?: IconDefinition
  /** `section`: an item of the main navigation. `tab`: a tab inside its parent route. */
  readonly nav?: 'section' | 'tab'
}

/**
 * Returns a helper that types a route table for the given roles.
 * The helper returns its argument unchanged; it only keeps the literal types.
 */
export function defineRoutesFor<Role extends string>() {
  return function defineRoutes<const T extends RouteBranch<Role, NavMeta>>(routes: T): T {
    return routes
  }
}
