import { queryOptions } from '@tanstack/react-query'
import { http } from '@doremi/org-data-api'
import type {
  AssignmentDetail,
  AssignmentFilter,
  AssignmentSummary,
  FileLink,
  RecordingKind,
} from './types'

/** Query keys of this package. Every key starts with `assignments`, so one call can invalidate all. */
export const assignmentKeys = {
  all: ['assignments'] as const,
  lists: ['assignments', 'list'] as const,
  list: (filter: AssignmentFilter) => ['assignments', 'list', filter] as const,
  detail: (id: number) => ['assignments', 'detail', id] as const,
  /**
   * `uploadedAt` is a part of the key: a new recording is a new file, and the link to the old file is dead.
   * So also the teacher, whose browser did not do the upload, never gets the old link from the cache.
   */
  recordingLink: (id: number, kind: RecordingKind, uploadedAt: string) =>
    ['assignments', 'detail', id, 'recording', kind, uploadedAt] as const,
  materialFileLink: (id: number, fileId: number) =>
    ['assignments', 'detail', id, 'material-file', fileId] as const,
}

/** One tab of "Main". The API returns the Assignments of the signed-in user only. */
export function assignmentsQueryOptions(filter: AssignmentFilter) {
  return queryOptions({
    queryKey: assignmentKeys.list(filter),
    queryFn: ({ signal }) =>
      http<AssignmentSummary[]>(`/api/assignments?filter=${filter}`, { signal }),
  })
}

export function assignmentQueryOptions(id: number) {
  return queryOptions({
    queryKey: assignmentKeys.detail(id),
    queryFn: ({ signal }) => http<AssignmentDetail>(`/api/assignments/${id}`, { signal }),
  })
}

/**
 * Links to private files live one hour (`expiresIn`). A link is asked again after 45 minutes while the screen
 * stays open, and when the user comes back to the app with a link that is older than that: a phone stops
 * the timers of a page in the background.
 */
const linkTimes = {
  staleTime: 45 * 60_000,
  refetchInterval: 45 * 60_000,
  refetchOnWindowFocus: true,
} as const

/** A link to play the video or the audio of an Assignment. */
export function recordingLinkQueryOptions(id: number, kind: RecordingKind, uploadedAt: string) {
  return queryOptions({
    queryKey: assignmentKeys.recordingLink(id, kind, uploadedAt),
    queryFn: ({ signal }) =>
      http<FileLink>(`/api/assignments/${id}/recordings/${kind}/url`, { signal }),
    ...linkTimes,
  })
}

/** A link to open a file of the piece: a page of sheet music or the audio example. */
export function materialFileLinkQueryOptions(id: number, fileId: number) {
  return queryOptions({
    queryKey: assignmentKeys.materialFileLink(id, fileId),
    queryFn: ({ signal }) =>
      http<FileLink>(`/api/assignments/${id}/material-files/${fileId}/url`, { signal }),
    ...linkTimes,
  })
}
