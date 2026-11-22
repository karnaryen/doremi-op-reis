import { useState } from 'react'
import { faLocationDot, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Rating from '@mui/material/Rating'
import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { ShowcaseLabel, ShowcasePanel, ShowcaseSection } from './ShowcaseSection'

const startIcon = (icon: ReactNode) => ({
  input: { startAdornment: <InputAdornment position="start">{icon}</InputAdornment> },
})

export function FormsShowcase() {
  const [duration, setDuration] = useState(45)
  return (
    <ShowcaseSection
      eyebrow="Components"
      title="Inputs"
      description="Input fields have a paper background, a taupe border and a light plum ring when they have focus."
    >
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <ShowcasePanel>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Student name" defaultValue="Emma de Vries" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Address"
                  placeholder="Street, city"
                  slotProps={startIcon(<FontAwesomeIcon icon={faLocationDot} />)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth select label="Level" defaultValue="intermediate">
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  defaultValue="emma@"
                  error
                  helperText="Enter a valid email address"
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Search"
                  placeholder="Search students, lessons…"
                  size="small"
                  slotProps={startIcon(<FontAwesomeIcon icon={faMagnifyingGlass} />)}
                />
              </Grid>
            </Grid>
          </ShowcasePanel>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <ShowcasePanel>
            <Stack spacing={2}>
              <Box>
                <ShowcaseLabel>Lesson length · {duration} min</ShowcaseLabel>
                <Slider
                  value={duration}
                  onChange={(_, value) => setDuration(value)}
                  step={15}
                  min={30}
                  max={60}
                  marks
                  aria-label="Lesson length"
                />
              </Box>
              <RadioGroup row defaultValue="weekly" aria-label="Frequency">
                <FormControlLabel value="weekly" control={<Radio />} label="Weekly" />
                <FormControlLabel value="biweekly" control={<Radio />} label="Every 2 weeks" />
              </RadioGroup>
              <FormControlLabel control={<Checkbox defaultChecked />} label="Send reminder" />
              <FormControlLabel control={<Switch defaultChecked />} label="Lessons at home" />
              <FormControlLabel control={<Switch />} label="Available on weekends" />
              <FormControlLabel
                control={<Switch size="small" defaultChecked />}
                label="Small switch"
              />
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography id="rating-label" variant="body2" color="text.secondary">
                  Rating
                </Typography>
                <Rating
                  defaultValue={4.5}
                  precision={0.5}
                  slotProps={{ root: { 'aria-labelledby': 'rating-label' } }}
                />
              </Stack>
            </Stack>
          </ShowcasePanel>
        </Grid>
      </Grid>
    </ShowcaseSection>
  )
}
