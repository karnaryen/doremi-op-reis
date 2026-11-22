import { i18n } from '@lingui/core'
import type { Locale } from '@doremi/org-utils-i18n'

/** Lazy-loads the .po catalog (compiled on the fly by @lingui/vite-plugin) and activates it. */
export async function activateLocale(locale: Locale) {
  const { messages } = await import(`./locales/${locale}/messages.po`)
  i18n.loadAndActivate({ locale, messages })
  document.documentElement.lang = locale
}

export { i18n }
