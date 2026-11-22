import { useMemo, type ReactNode } from 'react'
import { indexRoutes, type RouteBranch } from '@doremi/common-utils-routes'
import { RouteTableContext } from './context'

type Props = {
  table: RouteBranch
  /** Role of the current user. Links and screens the role may not open are not drawn. */
  role: string
  children: ReactNode
}

/** Gives links, navigation and route guards access to the app's route table. */
export function RouteTableProvider({ table, role, children }: Props) {
  const routes = useMemo(() => indexRoutes(table), [table])
  const value = useMemo(() => ({ routes, role }), [routes, role])
  return <RouteTableContext value={value}>{children}</RouteTableContext>
}
