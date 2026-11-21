import { useId } from 'react'
import { useLingui } from '@lingui/react/macro'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import { isLocale, LOCALES } from '@/shared/i18n/i18n'
import { useLocaleStore } from './model/localeStore'

/** Language choice for the profile settings. Each option is labelled in its own language. */
export function LocaleSwitcher() {
  const { t } = useLingui()
  const labelId = useId()
  const locale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.setLocale)

  return (
    <FormControl>
      <FormLabel id={labelId}>{t`Language`}</FormLabel>
      <RadioGroup
        aria-labelledby={labelId}
        value={locale}
        onChange={(_, value) => {
          if (isLocale(value)) setLocale(value)
        }}
      >
        {Object.entries(LOCALES).map(([code, label]) => (
          <FormControlLabel key={code} value={code} control={<Radio />} label={label} lang={code} />
        ))}
      </RadioGroup>
    </FormControl>
  )
}
