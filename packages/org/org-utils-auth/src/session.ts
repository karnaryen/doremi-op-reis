import { create } from 'zustand'

/** Roles of the organization. See docs/product/users.md. */
export const ROLES = ['guest', 'teacher', 'parent'] as const

export type Role = (typeof ROLES)[number]

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

type SessionState = {
  role: Role
  setRole: (role: Role) => void
}

/**
 * The current user. There is no sign-in yet (roadmap phase 4), so everyone starts as a guest.
 * `setRole` exists for the development role preview and for tests.
 */
export const useSessionStore = create<SessionState>()((set) => ({
  role: 'guest',
  setRole: (role) => set({ role }),
}))

export function useRole(): Role {
  return useSessionStore((s) => s.role)
}
