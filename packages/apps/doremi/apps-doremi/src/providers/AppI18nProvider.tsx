import { useEffect, type ReactNode } from 'react'
import { I18nProvider } from '@lingui/react'
import { useLocaleStore } from '@doremi/org-utils-i18n'
import { activateLocale, i18n } from '../i18n'

/** Keeps Lingui in sync with the persisted locale. Initial locale is activated in main.tsx. */
export function AppI18nProvider({ children }: { children: ReactNode }) {
  const locale = useLocaleStore((s) => s.locale)

  useEffect(() => {
    if (i18n.locale !== locale) void activateLocale(locale)
  }, [locale])

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
