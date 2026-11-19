import { useState } from 'react'
import {
  faArrowRight,
  faBell,
  faEllipsis,
  faHeart,
  faPlus,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Tooltip from '@mui/material/Tooltip'
import { ShowcaseLabel, ShowcasePanel, ShowcaseSection } from './ShowcaseSection'

const COLORS = [
  { color: 'primary', label: 'Primary' },
  { color: 'secondary', label: 'Secondary' },
  { color: 'success', label: 'Success' },
  { color: 'warning', label: 'Warning' },
  { color: 'error', label: 'Error' },
] as const

export function ButtonsShowcase() {
  return (
    <ShowcaseSection
      eyebrow="Components"
      title="Actions"
      description="Buttons have fully rounded corners and sentence-case labels. Use contained for the main action, outlined for other actions and text for less important actions."
    >
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <ShowcasePanel>
            <Stack spacing={3}>
              {(['contained', 'outlined', 'text'] as const).map((variant) => (
                <Box key={variant}>
                  <ShowcaseLabel>{variant}</ShowcaseLabel>
                  <Stack direction="row" useFlexGap spacing={1.5} sx={{ flexWrap: 'wrap' }}>
                    {COLORS.map(({ color, label }) => (
                      <Button key={color} variant={variant} color={color}>
                        {label}
                      </Button>
                    ))}
                    <Button variant={variant} disabled>
                      Disabled
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </ShowcasePanel>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <ShowcasePanel>
            <Stack spacing={3}>
              <Box>
                <ShowcaseLabel>Sizes and icons</ShowcaseLabel>
                <Stack
                  direction="row"
                  useFlexGap
                  spacing={1.5}
                  sx={{ flexWrap: 'wrap', alignItems: 'center' }}
                >
                  <Button size="small" variant="contained">
                    Small
                  </Button>
                  <Button variant="contained" startIcon={<FontAwesomeIcon icon={faPlus} />}>
                    Add lesson
                  </Button>
                  <Button
                    size="large"
                    variant="contained"
                    endIcon={<FontAwesomeIcon icon={faArrowRight} />}
                  >
                    Plan route
                  </Button>
                </Stack>
              </Box>
              <Box>
                <ShowcaseLabel>Icon buttons, badge, tooltip, link</ShowcaseLabel>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Tooltip title="Notifications">
                    <IconButton aria-label="Notifications">
                      <Badge badgeContent={3} color="secondary">
                        <FontAwesomeIcon icon={faBell} fixedWidth />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Favourite">
                    <IconButton color="primary" aria-label="Favourite">
                      <FontAwesomeIcon icon={faHeart} fixedWidth />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="More">
                    <IconButton aria-label="More">
                      <FontAwesomeIcon icon={faEllipsis} fixedWidth />
                    </IconButton>
                  </Tooltip>
                  <Link href="#components" sx={{ ml: 2 }}>
                    Inline link
                  </Link>
                </Stack>
              </Box>
              <Box>
                <ShowcaseLabel>Segmented control</ShowcaseLabel>
                <SegmentedDemo />
              </Box>
            </Stack>
          </ShowcasePanel>
        </Grid>
      </Grid>
    </ShowcaseSection>
  )
}

function SegmentedDemo() {
  const [view, setView] = useState('week')
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={view}
      onChange={(_, next: string | null) => next && setView(next)}
      aria-label="Calendar view"
    >
      <ToggleButton value="day">Day</ToggleButton>
      <ToggleButton value="week">Week</ToggleButton>
      <ToggleButton value="month">Month</ToggleButton>
    </ToggleButtonGroup>
  )
}
