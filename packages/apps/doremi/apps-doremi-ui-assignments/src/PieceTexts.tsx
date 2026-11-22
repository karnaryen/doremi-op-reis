import type { ReactNode } from 'react'
import { Trans } from '@lingui/react/macro'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

type Props = {
  generalInstruction: string | null
  personalInstruction: string | null
  parentHint: string | null
}

function TextBlock({ label, text }: { label: ReactNode; text: string }) {
  return (
    <div>
      <Typography variant="overline" component="h3" color="text.secondary">
        {label}
      </Typography>
      {/* pre-wrap: the teacher writes several lines, and the line breaks must stay. */}
      <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{text}</Typography>
    </div>
  )
}

/**
 * The three texts of a piece card. An empty text is not shown (docs/product/users.md).
 * The task of the teacher comes first: the title alone does not tell the parent what to do.
 */
export function PieceTexts({ generalInstruction, personalInstruction, parentHint }: Props) {
  if (!generalInstruction && !personalInstruction && !parentHint) return null

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          {generalInstruction && (
            <TextBlock
              label={<Trans>From the teacher, for everyone with this piece</Trans>}
              text={generalInstruction}
            />
          )}
          {personalInstruction && (
            <TextBlock
              label={<Trans>From the teacher, for this student</Trans>}
              text={personalInstruction}
            />
          )}
          {parentHint && <TextBlock label={<Trans>For parents</Trans>} text={parentHint} />}
        </Stack>
      </CardContent>
    </Card>
  )
}
