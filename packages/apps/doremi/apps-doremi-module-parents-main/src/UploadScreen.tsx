import { useRef, useState } from 'react'
import { Trans, useLingui } from '@lingui/react/macro'
import { faFolderOpen, faVideo } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { Link as RouterLink, useParams } from 'react-router'
import {
  assignmentQueryOptions,
  useUploadRecording,
  type AssignmentDetail,
  type RecordingKind,
} from '@doremi/apps-doremi-data-assignments'
import { RecordingPrivacyNotice } from '@doremi/apps-doremi-ui-assignments'
import { ErrorAlert, NotFoundPage, PageLoader } from '@doremi/apps-doremi-ui-layout'
import { useLinkTo } from '@doremi/apps-doremi-utils-routes'

/** Must be the same as App\Upload\FileRule::maxBytes() in packages/api. The API checks the real file. */
const MAX_MB: Record<RecordingKind, number> = { video: 200, audio: 30 }

const megabytes = (bytes: number) => Math.max(1, Math.round(bytes / (1024 * 1024)))

function UploadForm({ assignment }: { assignment: AssignmentDetail }) {
  const { t } = useLingui()
  const linkTo = useLinkTo()
  const upload = useUploadRecording(assignment.id)
  const [kind, setKind] = useState<RecordingKind>('video')
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  // Lets the parent stop a running upload.
  const abort = useRef<AbortController | null>(null)
  const back = linkTo('parent.assignment', { assignmentId: assignment.id })
  const tooLarge = file !== null && file.size > MAX_MB[kind] * 1024 * 1024
  const maxMb = MAX_MB[kind]

  const choose = (chosen: File | undefined) => {
    upload.reset()
    setProgress(0)
    setFile(chosen ?? null)
  }

  const send = () => {
    if (!file || tooLarge) return
    abort.current = new AbortController()
    setProgress(0)
    upload.mutate({ kind, file, onProgress: setProgress, signal: abort.current.signal })
  }

  if (upload.isSuccess) {
    return (
      <Stack spacing={2}>
        <Alert severity="success">
          <Trans>
            The recording is sent. The teacher will watch or listen when there is time, and write
            feedback here.
          </Trans>
        </Alert>
        {back && (
          <Button component={RouterLink} to={back} variant="contained" size="large">
            <Trans>Back to the piece</Trans>
          </Button>
        )}
      </Stack>
    )
  }

  const fileName = file?.name
  const fileMb = file ? megabytes(file.size) : 0
  // A cancelled upload is not an error to show.
  const error = upload.error instanceof DOMException ? null : upload.error

  return (
    <Stack spacing={2.5}>
      <ToggleButtonGroup
        exclusive
        fullWidth
        value={kind}
        disabled={upload.isPending}
        onChange={(_, value: RecordingKind | null) => {
          if (value) {
            setKind(value)
            choose(undefined)
          }
        }}
        aria-label={t`Kind of recording`}
      >
        <ToggleButton value="video">
          <Trans>Video</Trans>
        </ToggleButton>
        <ToggleButton value="audio">
          <Trans>Audio only</Trans>
        </ToggleButton>
      </ToggleButtonGroup>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        {kind === 'video' && (
          <Button
            component="label"
            variant="outlined"
            size="large"
            disabled={upload.isPending}
            startIcon={<FontAwesomeIcon icon={faVideo} />}
          >
            <Trans>Record with the camera</Trans>
            {/* capture: a phone opens the camera at once. A computer ignores it and shows the file picker. */}
            <input
              type="file"
              hidden
              accept="video/*"
              capture="environment"
              onChange={(event) => {
                choose(event.target.files?.[0])
                // Empty the input: choosing the same file again must also count as a choice.
                event.target.value = ''
              }}
            />
          </Button>
        )}
        <Button
          component="label"
          variant="outlined"
          size="large"
          disabled={upload.isPending}
          startIcon={<FontAwesomeIcon icon={faFolderOpen} />}
        >
          <Trans>Choose a file</Trans>
          <input
            // A new input for the other kind, so the same file can be chosen again after a switch.
            key={kind}
            type="file"
            hidden
            accept={kind === 'video' ? 'video/*' : 'audio/*'}
            onChange={(event) => {
              choose(event.target.files?.[0])
              // Empty the input: choosing the same file again must also count as a choice.
              event.target.value = ''
            }}
          />
        </Button>
      </Stack>

      {file && (
        <Typography sx={{ overflowWrap: 'anywhere' }}>
          <Trans>
            Chosen: {fileName} ({fileMb} MB)
          </Trans>
        </Typography>
      )}
      {tooLarge && (
        <Alert severity="warning">
          <Trans>
            This file is larger than {maxMb} MB. Make a shorter recording, or choose a lower video
            quality in the camera settings of your phone.
          </Trans>
        </Alert>
      )}

      {upload.isPending && (
        <Stack spacing={1}>
          <LinearProgress
            variant="determinate"
            value={Math.round(progress * 100)}
            aria-label={t`Upload progress`}
          />
          <Typography variant="body2" color="text.secondary">
            <Trans>Sending… Keep this page open.</Trans>
          </Typography>
        </Stack>
      )}

      <ErrorAlert error={error} onRetry={file && !tooLarge ? send : undefined} />

      {upload.isPending ? (
        <Button variant="outlined" size="large" onClick={() => abort.current?.abort()}>
          <Trans>Cancel</Trans>
        </Button>
      ) : (
        <Button variant="contained" size="large" disabled={!file || tooLarge} onClick={send}>
          <Trans>Send to the teacher</Trans>
        </Button>
      )}
    </Stack>
  )
}

/** The parent chooses or records a video or an audio file and sends it. A full screen, not a dialog. */
export function UploadScreen() {
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

  return (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <Stack spacing={0.5}>
        <Typography variant="h3" component="h1">
          <Trans>Send a recording</Trans>
        </Typography>
        <Typography color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
          {assignment.title}
        </Typography>
      </Stack>
      {assignment.status === 'completed' ? (
        <Alert severity="info">
          <Trans>This piece is completed: it takes no new recordings.</Trans>
        </Alert>
      ) : (
        <UploadForm assignment={assignment} />
      )}
      <RecordingPrivacyNotice />
    </Stack>
  )
}
