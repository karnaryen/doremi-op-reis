import { useState, type MouseEvent } from 'react'
import { useLingui } from '@lingui/react/macro'
import { faLanguage } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import { LOCALES, type Locale } from '@/shared/i18n/i18n'
import { useLocaleStore } from './model/localeStore'

export function LocaleSwitcher() {
  const { t } = useLingui()
  const locale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.setLocale)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  const open = (e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)
  const close = () => setAnchor(null)
  const choose = (next: Locale) => {
    setLocale(next)
    close()
  }

  return (
    <>
      <Tooltip title={t`Language`}>
        <IconButton color="inherit" onClick={open} aria-label={t`Change language`}>
          <FontAwesomeIcon icon={faLanguage} fixedWidth />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={anchor !== null} onClose={close}>
        {Object.entries(LOCALES).map(([code, label]) => (
          <MenuItem key={code} selected={code === locale} onClick={() => choose(code as Locale)}>
            {label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
