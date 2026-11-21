import { useLingui } from '@lingui/react/macro'
import { faCircleUser, faHouse } from '@fortawesome/free-solid-svg-icons'
import { useLocation } from 'react-router'
import { paths } from '@/shared/config/paths'

/**
 * App sections (see docs/product/users.md#navigation) and the active one.
 * Phones show them in the bottom bar, tablet and desktop in the top bar.
 * Role-specific sections (Students) are added with authentication.
 */
export function useSections() {
  const { t } = useLingui()
  const { pathname } = useLocation()

  const sections = [
    { to: paths.home, label: t`Main`, icon: faHouse },
    { to: paths.profile, label: t`Profile`, icon: faCircleUser },
  ]
  const active = sections.find((s) => s.to === pathname)?.to

  return { sections, active }
}
