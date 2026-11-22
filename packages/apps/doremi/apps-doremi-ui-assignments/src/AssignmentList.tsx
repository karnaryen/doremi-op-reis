import type { ReactNode } from 'react'
import { Trans } from '@lingui/react/macro'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'
import { StatusChip } from './StatusChip'
import type { PieceStatus } from './types'
import { useFormatDate } from './useFormatDate'

export type AssignmentListItem = {
  id: number
  title: string
  status: PieceStatus
  studentName: string
  submittedAt: string | null
  deleteAt: string | null
}

type Props = {
  items: readonly AssignmentListItem[]
  /** The URL of the screen of one Assignment. `null`: the card is not a link. */
  hrefFor: (id: number) => string | null
  /** The teacher sees the name of the student on every card; a parent has one child. */
  showStudent?: boolean
  /** Shown when the list is empty. */
  empty: ReactNode
}

/** A list of piece cards. One column: the app is made for a phone first. */
export function AssignmentList({ items, hrefFor, showStudent = false, empty }: Props) {
  const formatDate = useFormatDate()

  if (items.length === 0) {
    return <Typography color="text.secondary">{empty}</Typography>
  }

  return (
    <Stack component="ul" spacing={1.5} sx={{ listStyle: 'none', p: 0, m: 0 }}>
      {items.map((item) => {
        const href = hrefFor(item.id)
        const sentOn = item.submittedAt && formatDate(item.submittedAt)
        const deletedOn = item.deleteAt && formatDate(item.deleteAt)
        const content = (
          <Stack spacing={0.5} sx={{ p: 2, alignItems: 'flex-start' }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ width: '100%', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
                {item.title}
              </Typography>
              <StatusChip status={item.status} />
            </Stack>
            {showStudent && <Typography color="text.secondary">{item.studentName}</Typography>}
            {item.status === 'sent' && sentOn && (
              <Typography variant="body2" color="text.secondary">
                <Trans>Recording sent on {sentOn}</Trans>
              </Typography>
            )}
            {item.status === 'completed' && deletedOn && (
              <Typography variant="body2" color="text.secondary">
                <Trans>Will be deleted on {deletedOn}</Trans>
              </Typography>
            )}
          </Stack>
        )

        return (
          <Card key={item.id} component="li" variant="outlined">
            {href ? (
              <CardActionArea component={RouterLink} to={href}>
                {content}
              </CardActionArea>
            ) : (
              content
            )}
          </Card>
        )
      })}
    </Stack>
  )
}
