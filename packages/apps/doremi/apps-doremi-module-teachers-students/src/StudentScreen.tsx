import { Trans } from '@lingui/react/macro'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { Link as RouterLink } from 'react-router'
import { studentQueryOptions } from '@doremi/apps-doremi-data-students'
import { AssignmentList } from '@doremi/apps-doremi-ui-assignments'
import { ErrorAlert, NotFoundPage, PageLoader } from '@doremi/apps-doremi-ui-layout'
import { useLinkTo } from '@doremi/apps-doremi-utils-routes'
import { useStudentId } from './useStudentId'

/** One student: all Assignments with their status, and the button "Assign a piece". */
export function StudentScreen() {
  const studentId = useStudentId()
  const linkTo = useLinkTo()
  const {
    data: student,
    error,
    refetch,
  } = useQuery({ ...studentQueryOptions(studentId ?? 0), enabled: studentId !== null })

  if (studentId === null) return <NotFoundPage />
  if (error) return <ErrorAlert error={error} onRetry={() => void refetch()} />
  if (!student) return <PageLoader />

  const assign = linkTo('students.assign', { studentId })
  const parent = linkTo('students.parent', { studentId })
  const parentName = student.parent.name

  return (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <Stack spacing={0.5}>
        <Typography variant="h3" component="h1" sx={{ overflowWrap: 'anywhere' }}>
          {student.name}
        </Typography>
        <Typography color="text.secondary">
          {parent && (
            <Link component={RouterLink} to={parent}>
              <Trans>Parent: {parentName}</Trans>
            </Link>
          )}
          {student.parent.invitationPending && (
            <>
              {' · '}
              <Trans>invitation not accepted yet</Trans>
            </>
          )}
        </Typography>
      </Stack>

      {assign && (
        <Button
          component={RouterLink}
          to={assign}
          variant="contained"
          size="large"
          startIcon={<FontAwesomeIcon icon={faPlus} />}
          sx={{ alignSelf: { sm: 'flex-start' } }}
        >
          <Trans>Assign a piece</Trans>
        </Button>
      )}

      <AssignmentList
        items={student.assignments}
        hrefFor={(assignmentId) => linkTo('teacher.assignment', { assignmentId })}
        empty={<Trans>No pieces yet.</Trans>}
      />
    </Stack>
  )
}
