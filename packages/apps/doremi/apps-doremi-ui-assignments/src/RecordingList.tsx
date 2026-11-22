import { Trans } from '@lingui/react/macro'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { RecordingPlayer } from './RecordingPlayer'
import type { RecordingKind } from './types'
import { useFormatDate } from './useFormatDate'

type Props = {
  recordings: readonly { kind: RecordingKind; uploadedAt: string }[]
  /** Short-lived links by kind. A missing link: the player waits. */
  links: Readonly<Partial<Record<RecordingKind, string>>>
}

/** The latest video and the latest audio of an Assignment, each with a player. */
export function RecordingList({ recordings, links }: Props) {
  const formatDate = useFormatDate()

  if (recordings.length === 0) {
    return (
      <Typography color="text.secondary">
        <Trans>No recording yet.</Trans>
      </Typography>
    )
  }

  return (
    <Stack spacing={2}>
      {recordings.map((recording) => {
        const date = formatDate(recording.uploadedAt)
        return (
          // A new recording has a new upload time: the player is made again and takes the new link.
          <Stack key={`${recording.kind}-${recording.uploadedAt}`} spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              {recording.kind === 'video' ? (
                <Trans>Video, sent on {date}</Trans>
              ) : (
                <Trans>Audio, sent on {date}</Trans>
              )}
            </Typography>
            <RecordingPlayer kind={recording.kind} src={links[recording.kind]} />
          </Stack>
        )
      })}
    </Stack>
  )
}
