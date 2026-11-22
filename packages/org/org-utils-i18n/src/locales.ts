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
