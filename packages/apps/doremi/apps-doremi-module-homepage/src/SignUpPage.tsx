import { useState } from 'react'
import { Trans, useLingui } from '@lingui/react/macro'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Navigate, Link as RouterLink } from 'react-router'
import { useSignUp } from '@doremi/apps-doremi-data-profile'
import { ErrorAlert } from '@doremi/apps-doremi-ui-layout'
import { useLinkTo, useMainLink } from '@doremi/apps-doremi-utils-routes'
import { AuthPage, PASSWORD_MIN_LENGTH, PasswordField } from './AuthPage'

// Must be the same as the limits in packages/api (PersonName::MAX_LENGTH and SignUpRequest).
const NAME_MAX_LENGTH = 80
const EMAIL_MAX_LENGTH = 180

/** Sign-up is for teachers only: a parent gets the account from the teacher. */
export function SignUpPage() {
  const { t } = useLingui()
  const linkTo = useLinkTo()
  const main = useMainLink()
  const signUp = useSignUp()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const signIn = linkTo('signIn')

  if (main) return <Navigate to={main} replace />

  return (
    <AuthPage
      title={<Trans>Teacher sign-up</Trans>}
      intro={
        <Trans>
          Create your teacher account. After that you add the parents of your students; they get an
          invitation by email.
        </Trans>
      }
      onSubmit={() => signUp.mutate({ name: name.trim(), email: email.trim(), password })}
    >
      <TextField
        label={t`Your name`}
        required
        fullWidth
        autoComplete="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        helperText={t`Letters only, no numbers or web addresses.`}
        slotProps={{ htmlInput: { maxLength: NAME_MAX_LENGTH } }}
      />
      <TextField
        label={t`Email`}
        type="email"
        required
        fullWidth
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        slotProps={{ htmlInput: { maxLength: EMAIL_MAX_LENGTH } }}
      />
      <PasswordField
        label={t`Password`}
        helperText={t`At least ${PASSWORD_MIN_LENGTH} characters.`}
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
      />
      <ErrorAlert error={signUp.error} />
      <Button type="submit" size="large" variant="contained" loading={signUp.isPending}>
        <Trans>Create account</Trans>
      </Button>
      {signIn && (
        <Typography variant="body2">
          <Link component={RouterLink} to={signIn}>
            <Trans>I already have an account</Trans>
          </Link>
        </Typography>
      )}
    </AuthPage>
  )
}
