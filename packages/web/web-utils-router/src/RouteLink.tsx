import type { ComponentProps } from 'react'
import { Link } from 'react-router'
import { useLinkTo } from './hooks'

export type RouteLinkProps = {
  to: string
  params?: Readonly<Record<string, string | number>>
} & Omit<ComponentProps<typeof Link>, 'to'>

/** A link to a route id. If the current user may not open the route, nothing is drawn. */
export function RouteLink({ to, params, ...rest }: RouteLinkProps) {
  const linkTo = useLinkTo()
  const href = linkTo(to, params)
  return href === null ? null : <Link to={href} {...rest} />
}
