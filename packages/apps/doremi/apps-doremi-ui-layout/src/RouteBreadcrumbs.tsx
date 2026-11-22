import { useLingui } from '@lingui/react/macro'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useBreadcrumbs } from '@doremi/web-utils-router'
import { Link as RouterLink } from 'react-router'

/** Path from the section to the open screen. Not drawn for a top-level route. */
export function RouteBreadcrumbs() {
  const { t } = useLingui()
  const crumbs = useBreadcrumbs()
  if (crumbs.length < 2) return null

  return (
    <Breadcrumbs aria-label={t`Breadcrumbs`} sx={{ mb: 2 }}>
      {crumbs.map(({ id, to, label }, i) =>
        i === crumbs.length - 1 ? (
          <Typography key={id} color="text.primary" aria-current="page">
            {t(label)}
          </Typography>
        ) : (
          <Link key={id} component={RouterLink} to={to} color="inherit" underline="hover">
            {t(label)}
          </Link>
        ),
      )}
    </Breadcrumbs>
  )
}
