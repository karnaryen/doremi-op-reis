import { i18n } from '@lingui/core'

export const LOCALES = {
  en: 'English',
  nl: 'Nederlands',
} as const

export type Locale = keyof typeof LOCALES

export const DEFAULT_LOCALE: Locale = 'en'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && value in LOCALES
}

export function detectBrowserLocale(): Locale {
  const lang = navigator.language.split('-')[0]
  return isLocale(lang) ? lang : DEFAULT_LOCALE
}

/** Lazy-loads the .po catalog (compiled on the fly by @lingui/vite-plugin) and activates it. */
export async function activateLocale(locale: Locale) {
  const { messages } = await import(`../../locales/${locale}/messages.po`)
  i18n.loadAndActivate({ locale, messages })
  document.documentElement.lang = locale
}

export { i18n }
