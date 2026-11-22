import { createContext, useContext } from 'react'
import type { FlatRoute } from '@doremi/common-utils-routes'

export type RouteTableContextValue = {
  readonly routes: ReadonlyMap<string, FlatRoute>
  readonly role: string
}

export const RouteTableContext = createContext<RouteTableContextValue | null>(null)

export function useRouteTable(): RouteTableContextValue {
  const value = useContext(RouteTableContext)
  if (!value) throw new Error('RouteTableProvider is missing')
  return value
}
