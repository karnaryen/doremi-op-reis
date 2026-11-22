import { defineRoutesFor } from '@doremi/web-utils-router'
import type { Role } from './session'

export { isRole, ROLES, useRole, useSessionStore, type Role } from './session'

/** Types one branch of a route table. `access` accepts only the roles of the organization. */
export const defineRoutes = defineRoutesFor<Role>()
