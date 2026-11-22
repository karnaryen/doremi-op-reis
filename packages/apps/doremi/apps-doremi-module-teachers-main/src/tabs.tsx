import type { ReactNode } from 'react'
import { Trans } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import {
  assignmentsQueryOptions,
  type AssignmentFilter,
} from '@doremi/apps-doremi-data-assignments'
import { AssignmentList } from '@doremi/apps-doremi-ui-assignments'
import { ErrorAlert, PageLoader } from '@doremi/apps-doremi-ui-layout'
import { useLinkTo } from '@doremi/apps-doremi-utils-routes'

function AssignmentsTab({ filter, empty }: { filter: AssignmentFilter; empty: ReactNode }) {
  const linkTo = useLinkTo()
  const { data, error, refetch } = useQuery(assignmentsQueryOptions(filter))

  if (error) return <ErrorAlert error={error} onRetry={() => void refetch()} />
  if (!data) return <PageLoader />

  return (
    <AssignmentList
      items={data}
      showStudent
      hrefFor={(assignmentId) => linkTo('teacher.assignment', { assignmentId })}
      empty={empty}
    />
  )
}

/** New recordings of the own students; the recording that waits longest comes first. */
export function ToReviewTab() {
  return <AssignmentsTab filter="to_review" empty={<Trans>No recordings to review.</Trans>} />
}

export function ActiveTab() {
  return (
    <AssignmentsTab
      filter="active"
      empty={<Trans>No active pieces. Open a student to assign a piece.</Trans>}
    />
  )
}

export function CompletedTab() {
  return <AssignmentsTab filter="completed" empty={<Trans>No completed pieces.</Trans>} />
}
