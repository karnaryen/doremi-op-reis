import { useQueries } from '@tanstack/react-query'
import { materialFileLinkQueryOptions, recordingLinkQueryOptions } from './queries'
import type { AssignmentDetail, RecordingKind } from './types'

/** The first error of some queries, or `null`. */
const firstError = (results: readonly { error: unknown }[]) =>
  results.find((result) => result.error !== null)?.error ?? null

/**
 * The links to all files of the piece, by file id. A link is `undefined` while it is loading.
 * The screen draws real `<a href>` buttons with them, so the links are loaded when the screen opens
 * and not at the click. `error` is set when a link could not be loaded.
 */
export function useMaterialFileLinks({
  id,
  materialFiles,
}: Pick<AssignmentDetail, 'id' | 'materialFiles'>): {
  links: Record<number, string | undefined>
  error: unknown
} {
  return useQueries({
    queries: materialFiles.map((file) => materialFileLinkQueryOptions(id, file.id)),
    combine: (results) => ({
      links: Object.fromEntries(
        results.map((result, index) => [materialFiles[index]?.id, result.data?.url]),
      ),
      error: firstError(results),
    }),
  })
}

/** The links to play the recordings of an Assignment, by kind. */
export function useRecordingLinks({
  id,
  recordings,
}: Pick<AssignmentDetail, 'id' | 'recordings'>): {
  links: Partial<Record<RecordingKind, string>>
  error: unknown
} {
  return useQueries({
    queries: recordings.map((recording) =>
      recordingLinkQueryOptions(id, recording.kind, recording.uploadedAt),
    ),
    combine: (results) => ({
      links: Object.fromEntries(
        results.map((result, index) => [recordings[index]?.kind, result.data?.url]),
      ),
      error: firstError(results),
    }),
  })
}
