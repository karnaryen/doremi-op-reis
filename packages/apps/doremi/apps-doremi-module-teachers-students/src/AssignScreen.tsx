import { useState, type FormEvent } from 'react'
import { Trans, useLingui } from '@lingui/react/macro'
import { faCamera, faFolderOpen, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useAssignPiece } from '@doremi/apps-doremi-data-assignments'
import { studentQueryOptions } from '@doremi/apps-doremi-data-students'
import { ErrorAlert, NotFoundPage, PageLoader } from '@doremi/apps-doremi-ui-layout'
import { useLinkTo } from '@doremi/apps-doremi-utils-routes'
import { useStudentId } from './useStudentId'

// The same limits as in packages/api (CreateAssignmentRequest and App\Upload\FileRule). The API checks again.
const TITLE_MAX_LENGTH = 200
const TEXT_MAX_LENGTH = 5000
const MAX_PAGES = 10
const SHEET_MUSIC_MAX_MB = 15
const AUDIO_MAX_MB = 30

const tooLarge = (file: File, megabytes: number) => file.size > megabytes * 1024 * 1024

/** Sheet music is one PDF or one or more images, not both (docs/glossary.md). */
function sheetMusicProblem(files: readonly File[]) {
  const pdfs = files.filter((file) => file.type === 'application/pdf').length
  if (pdfs > 1 || (pdfs > 0 && pdfs < files.length)) return 'mixed'
  if (files.length > MAX_PAGES) return 'too_many'
  if (files.some((file) => tooLarge(file, SHEET_MUSIC_MAX_MB))) return 'too_large'
  return null
}

type FileRowProps = { name: string; label: string; disabled: boolean; onRemove: () => void }

function FileRow({ name, label, disabled, onRemove }: FileRowProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Typography sx={{ flexGrow: 1, overflowWrap: 'anywhere' }}>{name}</Typography>
      <IconButton
        aria-label={label}
        disabled={disabled}
        onClick={onRemove}
        sx={{ width: 48, height: 48 }}
      >
        <FontAwesomeIcon icon={faXmark} />
      </IconButton>
    </Stack>
  )
}

/**
 * "Assign a piece" for one student: title, the three optional texts, sheet music and an audio example.
 * A full screen with one column, not a dialog (docs/product/mobile-design.md).
 */
