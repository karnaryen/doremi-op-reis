import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import type { MessageDescriptor } from '@lingui/core'
import { canAccess, fillPath, type FlatRoute } from '@doremi/common-utils-routes'
import { useMatches } from 'react-router'
import { useRouteTable } from './context'
import type { NavMeta } from './meta'

function requireRoute(routes: ReadonlyMap<string, FlatRoute>, id: string) {
  const route = routes.get(id)
  if (!route) throw new Error(`Unknown route id: ${id}`)
  return route
}

/** Returns `canOpen(id)`: may the current user open this route? */
export function useCanOpen() {
  const { routes, role } = useRouteTable()
  return (id: string) => canAccess(requireRoute(routes, id), role)
}

/**
 * These hooks take any string as a route id. Apps use the typed versions from `bindRoutes`.
 *
 * Returns `linkTo(id, params)`: the URL of a route, or `null` if the current user may not open it.
 * Use it for MUI components: `to && <Button component={RouterLink} to={to} />`.
 */
export function useLinkTo() {
  const { routes, role } = useRouteTable()
  return (id: string, params?: Readonly<Record<string, string | number>>): string | null => {
    const route = requireRoute(routes, id)
    if (!canAccess(route, role)) return null
    return fillPath(route.fullPath, params)
  }
}

export type NavItem = {
  id: string
  to: string
  label: MessageDescriptor
  icon?: IconDefinition
  /** The route or one of its children is open. */
  active: boolean
}

function useItems(select: (routes: ReadonlyMap<string, FlatRoute>) => FlatRoute[]): NavItem[] {
  const { routes, role } = useRouteTable()
  const openIds = new Set(useMatches().map((match) => match.id))

  return select(routes).flatMap((route) => {
    const meta = route.meta as NavMeta | undefined
    // A route with a `:param` has no fixed URL, so it cannot be a navigation item.
    if (!meta || !canAccess(route, role) || route.fullPath.includes(':')) return []
    return [
      {
        id: route.id,
        to: route.fullPath,
        label: meta.label,
        icon: meta.icon,
        active: openIds.has(route.id),
      },
    ]
  })
}

function navOf(route: FlatRoute) {
  return (route.meta as NavMeta | undefined)?.nav
}

/** Sections of the main navigation that the current user may open. */
export function useSections(): NavItem[] {
  return useItems((routes) =>
    [...routes.values()].filter((r) => r.parentId === null && navOf(r) === 'section'),
  )
}

/** Tabs of a route: its children with `nav: 'tab'` that the current user may open. */
export function useTabs(parentId: string): NavItem[] {
  return useItems((routes) =>
    requireRoute(routes, parentId)
      .childIds.map((id) => requireRoute(routes, id))
      .filter((r) => navOf(r) === 'tab'),
  )
}

/**
 * The open route and its parents, from the top of the table down.
 * `to` is the matched URL, so a route with a `:param` links to the open object.
 */
export function useBreadcrumbs(): NavItem[] {
  const { routes } = useRouteTable()

  return useMatches().flatMap((match) => {
    const route = routes.get(match.id)
    const meta = route?.meta as NavMeta | undefined
    if (!route || !meta) return []
    return [{ id: route.id, to: match.pathname, label: meta.label, icon: meta.icon, active: true }]
  })
}
