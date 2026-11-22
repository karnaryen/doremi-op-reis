import { useMutation, useQueryClient } from '@tanstack/react-query'
import { http } from '@doremi/org-data-api'
import { setSession, type Profile } from './profile'

export type SignInInput = { email: string; password: string }
export type SignUpInput = { name: string; email: string; password: string }
export type AcceptInvitationInput = { token: string; password: string }

/** Sign-in with email and password. On success the API sets the session cookie. */
export function useSignIn() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: SignInInput) =>
      http<Profile>('/api/login', { method: 'POST', body: input }),
    onSuccess: (profile) => setSession(client, profile),
  })
}

/** Teacher sign-up. The new teacher is signed in at once. */
export function useSignUp() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: SignUpInput) =>
      http<Profile>('/api/teachers', { method: 'POST', body: input }),
    onSuccess: (profile) => setSession(client, profile),
  })
}

/** A parent sets a password with the token of the invitation link, and is signed in. */
export function useAcceptInvitation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: AcceptInvitationInput) =>
      http<Profile>('/api/invitations/accept', { method: 'POST', body: input }),
    onSuccess: (profile) => setSession(client, profile),
  })
}

export function useSignOut() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => http<void>('/api/logout', { method: 'POST' }),
    onSuccess: () => setSession(client, null),
  })
}
