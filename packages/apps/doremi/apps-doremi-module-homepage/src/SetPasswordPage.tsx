import { useState } from 'react'
import { Trans, useLingui } from '@lingui/react/macro'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import { Navigate, useLocation } from 'react-router'
import { useAcceptInvitation, useProfile } from '@doremi/apps-doremi-data-profile'
import { ErrorAlert } from '@doremi/apps-doremi-ui-layout'
import { useLinkTo, useMainLink } from '@doremi/apps-doremi-utils-routes'
import { AuthPage, PASSWORD_MIN_LENGTH, PasswordField } from './AuthPage'

/**
 * The token of the invitation link: /set-password#token=<64 hex characters>.
 * It is in the fragment (after "#"): a browser does not send the fragment to a server,
 * so the token is not in the logs of the web host.
 */
function useInvitationToken(): string | null {
  const token = new URLSearchParams(useLocation().hash.slice(1)).get('token')
  return token !== null && /^[0-9a-f]{64}$/.test(token) ? token : null
}

/** A parent opens the invitation link, chooses a password and is signed in. */
export function SetPasswordPage() {
  const { t } = useLingui()
  const token = useInvitationToken()
  const linkTo = useLinkTo()
  const main = useMainLink()
  const profile = useProfile()
  const accept = useAcceptInvitation()
  const [password, setPassword] = useState('')
  const parentMain = linkTo('parent')
  const signedInName = profile?.name

  // The password is saved and the parent is signed in. `parentMain` exists when the route table knows
  // the parent role: the next screen reads the same route table (see ProfilePage for this rule).
  if (accept.isSuccess && parentMain) return <Navigate to={parentMain} replace />

  if (token === null) {
    // A signed-in user with a broken link has nothing to do here.
    if (main) return <Navigate to={main} replace />

    return (
      <AuthPage title={<Trans>Choose a password</Trans>} onSubmit={() => {}}>
        <Alert severity="warning">
          <Trans>
            This link is not complete. Open the link from the invitation email again, or ask the
            teacher to send a new invitation.
          </Trans>
        </Alert>
      </AuthPage>
    )
  }

  return (
    <AuthPage
      title={<Trans>Choose a password</Trans>}
      intro={
        <Trans>
          Welcome to Doremi op reis. Choose a password for your account. Next time you sign in with
          your email address and this password.
        </Trans>
      }
      onSubmit={() => accept.mutate({ token, password })}
    >
      {/* For example: the teacher tries the invitation on their own phone, or a family shares one phone. */}
      {signedInName && !accept.isSuccess && (
        <Alert severity="info">
          <Trans>
            This browser is signed in as {signedInName}. When you save the password, it is signed in
            with the invited account instead.
          </Trans>
        </Alert>
      )}
      <PasswordField
        label={t`New password`}
        helperText={t`At least ${PASSWORD_MIN_LENGTH} characters.`}
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
      />
      <ErrorAlert error={accept.error} />
      <Button type="submit" size="large" variant="contained" loading={accept.isPending}>
        <Trans>Save password and sign in</Trans>
      </Button>
    </AuthPage>
  )
}
