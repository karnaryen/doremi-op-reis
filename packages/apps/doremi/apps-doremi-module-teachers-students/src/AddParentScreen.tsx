import { useState, type FormEvent } from 'react'
import { Trans, useLingui } from '@lingui/react/macro'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router'
import { useAddParent } from '@doremi/apps-doremi-data-students'
import { ErrorAlert } from '@doremi/apps-doremi-ui-layout'
import { useLinkTo } from '@doremi/apps-doremi-utils-routes'

// Must be the same as the limits in packages/api (PersonName::MAX_LENGTH and AddParentRequest).
const NAME_MAX_LENGTH = 80
const EMAIL_MAX_LENGTH = 180

/**
 * "Add parent": the parent account and the child are created together, and the parent gets an invitation email.
 * After that the teacher lands on the screen of the parent, which says if the email was sent.
 */
export function AddParentScreen() {
  const { t } = useLingui()
  const linkTo = useLinkTo()
  const navigate = useNavigate()
  const addParent = useAddParent()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [childName, setChildName] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    addParent.mutate(
      { name: name.trim(), email: email.trim(), childName: childName.trim() },
      {
        onSuccess: (student) => {
          const to = linkTo('students.parent', { studentId: student.id })
          if (to)
            void navigate(to, { replace: true, state: { invitationSent: student.invitationSent } })
        },
      },
    )
  }

  return (
    <Stack component="form" onSubmit={submit} spacing={2.5} sx={{ maxWidth: 480 }}>
      <Typography variant="h3" component="h1">
        <Trans>Add parent</Trans>
      </Typography>
      <Typography color="text.secondary">
        <Trans>
          The parent gets an email with a link to choose a password. The link works for 7 days.
          Names have letters only, no numbers or web addresses.
        </Trans>
      </Typography>
      <TextField
        label={t`Name of the parent`}
        required
        fullWidth
        autoComplete="off"
        value={name}
        onChange={(event) => setName(event.target.value)}
        slotProps={{ htmlInput: { maxLength: NAME_MAX_LENGTH } }}
      />
      <TextField
        label={t`Email of the parent`}
        type="email"
        required
        fullWidth
        autoComplete="off"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        slotProps={{ htmlInput: { maxLength: EMAIL_MAX_LENGTH } }}
      />
      <TextField
        label={t`Name of the child`}
        required
        fullWidth
        autoComplete="off"
        value={childName}
        onChange={(event) => setChildName(event.target.value)}
        slotProps={{ htmlInput: { maxLength: NAME_MAX_LENGTH } }}
      />
      <ErrorAlert error={addParent.error} />
      <Button type="submit" variant="contained" size="large" loading={addParent.isPending}>
        <Trans>Add and send invitation</Trans>
      </Button>
    </Stack>
  )
}
