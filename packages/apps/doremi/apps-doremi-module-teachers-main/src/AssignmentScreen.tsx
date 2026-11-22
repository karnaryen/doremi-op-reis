import { useState } from 'react'
import { Trans, useLingui } from '@lingui/react/macro'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { Link as RouterLink, useParams } from 'react-router'
import {
  assignmentQueryOptions,
  useMaterialFileLinks,
  useRecordingLinks,
  useReviewAssignment,
  type AssignmentDetail,
} from '@doremi/apps-doremi-data-assignments'
import {
  DeletionNotice,
  FeedbackCard,
  MaterialFileList,
  PieceTexts,
  RecordingList,
  StatusChip,
} from '@doremi/apps-doremi-ui-assignments'
import { ErrorAlert, NotFoundPage, PageLoader } from '@doremi/apps-doremi-ui-layout'
import { useLinkTo } from '@doremi/apps-doremi-utils-routes'

/** Must be the same as CreateAssignmentRequest::TEXT_MAX_LENGTH in packages/api. */
const FEEDBACK_MAX_LENGTH = 5000

/**
 * The review: a required feedback text and two equal actions (docs/product/features.md, "Review").
 * "Ask to try again" needs a new recording; "Complete" is always possible, also without a recording.
 */
function ReviewForm({ assignment }: { assignment: AssignmentDetail }) {
  const { t } = useLingui()
  const review = useReviewAssignment(assignment.id)
  const [feedback, setFeedback] = useState('')
  const [touched, setTouched] = useState(false)
  const text = feedback.trim()
  const missing = touched && text === ''

  const send = (action: 'complete' | 'try_again') => {
    setTouched(true)
    if (text === '') return
    review.mutate(
      { action, feedback: text, version: assignment.version },
      {
        // An empty form again, without the "write feedback first" message.
        onSuccess: () => {
          setFeedback('')
          setTouched(false)
        },
      },
    )
  }

  return (
    <Stack spacing={2}>
      <TextField
        label={t`Feedback for the student and the parent`}
        multiline
        minRows={4}
        fullWidth
        required
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
        error={missing}
        helperText={
          missing
            ? t`Write feedback first: it is needed for both actions.`
            : t`What went well, and what to try next.`
        }
        slotProps={{ htmlInput: { maxLength: FEEDBACK_MAX_LENGTH } }}
      />
      <ErrorAlert error={review.error} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button
          variant="contained"
          size="large"
          disabled={
            assignment.status !== 'sent' ||
            (review.isPending && review.variables?.action !== 'try_again')
          }
          loading={review.isPending && review.variables?.action === 'try_again'}
          onClick={() => send('try_again')}
        >
          <Trans>Ask to try again</Trans>
        </Button>
        <Button
          variant="contained"
          size="large"
          color="success"
          disabled={review.isPending && review.variables?.action !== 'complete'}
          loading={review.isPending && review.variables?.action === 'complete'}
          onClick={() => send('complete')}
        >
          <Trans>Complete</Trans>
        </Button>
      </Stack>
      {assignment.status !== 'sent' && (
        <Typography variant="body2" color="text.secondary">
          <Trans>“Ask to try again” is possible when there is a new recording.</Trans>
        </Typography>
      )}
    </Stack>
  )
}

function AssignmentContent({ assignment }: { assignment: AssignmentDetail }) {
  const linkTo = useLinkTo()
  const files = useMaterialFileLinks(assignment)
  const recordings = useRecordingLinks(assignment)
  const student = linkTo('students.student', { studentId: assignment.studentId })

  return (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
        <Typography variant="h3" component="h1" sx={{ overflowWrap: 'anywhere' }}>
          {assignment.title}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {student ? (
            <Link component={RouterLink} to={student}>
              {assignment.studentName}
            </Link>
          ) : (
            <Typography>{assignment.studentName}</Typography>
          )}
          <StatusChip status={assignment.status} />
        </Stack>
      </Stack>

      {assignment.deleteAt && <DeletionNotice deleteAt={assignment.deleteAt} />}

      <Stack spacing={1.5}>
        <Typography variant="h5" component="h2">
          <Trans>Recordings</Trans>
        </Typography>
        <ErrorAlert error={recordings.error} />
        <RecordingList recordings={assignment.recordings} links={recordings.links} />
      </Stack>

      {assignment.feedback && <FeedbackCard {...assignment.feedback} />}

      {assignment.status !== 'completed' && (
        <Stack spacing={1.5}>
          <Typography variant="h5" component="h2">
            <Trans>Review</Trans>
          </Typography>
          <ReviewForm assignment={assignment} />
        </Stack>
      )}

      <Stack spacing={1.5}>
        <Typography variant="h5" component="h2">
          <Trans>The piece</Trans>
        </Typography>
        <PieceTexts {...assignment} />
        <ErrorAlert error={files.error} />
        <MaterialFileList files={assignment.materialFiles} links={files.links} />
      </Stack>
    </Stack>
  )
}

/** One Assignment of a student: the piece, the recordings, the feedback and the review. */
export function AssignmentScreen() {
  const assignmentId = Number(useParams().assignmentId)
  const {
    data: assignment,
    error,
    refetch,
  } = useQuery({
    ...assignmentQueryOptions(assignmentId),
    enabled: Number.isInteger(assignmentId),
  })

  if (!Number.isInteger(assignmentId)) return <NotFoundPage />
  if (error) return <ErrorAlert error={error} onRetry={() => void refetch()} />
  if (!assignment) return <PageLoader />

  return <AssignmentContent assignment={assignment} />
}
