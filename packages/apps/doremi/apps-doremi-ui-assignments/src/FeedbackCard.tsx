import { Trans } from '@lingui/react/macro'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { useFormatDate } from './useFormatDate'

type Props = {
  text: string
  updatedAt: string
  /** The parent has sent a new recording after this feedback. */
  forPreviousAttempt: boolean
}

/** The latest feedback of the teacher. It is one text on the Assignment, not a chat. */
export function FeedbackCard({ text, updatedAt, forPreviousAttempt }: Props) {
  const formatDate = useFormatDate()
  const date = formatDate(updatedAt)

  return (
    <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
      <CardContent>
        <Typography variant="overline" component="h3" color="text.secondary">
          {forPreviousAttempt ? (
            <Trans>Advice for the previous attempt</Trans>
          ) : (
            <Trans>Feedback from the teacher</Trans>
          )}
        </Typography>
        <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{text}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {date}
        </Typography>
      </CardContent>
    </Card>
  )
}
