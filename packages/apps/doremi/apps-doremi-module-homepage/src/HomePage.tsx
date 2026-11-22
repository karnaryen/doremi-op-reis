import { Trans } from '@lingui/react/macro'
import {
  faCommentDots,
  faFileLines,
  faVideo,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { Navigate, Link as RouterLink } from 'react-router'
import { useLinkTo, useMainLink } from '@doremi/apps-doremi-utils-routes'
import { tokens } from '@doremi/org-ui-theme'

function Step({
  icon,
  title,
  children,
}: {
  icon: IconDefinition
  title: ReactNode
  children: ReactNode
}) {
  return (
    <Card variant="outlined" component="li">
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Typography color="primary" sx={{ fontSize: 24, lineHeight: 1.2 }}>
            <FontAwesomeIcon icon={icon} fixedWidth />
          </Typography>
          <div>
            <Typography variant="h6" component="h3">
              {title}
            </Typography>
            <Typography color="text.secondary">{children}</Typography>
          </div>
        </Stack>
      </CardContent>
    </Card>
  )
}

/**
 * The homepage for guests: what the app is, for whom, and how it works (docs/product/overview.md).
 * A signed-in user has the section "Main" instead and is sent there.
 */
export function HomePage() {
  const linkTo = useLinkTo()
  const main = useMainLink()
  const signIn = linkTo('signIn')
  const signUp = linkTo('signUp')

  if (main) return <Navigate to={main} replace />

  return (
    <Stack spacing={{ xs: 5, md: 8 }}>
      <Box
        sx={{
          borderRadius: `${tokens.radius.xl}px`,
          bgcolor: 'brand.surface',
          color: 'brand.onSurface',
          px: { xs: 3, md: 8 },
          py: { xs: 5, md: 8 },
        }}
      >
        <Stack spacing={3} sx={{ maxWidth: 640 }}>
          <Typography variant="h1">Doremi op reis</Typography>
          <Typography variant="lead">
            <Trans>
              Music lessons go on while the teacher travels. The teacher gives pieces to practise,
              parents send a short recording, and the teacher answers when there is time.
            </Trans>
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            {signIn && (
              <Button component={RouterLink} to={signIn} size="large" variant="contained">
                <Trans>Sign in</Trans>
              </Button>
            )}
            {signUp && (
              <Button component={RouterLink} to={signUp} size="large" variant="outlined">
                <Trans>I am a teacher: create an account</Trans>
              </Button>
            )}
          </Stack>
          <Typography variant="body2">
            <Trans>Parents get their account from the teacher, by email.</Trans>
          </Typography>
        </Stack>
      </Box>

      <Stack spacing={2}>
        <Typography variant="h4" component="h2">
          <Trans>How it works</Trans>
        </Typography>
        <Stack component="ol" spacing={1.5} sx={{ listStyle: 'none', p: 0, m: 0 }}>
          <Step icon={faFileLines} title={<Trans>The teacher gives a piece</Trans>}>
            <Trans>
              With sheet music, an audio example and a short instruction: what to practise at home,
              and how a parent can help.
            </Trans>
          </Step>
          <Step icon={faVideo} title={<Trans>The child practises, the parent records</Trans>}>
            <Trans>
              A video or an audio recording of the hands and the instrument. There are no deadlines:
              the family decides the speed.
            </Trans>
          </Step>
          <Step icon={faCommentDots} title={<Trans>The teacher gives feedback</Trans>}>
            <Trans>
              The teacher listens and writes what goes well and what to try next. When the piece is
              ready, the teacher completes it.
            </Trans>
          </Step>
        </Stack>
      </Stack>
    </Stack>
  )
}
