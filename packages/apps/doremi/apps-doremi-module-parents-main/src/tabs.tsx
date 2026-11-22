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
      hrefFor={(assignmentId) => linkTo('parent.assignment', { assignmentId })}
      empty={empty}
    />
  )
}

/** The pieces the child practises now, with their status. */
export function ActiveTab() {
  return (
    <AssignmentsTab
      filter="active"
      empty={<Trans>No pieces yet. The teacher will give the first piece soon.</Trans>}
    />
  )
}

/** Completed pieces with the feedback of the teacher, until they are deleted. */
export function CompletedTab() {
  return <AssignmentsTab filter="completed" empty={<Trans>No completed pieces.</Trans>} />
}
