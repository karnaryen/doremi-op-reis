import { Trans } from '@lingui/react/macro'
import { faUserPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { Link as RouterLink } from 'react-router'
import { studentsQueryOptions, type Student } from '@doremi/apps-doremi-data-students'
import { ErrorAlert, PageLoader } from '@doremi/apps-doremi-ui-layout'
import { useLinkTo } from '@doremi/apps-doremi-utils-routes'

function StudentCard({ student }: { student: Student }) {
  const linkTo = useLinkTo()
  const parentName = student.parent.name

  return (
    <Card component="li" variant="outlined">
      <CardActionArea
        component={RouterLink}
        to={linkTo('students.student', { studentId: student.id }) ?? '#'}
      >
        <Stack spacing={0.5} sx={{ p: 2, alignItems: 'flex-start' }}>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
            {student.name}
          </Typography>
          <Typography color="text.secondary">
            <Trans>Parent: {parentName}</Trans>
          </Typography>
          {student.parent.invitationPending && (
            <Chip size="small" label={<Trans>Invitation not accepted yet</Trans>} />
          )}
        </Stack>
      </CardActionArea>
    </Card>
  )
}

/** The own students of the teacher with their parents. */
export function StudentsListScreen() {
  const linkTo = useLinkTo()
  const { data: students, error, refetch } = useQuery(studentsQueryOptions())
  const add = linkTo('students.add')

  return (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <Typography variant="h3" component="h1">
        <Trans>Students</Trans>
      </Typography>

      {add && (
        <Button
          component={RouterLink}
          to={add}
          variant="contained"
          size="large"
          startIcon={<FontAwesomeIcon icon={faUserPlus} />}
          sx={{ alignSelf: { sm: 'flex-start' } }}
        >
          <Trans>Add parent</Trans>
        </Button>
      )}

      {error ? (
        <ErrorAlert error={error} onRetry={() => void refetch()} />
      ) : !students ? (
        <PageLoader />
      ) : students.length === 0 ? (
        <Typography color="text.secondary">
          <Trans>
            No students yet. Add a parent with the name of the child: the parent gets an invitation
            by email.
          </Trans>
        </Typography>
      ) : (
        <Stack component="ul" spacing={1.5} sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {students.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </Stack>
      )}
    </Stack>
  )
}
