/**
 * Roles of the organization. See docs/product/users.md.
 * A guest is a visitor who is not signed in; the API knows only `teacher` and `parent`.
 */
export const ROLES = ['guest', 'teacher', 'parent'] as const

export type Role = (typeof ROLES)[number]

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}
