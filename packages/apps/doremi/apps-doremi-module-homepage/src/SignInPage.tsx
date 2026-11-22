import { useState } from 'react'
import { Trans, useLingui } from '@lingui/react/macro'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Navigate, Link as RouterLink, useLocation } from 'react-router'
import { useSignIn } from '@doremi/apps-doremi-data-profile'
import { ErrorAlert } from '@doremi/apps-doremi-ui-layout'
import { useLinkTo, useMainLink } from '@doremi/apps-doremi-utils-routes'
import { AuthPage, PasswordField } from './AuthPage'

/** The page a guest wanted to open before the app sent them here (see ForbiddenScreen in the app). */
function useReturnPath(): string | null {
  const state: unknown = useLocation().state
  if (typeof state !== 'object' || state === null || !('from' in state)) return null
  // Only a path inside the app: never a full URL to another site.
  return typeof state.from === 'string' &&
    state.from.startsWith('/') &&
    !state.from.startsWith('//')
    ? state.from
    : null
}

export function SignInPage() {
  const { t } = useLingui()
  const linkTo = useLinkTo()
  const main = useMainLink()
  const returnPath = useReturnPath()
  const signIn = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const signUp = linkTo('signUp')

  // Signed in (just now, or already before): go on to the app.
  if (main) return <Navigate to={returnPath ?? main} replace />

  return (
    <AuthPage
      title={<Trans>Sign in</Trans>}
      onSubmit={() => signIn.mutate({ email: email.trim(), password })}
    >
      <TextField
        label={t`Email`}
        type="email"
        required
        fullWidth
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <PasswordField
        label={t`Password`}
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
      />
      <ErrorAlert error={signIn.error} />
      <Button type="submit" size="large" variant="contained" loading={signIn.isPending}>
        <Trans>Sign in</Trans>
      </Button>
      <Typography variant="body2" color="text.secondary">
        <Trans>
          Are you a parent? Your teacher sends you an invitation by email. Open the link in that
          email to choose a password.
        </Trans>
      </Typography>
      {signUp && (
        <Typography variant="body2">
          <Link component={RouterLink} to={signUp}>
            <Trans>I am a teacher and I have no account yet</Trans>
          </Link>
        </Typography>
      )}
    </AuthPage>
  )
}
