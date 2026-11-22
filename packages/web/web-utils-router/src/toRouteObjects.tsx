import type { ComponentType } from 'react'
import type { RouteBranch } from '@doremi/common-utils-routes'
import { Navigate, type RouteObject } from 'react-router'
import { useCanOpen } from './hooks'

/** The component of a route. Use `lazy` to load it in a separate chunk. */
export type Screen =
  { Component: ComponentType } | { lazy: () => Promise<{ Component: ComponentType }> }

/** The screen is drawn only if the current user may open the route. */
function guard(id: string, Component: ComponentType, Forbidden: ComponentType) {
  function Guarded() {
    const canOpen = useCanOpen()
    return canOpen(id) ? <Component /> : <Forbidden />
  }
  Guarded.displayName = `Guarded(${id})`
  return Guarded
}

/**
 * Builds React Router routes from a route table and its screens.
 * Every route gets its table id as the React Router `id`, so `useMatches()` returns table ids.
 * `Forbidden` is drawn when the user opens a URL of a route they may not open.
 */
export function toRouteObjects(
  table: RouteBranch,
  screens: Readonly<Record<string, Screen>>,
  Forbidden: ComponentType,
  parentId = '',
): RouteObject[] {
  return Object.entries(table).map(([key, def]): RouteObject => {
    const id = parentId ? `${parentId}.${key}` : key
    const screen = screens[id]
    if (!screen) throw new Error(`No screen for route ${id}`)

    const component =
      'lazy' in screen
        ? {
            lazy: async () => ({
              Component: guard(id, (await screen.lazy()).Component, Forbidden),
            }),
          }
        : { Component: guard(id, screen.Component, Forbidden) }

    const children = def.children ?? {}
    if (def.path === '' && Object.keys(children).length === 0) {
      return { id, index: true, ...component }
    }

    const indexChild = def.index === undefined ? undefined : children[def.index]
    return {
      id,
      path: def.path === '' ? undefined : def.path,
      ...component,
      children: [
        ...(indexChild
          ? [{ index: true, element: <Navigate to={indexChild.path} replace /> }]
          : []),
        ...toRouteObjects(children, screens, Forbidden, id),
      ],
    }
  })
}
