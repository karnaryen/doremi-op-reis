import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import { Trans, useLingui } from '@lingui/react/macro'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'

/**
 * A text for every error code of the API (`App\Exception\RuleViolation` and `ApiExceptionSubscriber`
 * in packages/api). The API sends English texts for developers; the user reads these.
 */
const messages: Record<string, MessageDescriptor> = {
  invalid_credentials: msg`The email or the password is not correct.`,
  too_many_attempts: msg`Too many sign-in attempts. Please wait a few minutes and try again.`,
  too_many_requests: msg`Too many requests. Please wait a while and try again.`,
  email_already_used: msg`An account with this email address already exists.`,
  invitation_invalid: msg`This invitation link does not work any more. Ask the teacher to send a new invitation.`,
  password_already_set: msg`This parent has already chosen a password.`,
  assignment_completed: msg`This piece is already completed.`,
  nothing_to_review: msg`There is no new recording to review.`,
  changed_meanwhile: msg`This piece was changed in the meantime, for example by a new recording. Look at it again and try once more.`,
  upload_not_found: msg`The file did not arrive. Please send it again.`,
  file_not_accepted: msg`This file is not accepted: check the type and the size of the file.`,
  validation_failed: msg`Some fields are not filled in correctly.`,
  storage_unavailable: msg`The file storage does not answer. Please try again later.`,
  unauthorized: msg`Your session has ended. Please sign in again.`,
  forbidden: msg`You have no access to this.`,
  not_found: msg`This does not exist (any more).`,
  file_not_found: msg`This file does not exist (any more).`,
  student_not_found: msg`This student does not exist (any more).`,
  // Not from the API: the browser could not send a file to the file storage (UploadError).
  upload_failed: msg`The upload failed. Check the internet connection and try again.`,
}

const fallback = msg`Something went wrong. Please try again.`

/**
 * Reads the error code without importing the error classes: a `ui` package may not import a `data` package.
 * `HttpError` has a `code`; `UploadError` is found by its name.
 */
function codeOf(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  if ('code' in error && typeof error.code === 'string') return error.code
  if ('name' in error && error.name === 'UploadError') return 'upload_failed'
  return undefined
}

type Props = {
  /** The error of a query or a mutation. Nothing is drawn for `null` and `undefined`. */
  error: unknown
  /** Adds a "Try again" button. */
  onRetry?: () => void
}

/** Shows a failed request in the language of the user. */
export function ErrorAlert({ error, onRetry }: Props) {
  const { t } = useLingui()
  if (error === null || error === undefined) return null

  return (
    <Alert
      severity="error"
      action={
        onRetry && (
          <Button color="inherit" onClick={onRetry} sx={{ minHeight: 48 }}>
            <Trans>Try again</Trans>
          </Button>
        )
      }
    >
      {t(messages[codeOf(error) ?? ''] ?? fallback)}
    </Alert>
  )
}
