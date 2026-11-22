import {
  faCalendarDays,
  faCarSide,
  faClock,
  faLocationDot,
  faMusic,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ShowcaseSection } from './ShowcaseSection'

const LESSONS = [
  {
    name: 'Emma de Vries',
    initials: 'EV',
    time: 'Tue 16:30',
    place: 'Enschede-Noord',
    level: 'Grade 3',
    travel: '12 min',
  },
  {
    name: 'Lucas Jansen',
    initials: 'LJ',
    time: 'Tue 17:30',
    place: 'Hengelo',
    level: 'Beginner',
    travel: '18 min',
  },
  {
    name: 'Sofie Bakker',
    initials: 'SB',
    time: 'Wed 15:00',
    place: 'Oldenzaal',
    level: 'Advanced',
    travel: '22 min',
  },
]

const STUDENT_INITIALS = ['EV', 'LJ', 'SB', 'MK', 'TH', 'NB', 'AR']

export function CardsShowcase() {
  return (
    <ShowcaseSection
      eyebrow="Patterns"
      title="Cards"
      description="Cards have large rounded corners and thin borders. The lesson cards below also show a hover effect for cards that can be clicked."
    >
      <Grid container spacing={3}>
        {LESSONS.map((lesson) => (
          <Grid key={lesson.name} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                height: '100%',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-2px)',
                  borderColor: 'transparent',
                },
              }}
            >
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Avatar>{lesson.initials}</Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="h6" component="h3" noWrap>
                        {lesson.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {lesson.level}
                      </Typography>
                    </Box>
                    <Chip size="small" variant="soft" color="primary" label="Piano" />
                  </Stack>
                  <Stack spacing={0.75} sx={{ color: 'text.secondary' }}>
                    <Typography variant="body2">
                      <FontAwesomeIcon icon={faClock} fixedWidth /> &nbsp;{lesson.time} · 45 min
                    </Typography>
                    <Typography variant="body2">
                      <FontAwesomeIcon icon={faLocationDot} fixedWidth /> &nbsp;{lesson.place}
                    </Typography>
                    <Typography variant="body2">
                      <FontAwesomeIcon icon={faCarSide} fixedWidth /> &nbsp;{lesson.travel} travel
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
              <CardActions>
                <Button size="small">Details</Button>
                <Button size="small" variant="contained" sx={{ ml: 'auto' }}>
                  Start route
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}

        <Grid size={{ xs: 12, md: 8 }}>
          <Card
            variant="elevation"
            elevation={0}
            sx={{ bgcolor: 'brand.surface', color: 'brand.onSurface', height: '100%' }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={2} sx={{ maxWidth: 520 }}>
                <Typography variant="overline">This week</Typography>
                <Typography variant="h4" component="h3">
                  14 lessons, 6 addresses, 1 route.
                </Typography>
                <Typography>
                  The brand surface is peach in light mode and aubergine in dark mode. Use it for
                  special blocks, such as a weekly summary, an onboarding step or a highlight.
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
                  <Button variant="contained" startIcon={<FontAwesomeIcon icon={faCalendarDays} />}>
                    Open schedule
                  </Button>
                  <Button variant="outlined">Share</Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    Students
                  </Typography>
                  <Box sx={{ color: 'secondary.main' }} aria-hidden>
                    <FontAwesomeIcon icon={faMusic} />
                  </Box>
                </Stack>
                <Typography
                  variant="h2"
                  component="p"
                  color="primary"
                  sx={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  32
                </Typography>
                <Chip
                  size="small"
                  variant="soft"
                  color="success"
                  label="+4 this term"
                  sx={{ alignSelf: 'flex-start' }}
                />
                <AvatarGroup max={5} sx={{ justifyContent: 'flex-end' }}>
                  {STUDENT_INITIALS.map((initials) => (
                    <Avatar key={initials}>{initials}</Avatar>
                  ))}
                </AvatarGroup>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </ShowcaseSection>
  )
}
