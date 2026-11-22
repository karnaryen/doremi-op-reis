import { useState } from 'react'
import { Trans } from '@lingui/react/macro'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { Navigate, useLocation } from 'react-router'
import {
  studentQueryOptions,
  useDeleteParent,
  useInviteAgain,
  type StudentDetail,
} from '@doremi/apps-doremi-data-students'
import { ErrorAlert, NotFoundPage, PageLoader } from '@doremi/apps-doremi-ui-layout'
import { useLinkTo } from '@doremi/apps-doremi-utils-routes'
import { useStudentId } from './useStudentId'

/** "Add parent" sends the teacher here and says if the invitation email was sent. */
function useInvitationResult(): boolean | null {
  const state: unknown = useLocation().state
  if (typeof state !== 'object' || state === null || !('invitationSent' in state)) return null
  return typeof state.invitationSent === 'boolean' ? state.invitationSent : null
}

function Invitation({ student }: { student: StudentDetail }) {
  const inviteAgain = useInviteAgain()
  const afterAdd = useInvitationResult()
  // The result of "Send invitation again" on this screen, or else of "Add parent" on the screen before.
  const sent = inviteAgain.data?.invitationSent ?? (inviteAgain.isIdle ? afterAdd : null)
  const email = student.parent.email

  if (!student.parent.invitationPending) {
    return (
      <Typography color="text.secondary">
        <Trans>The parent has accepted the invitation and can sign in.</Trans>
      </Typography>
    )
  }

  return (
    <Stack spacing={1.5}>
      {sent === true && (
        <Alert severity="success">
          <Trans>The invitation was sent to {email}.</Trans>
        </Alert>
      )}
      {sent === false && (
        <Alert severity="warning">
          <Trans>
            The account exists, but the invitation email could not be sent. Try “Send invitation
            again” later.
          </Trans>
        </Alert>
      )}
      <Typography color="text.secondary">
        <Trans>
          The parent has not chosen a password yet. An invitation link works for 7 days; a new
          invitation replaces the old link.
        </Trans>
      </Typography>
      <ErrorAlert error={inviteAgain.error} />
      <Button
        variant="outlined"
        loading={inviteAgain.isPending}
        onClick={() => inviteAgain.mutate(student.parent.id)}
        sx={{ alignSelf: { sm: 'flex-start' }, minHeight: 48 }}
      >
        <Trans>Send invitation again</Trans>
      </Button>
    </Stack>
  )
}

type DeleteParentProps = {
  student: StudentDetail
  /** The mutation lives in the screen: the screen leaves when the deletion has succeeded. */
  deleteParent: ReturnType<typeof useDeleteParent>
}

function DeleteParent({ student, deleteParent }: DeleteParentProps) {
  const [confirming, setConfirming] = useState(false)
  const parentName = student.parent.name
  const childName = student.name

  const confirm = () => deleteParent.mutate(student.parent.id)

  return (
    <>
      <Button
        variant="outlined"
        color="error"
        onClick={() => setConfirming(true)}
        sx={{ alignSelf: { sm: 'flex-start' }, minHeight: 48 }}
      >
        <Trans>Delete parent</Trans>
      </Button>

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        aria-labelledby="delete-parent-title"
      >
        <DialogTitle id="delete-parent-title">
          <Trans>Delete {parentName}?</Trans>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Trans>
              The account of {parentName}, the student {childName}, all pieces of {childName}, the
              recordings and the feedback are deleted at once. This cannot be undone. Your sheet
              music and audio examples stay.
            </Trans>
          </DialogContentText>
          <ErrorAlert error={deleteParent.error} />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirming(false)}
            disabled={deleteParent.isPending}
            sx={{ minHeight: 48 }}
          >
            <Trans>Cancel</Trans>
          </Button>
          <Button
            color="error"
            variant="contained"
            loading={deleteParent.isPending}
            onClick={confirm}
            sx={{ minHeight: 48 }}
          >
            <Trans>Delete</Trans>
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

/** The parent account of one student: name, email, the invitation, and "Delete parent". */
export function ParentScreen() {
  const studentId = useStudentId()
  const linkTo = useLinkTo()
  const deleteParent = useDeleteParent()
  const {
    data: student,
    error,
    refetch,
  } = useQuery({
    ...studentQueryOptions(studentId ?? 0),
    // After the deletion this student does not exist any more: do not ask the API for it again.
    enabled: studentId !== null && !deleteParent.isSuccess,
  })

  if (studentId === null) return <NotFoundPage />
  // The parent is deleted: back to the list of students.
  if (deleteParent.isSuccess) return <Navigate to={linkTo('students') ?? '/'} replace />
  if (error) return <ErrorAlert error={error} onRetry={() => void refetch()} />
  if (!student) return <PageLoader />

  const childName = student.name

  return (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <Typography variant="h3" component="h1" sx={{ overflowWrap: 'anywhere' }}>
        {student.parent.name}
      </Typography>
      <Card variant="outlined">
        <CardContent>
          <Typography sx={{ overflowWrap: 'anywhere' }}>{student.parent.email}</Typography>
          <Typography color="text.secondary">
            <Trans>Child: {childName}</Trans>
          </Typography>
        </CardContent>
      </Card>
      <Invitation student={student} />
      <DeleteParent student={student} deleteParent={deleteParent} />
    </Stack>
  )
}
