import type { ComponentProps, ReactNode } from 'react'
import type { PathArgs, RouteBranch, RouteId, RoutePath } from '@doremi/common-utils-routes'
import type { Link } from 'react-router'
import { useCanOpen, useLinkTo, useTabs, type NavItem } from './hooks'
import { RouteLink } from './RouteLink'
import type { Screen } from './toRouteObjects'

/** `to` and `params` of a typed link: `params` is required only if the route has `:params`. */
type LinkTarget<T, Id> = { to: Id } & (PathArgs<RoutePath<T, Id>> extends [params: infer P]
  ? { params: P }
  : { params?: undefined })

/**
 * Binds the link helpers to one route table, so route ids and params are type-checked.
 * An app calls it once, next to its table, and every package of the app imports the result.
 * At run time these are the same functions as the untyped ones: only the types change.
 */
export function bindRoutes<const T extends RouteBranch>(table: T) {
  // Only the type of the table is used: the provider gives the table at run time.
  void table
  type Id = RouteId<T>

  return {
    /** A link to a route. Unknown id or missing param: type error. Not allowed: draws nothing. */
    RouteLink: RouteLink as <I extends Id>(
      props: LinkTarget<T, I> & Omit<ComponentProps<typeof Link>, 'to'>,
    ) => ReactNode,
    /** Returns `linkTo(id, params)`: the URL, or `null` if the user may not open the route. */
    useLinkTo: useLinkTo as () => <I extends Id>(
      id: I,
      ...args: PathArgs<RoutePath<T, I>>
    ) => string | null,
    /** Returns `canOpen(id)`. */
    useCanOpen: useCanOpen as () => (id: Id) => boolean,
    /** Tabs of a route: its children with `nav: 'tab'` that the user may open. */
    useTabs: useTabs as (parentId: Id) => NavItem[],
    /** Types the screens of some routes. Returns `screens` unchanged. */
    defineScreens: <K extends Id>(screens: Readonly<Record<K, Screen>>) => screens,
  }
}
