/**
 * One route in a route table. Pure data: no components, no browser or native code.
 * `Role` is the set of user roles, `Meta` is what the platform needs to draw the route
 * (label, icon, place in the navigation).
 */
export type RouteDef<Role extends string = string, Meta = unknown> = {
  /** Path segment relative to the parent: `''`, `'profile'`, `'students/:studentId'`. */
  readonly path: string
  /**
   * Roles that may open the route. Omitted: same as the parent. No value at all: everyone.
   * A child can only narrow the access of its parent, never widen it.
   */
  readonly access?: readonly Role[]
  /** Key of the child that opens when the user opens this route itself (for example the first tab). */
  readonly index?: string
  readonly meta?: Meta
  readonly children?: RouteBranch<Role, Meta>
}

/** A part of a route table: the whole table, or the children of one route. */
export type RouteBranch<Role extends string = string, Meta = unknown> = {
  readonly [key: string]: RouteDef<Role, Meta>
}

/** All route ids of a table: `'home' | 'teacher' | 'teacher.toReview'`. */
export type RouteId<T, Prefix extends string = ''> = {
  [K in keyof T & string]:
    | `${Prefix}${K}`
    | (T[K] extends { readonly children: infer C } ? RouteId<C, `${Prefix}${K}.`> : never)
}[keyof T & string]

type JoinPath<Base extends string, Segment extends string> = Segment extends ''
  ? Base extends ''
    ? '/'
    : Base
  : Base extends '/'
    ? `/${Segment}`
    : `${Base}/${Segment}`

/** Full URL pattern of a route id: `RoutePath<T, 'teacher.student'>` is `'/teacher/students/:studentId'`. */
export type RoutePath<T, Id, Base extends string = ''> = Id extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? T[K] extends { readonly path: infer P extends string; readonly children: infer C }
      ? RoutePath<C, Rest, JoinPath<Base, P>>
      : never
    : never
  : Id extends keyof T
    ? T[Id] extends { readonly path: infer P extends string }
      ? JoinPath<Base, P>
      : never
    : never

/** Names of the `:params` in a URL pattern. `never` if there are none. */
export type PathParamName<Path> = Path extends `${string}:${infer Param}/${infer Rest}`
  ? Param | PathParamName<`/${Rest}`>
  : Path extends `${string}:${infer Param}`
    ? Param
    : never

export type PathParams<Path> = { readonly [K in PathParamName<Path>]: string | number }

/** A route with everything resolved: full path and inherited access. */
export type FlatRoute = {
  readonly id: string
  readonly parentId: string | null
  readonly fullPath: string
  /** `null`: everyone may open it. */
  readonly access: readonly string[] | null
  readonly meta: unknown
  readonly childIds: readonly string[]
}
