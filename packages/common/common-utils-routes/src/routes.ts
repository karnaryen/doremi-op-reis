import type { FlatRoute, PathParams, RouteBranch, RouteId, RoutePath } from './types'

function joinPath(base: string, segment: string) {
  if (segment === '') return base === '' ? '/' : base
  return base === '/' ? `/${segment}` : `${base}/${segment}`
}

/** Walks the table once and returns every route by id, with its full path and inherited access. */
export function indexRoutes(table: RouteBranch): Map<string, FlatRoute> {
  const routes = new Map<string, FlatRoute>()

  function walk(branch: RouteBranch, parent: FlatRoute | null) {
    for (const [key, def] of Object.entries(branch)) {
      const id = parent ? `${parent.id}.${key}` : key
      if (routes.has(id)) throw new Error(`Duplicate route id: ${id}`)
      const children = def.children ?? {}
      if (def.index !== undefined && !(def.index in children)) {
        throw new Error(`Route ${id}: index child "${def.index}" does not exist`)
      }
      const route: FlatRoute = {
        id,
        parentId: parent?.id ?? null,
        fullPath: joinPath(parent?.fullPath ?? '', def.path),
        access: def.access ?? parent?.access ?? null,
        meta: def.meta,
        childIds: Object.keys(children).map((child) => `${id}.${child}`),
      }
      routes.set(id, route)
      walk(children, route)
    }
  }

  walk(table, null)
  return routes
}

/** Access check for one route. Draw a link and open a screen only if this returns true. */
export function canAccess(route: Pick<FlatRoute, 'access'>, role: string): boolean {
  return route.access === null || route.access.includes(role)
}

/** Replaces `:params` in a URL pattern. Throws if a parameter is missing. */
export function fillPath(pattern: string, params: Readonly<Record<string, string | number>> = {}) {
  return pattern.replace(/:([A-Za-z0-9_]+)/g, (_, name: string) => {
    const value = params[name]
    if (value === undefined) throw new Error(`Missing route parameter "${name}" for ${pattern}`)
    return encodeURIComponent(String(value))
  })
}

/** Arguments after the route id: nothing for a route without params, else the params object. */
export type PathArgs<Path> = [keyof PathParams<Path>] extends [never]
  ? []
  : [params: PathParams<Path>]

/**
 * Typed URL builder for one table. An unknown route id or a missing parameter is a type error.
 * It does not check access: use `canAccess` (or the platform's link component) for that.
 */
export function createPathBuilder<const T extends RouteBranch>(table: T) {
  const routes = indexRoutes(table)
  return function pathTo<Id extends RouteId<T>>(id: Id, ...args: PathArgs<RoutePath<T, Id>>) {
    const route = routes.get(id)
    if (!route) throw new Error(`Unknown route id: ${id}`)
    return fillPath(route.fullPath, args[0] as Record<string, string | number> | undefined)
  }
}
