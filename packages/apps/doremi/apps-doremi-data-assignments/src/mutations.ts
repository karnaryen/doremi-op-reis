import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { http, HttpError, uploadToSignedUrl, type UploadOptions } from '@doremi/org-data-api'
import { assignmentKeys } from './queries'
import type { AssignmentDetail, MaterialFilePurpose, RecordingKind, UploadTarget } from './types'

/**
 * After a change: show the new Assignment at once, and let the lists load again.
 * `students` too: the screen of a student has a list of Assignments.
 */
function refresh(client: QueryClient, assignment: AssignmentDetail) {
  client.setQueryData(assignmentKeys.detail(assignment.id), assignment)
  // Only the lists: the detail was just set, and the links to its files have their own queries.
  void client.invalidateQueries({ queryKey: assignmentKeys.lists })
  // The key of the students package, as a plain text: that package imports this one, not the other way round.
  void client.invalidateQueries({ queryKey: ['students'] })
}

/**
 * Sends one file of a piece to the storage: asks the API for a signed URL, then uploads the file to it.
 * Returns the upload id that "POST /api/assignments" takes.
 */
export async function uploadMaterialFile(
  purpose: MaterialFilePurpose,
  file: File,
  options?: UploadOptions,
): Promise<string> {
  const target = await http<UploadTarget>('/api/material-uploads', {
    method: 'POST',
    body: { purpose, mimeType: file.type, size: file.size },
    signal: options?.signal,
  })
  await uploadToSignedUrl(target.uploadUrl, file, options)
  return target.uploadId
}

export type AssignPieceInput = {
  studentId: number
  title: string
  generalInstruction: string
  personalInstruction: string
  parentHint: string
  /** One PDF, or the pages as images in reading order. */
  sheetMusic: File[]
  audioExample: File | null
  /** Called before each file is sent: `done` of `total` files are in the storage. */
  onProgress?: (done: number, total: number) => void
}

/**
 * "Assign a piece": sends the files to the storage one after another, then creates the Assignment
 * with their upload ids. If a step fails nothing is assigned; the form can be sent again.
 */
export function useAssignPiece() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ sheetMusic, audioExample, onProgress, ...texts }: AssignPieceInput) => {
      const total = sheetMusic.length + (audioExample ? 1 : 0)
      const sheetMusicUploadIds: string[] = []
      for (const file of sheetMusic) {
        onProgress?.(sheetMusicUploadIds.length, total)
        sheetMusicUploadIds.push(await uploadMaterialFile('sheet_music', file))
      }
      onProgress?.(sheetMusicUploadIds.length, total)
      const audioExampleUploadId = audioExample
        ? await uploadMaterialFile('audio_example', audioExample)
        : null
      onProgress?.(total, total)

      return http<AssignmentDetail>('/api/assignments', {
        method: 'POST',
        body: { ...texts, sheetMusicUploadIds, audioExampleUploadId },
      })
    },
    onSuccess: (assignment) => refresh(client, assignment),
  })
}

export type ReviewInput = {
  action: 'complete' | 'try_again'
  feedback: string
  /** `version` of the Assignment that the teacher has on the screen. */
  version: number
}

/**
 * The review of the teacher: "Complete" or "Ask to try again", both with feedback.
 *
 * The API answers 409 `changed_meanwhile` when the Assignment has changed since the teacher opened it,
 * for example by a new recording. Then the Assignment is loaded again, so the screen shows what the review
 * would now be about; the teacher reads the message and decides again.
 */
export function useReviewAssignment(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: ReviewInput) =>
      http<AssignmentDetail>(`/api/assignments/${id}/review`, { method: 'POST', body: input }),
    onSuccess: (assignment) => refresh(client, assignment),
    onError: (error) => {
      if (error instanceof HttpError && error.status === 409) {
        void client.invalidateQueries({ queryKey: assignmentKeys.detail(id), exact: true })
      }
    },
  })
}

export type UploadRecordingInput = { kind: RecordingKind; file: File } & UploadOptions

/**
 * The three steps of a recording upload (docs/tech/architecture.md, "Upload flow"):
 * 1. ask the API for a signed URL, 2. send the file to the storage, 3. tell the API that the file is there.
 * The API saves the recording only in step 3, so a failed upload leaves the old recording as it was.
 */
export async function uploadRecording(
  id: number,
  { kind, file, ...options }: UploadRecordingInput,
): Promise<AssignmentDetail> {
  const target = await http<UploadTarget>(`/api/assignments/${id}/recordings/upload-url`, {
    method: 'POST',
    body: { kind, mimeType: file.type, size: file.size },
    signal: options.signal,
  })
  await uploadToSignedUrl(target.uploadUrl, file, options)
  return http<AssignmentDetail>(`/api/assignments/${id}/recordings`, {
    method: 'POST',
    body: { kind, uploadId: target.uploadId },
    signal: options.signal,
  })
}

export function useUploadRecording(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: UploadRecordingInput) => uploadRecording(id, input),
    // The link to the replaced file needs no cleanup: the key of a link has the upload time of its recording.
    onSuccess: (assignment) => refresh(client, assignment),
  })
}
