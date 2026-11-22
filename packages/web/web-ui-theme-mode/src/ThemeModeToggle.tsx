import { useLingui } from '@lingui/react/macro'
import { faCircleHalfStroke, faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useColorScheme } from '@mui/material/styles'

type Mode = 'light' | 'dark' | 'system'

const NEXT: Record<Mode, Mode> = { light: 'dark', dark: 'system', system: 'light' }
const ICON = { light: faSun, dark: faMoon, system: faCircleHalfStroke }

/** Cycles light → dark → system. Persisted by MUI in localStorage. */
export function ThemeModeToggle() {
  const { t } = useLingui()
  const { mode, setMode } = useColorScheme()
  const current: Mode = mode ?? 'system'

  const labels: Record<Mode, string> = {
    light: t`Light mode`,
    dark: t`Dark mode`,
    system: t`System theme`,
  }

  const label = labels[current]

  return (
    <Tooltip title={label}>
      <IconButton
        color="inherit"
        onClick={() => setMode(NEXT[current])}
        aria-label={t`Switch theme (current: ${label})`}
      >
        <FontAwesomeIcon icon={ICON[current]} fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
