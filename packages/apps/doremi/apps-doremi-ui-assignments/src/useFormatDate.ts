import { useLingui } from '@lingui/react'

/** Returns `formatDate(iso)`: a date in the language of the app, for example "22 November 2026". */
export function useFormatDate() {
  const { i18n } = useLingui()
  const format = new Intl.DateTimeFormat(i18n.locale, { dateStyle: 'long' })
  return (iso: string) => format.format(new Date(iso))
}
