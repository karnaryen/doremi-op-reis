import { Trans } from '@lingui/react/macro'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Navigate, Link as RouterLink } from 'react-router'
import { useProfile, useSignOut } from '@doremi/apps-doremi-data-profile'
import { ErrorAlert } from '@doremi/apps-doremi-ui-layout'
import { useLinkTo, useMainLink } from '@doremi/apps-doremi-utils-routes'
import { LocaleSwitcher } from './LocaleSwitcher'

/** Section "Profile": who is signed in, the language and sign-out. A guest gets the sign-in buttons. */
export function ProfilePage() {
  const profile = useProfile()
  const linkTo = useLinkTo()
  const main = useMainLink()
  const signOut = useSignOut()
  const signIn = linkTo('signIn')
  const signUp = linkTo('signUp')
  const childName = profile?.childName

  // Signed out just now: go to the homepage. Two details make this safe:
  // - It is decided while rendering and not in the callback of the mutation, which can run one moment too early.
  // - It waits until the route table has no "Main" any more (`useMainLink`), and does not look at `profile`.
  //   The homepage reads the same route table. If this page looked at `profile`, it could know about the sign-out
  //   one render before the route table: the homepage would still see the old user and send them on to "Main".
  if (signOut.isSuccess && main === null) return <Navigate to={linkTo('home') ?? '/'} replace />

  return (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <Typography variant="h3" component="h1">
        <Trans>Profile</Trans>
      </Typography>

      {profile ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" component="h2">
              {profile.name}
            </Typography>
            <Typography color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
              {profile.email}
            </Typography>
            <Typography color="text.secondary">
              {profile.role === 'teacher' ? <Trans>Teacher</Trans> : <Trans>Parent</Trans>}
              {childName && (
                <>
                  {' · '}
                  <Trans>Child: {childName}</Trans>
                </>
              )}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1.5}>
              <Typography color="text.secondary">
                <Trans>You are not signed in.</Trans>
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                {signIn && (
                  <Button component={RouterLink} to={signIn} variant="contained" size="large">
                    <Trans>Sign in</Trans>
                  </Button>
                )}
                {signUp && (
                  <Button component={RouterLink} to={signUp} variant="outlined" size="large">
                    <Trans>Teacher sign-up</Trans>
                  </Button>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Card variant="outlined">
        <CardContent>
          <LocaleSwitcher />
        </CardContent>
      </Card>

      {profile && (
        <>
          <ErrorAlert error={signOut.error} />
          <Button
            variant="outlined"
            size="large"
            loading={signOut.isPending}
            onClick={() => signOut.mutate()}
            sx={{ alignSelf: { sm: 'flex-start' } }}
          >
            <Trans>Sign out</Trans>
          </Button>
        </>
      )}
    </Stack>
  )
}
