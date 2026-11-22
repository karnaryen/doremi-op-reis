import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import Chip, { type ChipProps } from '@mui/material/Chip'
import type { PieceStatus } from './types'

const labels = {
  in_progress: msg`In progress`,
  sent: msg`Sent`,
  // The same English words as the retry button, but another meaning: the context keeps the translations apart.
  try_again: msg({ message: 'Try again', context: 'status of a piece' }),
  completed: msg`Completed`,
} as const

// No red and no warning color: a status never tells a parent that something is late or wrong
// (docs/product/features.md, "UX rules").
const colors: Record<PieceStatus, ChipProps['color']> = {
  in_progress: 'default',
  sent: 'primary',
  try_again: 'secondary',
  completed: 'success',
}

export function StatusChip({ status }: { status: PieceStatus }) {
  const { t } = useLingui()
  return <Chip size="small" color={colors[status]} label={t(labels[status])} />
}
