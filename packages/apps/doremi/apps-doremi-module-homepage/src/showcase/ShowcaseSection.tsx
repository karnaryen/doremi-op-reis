import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

type Props = { eyebrow: string; title: string; description?: string; children: ReactNode }

/** Section of the design-system showcase: small label, heading, description and content. */
export function ShowcaseSection({ eyebrow, title, description, children }: Props) {
  return (
    <Stack component="section" spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="overline" color="secondary.softText">
          {eyebrow}
        </Typography>
        <Typography variant="h3" component="h2">
          {title}
        </Typography>
        {description && (
          <Typography color="text.secondary" sx={{ maxWidth: '68ch' }}>
            {description}
          </Typography>
        )}
      </Stack>
      {children}
    </Stack>
  )
}

/** Small label above a group of examples. */
export function ShowcaseLabel({ children }: { children: ReactNode }) {
  return (
    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
      {children}
    </Typography>
  )
}

/** Outlined box that holds a group of examples. */
export function ShowcasePanel({ children }: { children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, height: '100%' }}>
      {children}
    </Paper>
  )
}
