import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { detectBrowserLocale, isLocale, type Locale } from '@/shared/i18n/i18n'

type LocaleState = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: detectBrowserLocale(),
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'doremi:locale',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ locale }) => ({ locale }),
      merge: (persisted, current) => {
        const locale = (persisted as Partial<LocaleState> | undefined)?.locale
        return isLocale(locale) ? { ...current, locale } : current
      },
    },
  ),
)
