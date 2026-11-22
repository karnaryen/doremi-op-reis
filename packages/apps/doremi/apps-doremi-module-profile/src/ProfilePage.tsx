import { Trans } from '@lingui/react/macro'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { env } from '@doremi/org-data-api'
import { LocaleSwitcher } from './LocaleSwitcher'
import { RolePreview } from './RolePreview'

export function ProfilePage() {
  return (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <Typography variant="h3" component="h1">
        <Trans>Profile</Trans>
      </Typography>
      <Card variant="outlined">
        <CardContent>
          <LocaleSwitcher />
        </CardContent>
      </Card>
      {env.isDev && (
        <Card variant="outlined">
          <CardContent>
            <RolePreview />
          </CardContent>
        </Card>
      )}
    </Stack>
  )
}
