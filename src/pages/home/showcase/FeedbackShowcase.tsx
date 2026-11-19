import { useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { ShowcaseLabel, ShowcasePanel, ShowcaseSection } from './ShowcaseSection'

const SOFT_CHIPS = [
  { color: 'primary', label: 'Piano' },
  { color: 'secondary', label: 'Theory' },
  { color: 'success', label: 'Paid' },
  { color: 'warning', label: 'Pending' },
  { color: 'error', label: 'Overdue' },
] as const

export function FeedbackShowcase() {
  const [tab, setTab] = useState(0)
  const [selected, setSelected] = useState(true)

  return (
    <ShowcaseSection
      eyebrow="Components"
      title="Feedback and navigation"
      description="Alerts use light status colors by default, so they do not draw more attention than the content. Use the filled variant only for errors that need action."
    >
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={1.5}>
            <Alert severity="success">
              <AlertTitle>Lesson booked</AlertTitle>
              Tuesday 16:30 at home, Hengelosestraat 12.
            </Alert>
            <Alert severity="info">The new spring schedule is available.</Alert>
            <Alert severity="warning">You have 2 lessons without a confirmed address.</Alert>
            <Alert severity="error" variant="filled">
              Payment could not be processed.
            </Alert>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <ShowcasePanel>
            <Stack spacing={3}>
              <Tabs value={tab} onChange={(_, next: number) => setTab(next)} aria-label="Lessons">
                <Tab label="Upcoming" />
                <Tab label="Past" />
                <Tab label="Cancelled" />
              </Tabs>
              <Box>
                <ShowcaseLabel>Chips: soft, filled, outlined</ShowcaseLabel>
                <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
                  {SOFT_CHIPS.map(({ color, label }) => (
                    <Chip key={color} variant="soft" color={color} label={label} />
                  ))}
                  <Chip
                    color="primary"
                    variant={selected ? 'filled' : 'outlined'}
                    label={selected ? 'Selected' : 'Not selected'}
                    onClick={() => setSelected((s) => !s)}
                  />
                  <Chip variant="outlined" label="Outlined" />
                </Stack>
              </Box>
              <Box>
                <ShowcaseLabel>Progress</ShowcaseLabel>
                <Stack spacing={2}>
                  <LinearProgress variant="determinate" value={68} aria-label="Term progress" />
                  <LinearProgress
                    variant="determinate"
                    color="secondary"
                    value={35}
                    aria-label="Route progress"
                  />
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <CircularProgress size={28} aria-label="Loading" />
                    <CircularProgress size={28} color="secondary" aria-label="Loading" />
                    <Box sx={{ flexGrow: 1 }}>
                      <Skeleton width="60%" />
                      <Skeleton width="40%" />
                    </Box>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </ShowcasePanel>
        </Grid>
      </Grid>
    </ShowcaseSection>
  )
}
