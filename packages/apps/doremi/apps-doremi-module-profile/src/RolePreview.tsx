import { useId } from 'react'
import { useLingui } from '@lingui/react/macro'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import FormLabel from '@mui/material/FormLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import { isRole, useSessionStore, type Role } from '@doremi/org-utils-auth'

/**
 * Development only: switches the role, so the role-based navigation can be checked before
 * sign-in exists (roadmap phase 4). The profile page draws it only in a development build.
 */
export function RolePreview() {
  const { t } = useLingui()
  const labelId = useId()
  const role = useSessionStore((s) => s.role)
  const setRole = useSessionStore((s) => s.setRole)

  const labels: Record<Role, string> = {
    guest: t`Guest`,
    teacher: t`Teacher`,
    parent: t`Parent`,
  }

  return (
    <FormControl>
      <FormLabel id={labelId}>{t`Role preview`}</FormLabel>
      <RadioGroup
        aria-labelledby={labelId}
        value={role}
        onChange={(_, value) => {
          if (isRole(value)) setRole(value)
        }}
      >
        {Object.entries(labels).map(([value, label]) => (
          <FormControlLabel key={value} value={value} control={<Radio />} label={label} />
        ))}
      </RadioGroup>
      <FormHelperText>{t`Development only. Sign-in will replace this.`}</FormHelperText>
    </FormControl>
  )
}
