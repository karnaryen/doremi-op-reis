/** The status on a piece card (docs/product/assignment-lifecycle.md). */
export type PieceStatus = 'in_progress' | 'sent' | 'try_again' | 'completed'

/** The tabs of the section "Main". `to_review` is for the teacher only. */
export type AssignmentFilter = 'to_review' | 'active' | 'completed'

export type RecordingKind = 'video' | 'audio'

export type MaterialFilePurpose = 'sheet_music' | 'audio_example'

/** One row in a list of Assignments. Dates are ISO 8601 texts. */
export type AssignmentSummary = {
  id: number
  title: string
  status: PieceStatus
  studentId: number
  studentName: string
  createdAt: string
  /** When the latest recording came in. */
  submittedAt: string | null
  completedAt: string | null
  /** A completed Assignment is deleted on this day. */
  deleteAt: string | null
}

export type MaterialFile = {
  id: number
  purpose: MaterialFilePurpose
  mimeType: string
  size: number
  /** Page number of sheet music, from 1. */
  position: number | null
}

export type Recording = {
  kind: RecordingKind
  mimeType: string
  size: number
  uploadedAt: string
}

export type Feedback = {
  text: string
  updatedAt: string
  /** The parent has sent a new recording after this feedback. */
  forPreviousAttempt: boolean
}

/** One Assignment with everything the piece card and the review screen show. */
export type AssignmentDetail = AssignmentSummary & {
  generalInstruction: string | null
  personalInstruction: string | null
  parentHint: string | null
  materialFiles: MaterialFile[]
  recordings: Recording[]
  feedback: Feedback | null
  /**
   * Changes with every change of the Assignment. A review sends it back, so the API can refuse feedback
   * for a state that the teacher has not seen (a new recording came in the meantime).
   */
  version: number
}

/** A short-lived link to one private file. */
export type FileLink = { url: string; expiresIn: number }

export type UploadTarget = { uploadId: string; uploadUrl: string; expiresIn: number }
