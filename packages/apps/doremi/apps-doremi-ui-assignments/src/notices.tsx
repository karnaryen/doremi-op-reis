import { Trans } from '@lingui/react/macro'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import { useFormatDate } from './useFormatDate'

/** On a completed Assignment: when it is deleted (docs/product/features.md, "UX rules"). */
export function DeletionNotice({ deleteAt }: { deleteAt: string }) {
  const formatDate = useFormatDate()
  const date = formatDate(deleteAt)

  return (
    <Alert severity="info">
      <Trans>This work will be deleted on {date}. Save the materials you need.</Trans>
    </Alert>
  )
}

/** The notice for parents on the upload screen (docs/product/privacy.md, "Notice for parents"). */
export function RecordingPrivacyNotice() {
  return (
    <Alert severity="info">
      <AlertTitle>
        <Trans>About your recordings</Trans>
      </AlertTitle>
      <Trans>
        We store only the latest video and the latest audio for each piece. A new recording replaces
        the previous one. All recordings and comments are deleted 30 days after the work is
        completed. Please film only the child's hands and the instrument, without the face.
      </Trans>
    </Alert>
  )
}
