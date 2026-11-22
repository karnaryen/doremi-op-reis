import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { assignmentKeys, type AssignmentSummary } from '@doremi/apps-doremi-data-assignments'
import { http } from '@doremi/org-data-api'

/** A parent account, as the teacher sees it. */
export type ParentAccount = {
  id: number
  name: string
  email: string
  /** True until the parent has set a password. */
  invitationPending: boolean
}

export type Student = {
  id: number
  name: string
  parent: ParentAccount
}

/** One student with all Assignments, for the screen of the student. */
export type StudentDetail = Student & { assignments: AssignmentSummary[] }

/** The answer to "add parent" and "send again": `invitationSent` is false if the email could not be sent. */
export type InvitedStudent = Student & { invitationSent: boolean }

export const studentKeys = {
  all: ['students'] as const,
  detail: (id: number) => ['students', id] as const,
}

/** The students of the signed-in teacher, with their parents. */
export function studentsQueryOptions() {
  return queryOptions({
    queryKey: studentKeys.all,
    queryFn: ({ signal }) => http<Student[]>('/api/students', { signal }),
  })
}

export function studentQueryOptions(id: number) {
  return queryOptions({
    queryKey: studentKeys.detail(id),
    queryFn: ({ signal }) => http<StudentDetail>(`/api/students/${id}`, { signal }),
  })
}

export type AddParentInput = { name: string; email: string; childName: string }

/** Creates the parent account and the child, and sends the invitation email. */
export function useAddParent() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: AddParentInput) =>
      http<InvitedStudent>('/api/parents', { method: 'POST', body: input }),
    onSuccess: () => client.invalidateQueries({ queryKey: studentKeys.all }),
  })
}

/** Sends a new invitation email. The link of the old email stops working. */
export function useInviteAgain() {
  return useMutation({
    mutationFn: (parentId: number) =>
      http<InvitedStudent>(`/api/parents/${parentId}/invitation`, { method: 'POST' }),
  })
}

/** Deletes the parent account, the child, the Assignments, the recordings and the feedback. */
export function useDeleteParent() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (parentId: number) => http<void>(`/api/parents/${parentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      // The student and the Assignments of the family are gone: drop everything that could still show them.
      // Remove, not invalidate: the screen of this parent is still open at this moment, and a new request
      // for the deleted student would show "does not exist" until the screen navigates away.
      client.removeQueries({ queryKey: assignmentKeys.all })
      client.removeQueries({ queryKey: studentKeys.all })
    },
  })
}
