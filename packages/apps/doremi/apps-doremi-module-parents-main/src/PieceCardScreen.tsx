import { Trans } from '@lingui/react/macro'
import { faArrowUpFromBracket } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { Link as RouterLink, useParams } from 'react-router'
import {
  assignmentQueryOptions,
  useMaterialFileLinks,
  useRecordingLinks,
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

function PieceCard({ assignment }: { assignment: AssignmentDetail }) {
  const linkTo = useLinkTo()
  const files = useMaterialFileLinks(assignment)
  const recordings = useRecordingLinks(assignment)
  const upload = linkTo('parent.upload', { assignmentId: assignment.id })
  const completed = assignment.status === 'completed'

  return (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
        <Typography variant="h3" component="h1" sx={{ overflowWrap: 'anywhere' }}>
          {assignment.title}
        </Typography>
        <StatusChip status={assignment.status} />
      </Stack>

      {assignment.deleteAt && <DeletionNotice deleteAt={assignment.deleteAt} />}

      {/* What to practise comes first: the title alone does not tell the parent what to do. */}
      <PieceTexts {...assignment} />
      <ErrorAlert error={files.error} />
      <MaterialFileList files={assignment.materialFiles} links={files.links} />

      {assignment.feedback && <FeedbackCard {...assignment.feedback} />}

      <Stack spacing={1.5}>
        <Typography variant="h5" component="h2">
          <Trans>Your recordings</Trans>
        </Typography>
        <ErrorAlert error={recordings.error} />
        <RecordingList recordings={assignment.recordings} links={recordings.links} />
        {!completed && upload && (
          <Button
            component={RouterLink}
            to={upload}
            variant="contained"
            size="large"
            startIcon={<FontAwesomeIcon icon={faArrowUpFromBracket} />}
          >
            {assignment.recordings.length === 0 ? (
              <Trans>Send a recording</Trans>
            ) : (
              <Trans>Send a new recording</Trans>
            )}
          </Button>
        )}
      </Stack>
    </Stack>
  )
}

/** The piece card of the parent: instructions, files, feedback, recordings and the upload button. */
export function PieceCardScreen() {
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

  return <PieceCard assignment={assignment} />
}