export function AssignScreen() {
  const { t } = useLingui()
  const studentId = useStudentId()
  const linkTo = useLinkTo()
  const navigate = useNavigate()
  const assign = useAssignPiece()
  const { data: student, error } = useQuery({
    ...studentQueryOptions(studentId ?? 0),
    enabled: studentId !== null,
  })
  const [title, setTitle] = useState('')
  const [generalInstruction, setGeneralInstruction] = useState('')
  const [personalInstruction, setPersonalInstruction] = useState('')
  const [parentHint, setParentHint] = useState('')
  const [sheetMusic, setSheetMusic] = useState<File[]>([])
  const [audioExample, setAudioExample] = useState<File | null>(null)
  const [progress, setProgress] = useState({ done: 0, total: 0 })

  if (studentId === null) return <NotFoundPage />
  if (error) return <ErrorAlert error={error} />
  if (!student) return <PageLoader />

  const studentName = student.name
  const audioName = audioExample?.name ?? ''
  const sheetProblem = sheetMusicProblem(sheetMusic)
  const audioTooLarge = audioExample !== null && tooLarge(audioExample, AUDIO_MAX_MB)
  const { done, total } = progress
  const fileNumber = Math.min(done + 1, total)
  // While the files are sent the form is locked: what is on the screen is what is sent.
  const sending = assign.isPending

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (sheetProblem || audioTooLarge) return
    assign.mutate(
      {
        studentId,
        title: title.trim(),
        generalInstruction,
        personalInstruction,
        parentHint,
        sheetMusic,
        audioExample,
        onProgress: (filesDone, filesTotal) => setProgress({ done: filesDone, total: filesTotal }),
      },
      {
        onSuccess: () => {
          const to = linkTo('students.student', { studentId })
          if (to) void navigate(to)
        },
      },
    )
  }

  const addSheetMusic = (files: FileList | null) => {
    if (files) setSheetMusic((current) => [...current, ...files])
  }

  return (
    <Stack component="form" onSubmit={submit} spacing={2.5} sx={{ maxWidth: 720 }}>
      <Stack spacing={0.5}>
        <Typography variant="h3" component="h1">
          <Trans>Assign a piece</Trans>
        </Typography>
        <Typography color="text.secondary">
          <Trans>For {studentName}</Trans>
        </Typography>
      </Stack>

      <TextField
        label={t`Title of the piece`}
        disabled={sending}
        required
        fullWidth
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        slotProps={{ htmlInput: { maxLength: TITLE_MAX_LENGTH } }}
      />
      <TextField
        label={t`General instruction (optional)`}
        disabled={sending}
        helperText={t`For everyone who gets this piece: what to practise at home.`}
        multiline
        minRows={3}
        fullWidth
        value={generalInstruction}
        onChange={(event) => setGeneralInstruction(event.target.value)}
        slotProps={{ htmlInput: { maxLength: TEXT_MAX_LENGTH } }}
      />
      <TextField
        label={t`Personal instruction (optional)`}
        disabled={sending}
        helperText={t`For this student only.`}
        multiline
        minRows={3}
        fullWidth
        value={personalInstruction}
        onChange={(event) => setPersonalInstruction(event.target.value)}
        slotProps={{ htmlInput: { maxLength: TEXT_MAX_LENGTH } }}
      />
      <TextField
        label={t`Hint for the parent (optional)`}
        disabled={sending}
        helperText={t`How a parent can help, without music terms.`}
        multiline
        minRows={2}
        fullWidth
        value={parentHint}
        onChange={(event) => setParentHint(event.target.value)}
        slotProps={{ htmlInput: { maxLength: TEXT_MAX_LENGTH } }}
      />

      <Stack spacing={1}>
        <Typography variant="h6" component="h2">
          <Trans>Sheet music (optional)</Trans>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <Trans>One PDF, or photos of the pages in reading order (JPEG or PNG).</Trans>
        </Typography>
        {sheetMusic.map((file, index) => {
          const fileName = file.name
          return (
            <FileRow
              // The same file can be added twice, so the name alone is not a key.
              key={`${index}-${fileName}`}
              name={fileName}
              label={t`Remove ${fileName}`}
              disabled={sending}
              onRemove={() => setSheetMusic((current) => current.filter((_, i) => i !== index))}
            />
          )
        })}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            component="label"
            variant="outlined"
            disabled={sending}
            startIcon={<FontAwesomeIcon icon={faFolderOpen} />}
            sx={{ minHeight: 48 }}
          >
            <Trans>Choose files</Trans>
            <input
              type="file"
              hidden
              multiple
              accept="application/pdf,image/jpeg,image/png"
              onChange={(event) => {
                addSheetMusic(event.target.files)
                // Empty the input, so the same file can be chosen again after it was removed.
                event.target.value = ''
              }}
            />
          </Button>
          <Button
            component="label"
            variant="outlined"
            disabled={sending}
            startIcon={<FontAwesomeIcon icon={faCamera} />}
            sx={{ minHeight: 48 }}
          >
            <Trans>Take a photo</Trans>
            {/* capture: a phone opens the camera at once. A computer shows the file picker. */}
            <input
              type="file"
              hidden
              accept="image/jpeg,image/png"
              capture="environment"
              onChange={(event) => {
                addSheetMusic(event.target.files)
                event.target.value = ''
              }}
            />
          </Button>
        </Stack>
        {sheetProblem === 'mixed' && (
          <Alert severity="warning">
            <Trans>
              Choose one PDF, or only photos. A PDF and photos together are not possible.
            </Trans>
          </Alert>
        )}
        {sheetProblem === 'too_many' && (
          <Alert severity="warning">
            <Trans>At most {MAX_PAGES} pages.</Trans>
          </Alert>
        )}
        {sheetProblem === 'too_large' && (
          <Alert severity="warning">
            <Trans>A file is larger than {SHEET_MUSIC_MAX_MB} MB.</Trans>
          </Alert>
        )}
      </Stack>

      <Stack spacing={1}>
        <Typography variant="h6" component="h2">
          <Trans>Audio example (optional)</Trans>
        </Typography>
        {audioExample ? (
          <FileRow
            name={audioName}
            label={t`Remove ${audioName}`}
            disabled={sending}
            onRemove={() => setAudioExample(null)}
          />
        ) : (
          <Button
            component="label"
            variant="outlined"
            disabled={sending}
            startIcon={<FontAwesomeIcon icon={faFolderOpen} />}
            sx={{ alignSelf: { sm: 'flex-start' }, minHeight: 48 }}
          >
            <Trans>Choose an audio file</Trans>
            <input
              type="file"
              hidden
              accept="audio/*"
              onChange={(event) => setAudioExample(event.target.files?.[0] ?? null)}
            />
          </Button>
        )}
        {audioTooLarge && (
          <Alert severity="warning">
            <Trans>The audio file is larger than {AUDIO_MAX_MB} MB.</Trans>
          </Alert>
        )}
      </Stack>

      {assign.isPending && total > 0 && (
        <Stack spacing={1}>
          <LinearProgress
            variant="determinate"
            value={Math.round((done / total) * 100)}
            aria-label={t`Upload progress`}
          />
          <Typography variant="body2" color="text.secondary">
            <Trans>
              Sending file {fileNumber} of {total}…
            </Trans>
          </Typography>
        </Stack>
      )}

      <ErrorAlert error={assign.error} />
      <Button
        type="submit"
        variant="contained"
        size="large"
        loading={assign.isPending}
        disabled={sheetProblem !== null || audioTooLarge}
      >
        <Trans>Assign</Trans>
      </Button>
    </Stack>
  )
}
