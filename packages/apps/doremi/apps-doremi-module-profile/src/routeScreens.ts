import { defineScreens } from '@doremi/apps-doremi-utils-routes'

/** Screens of the section "Profile". */
export const profileScreens = defineScreens({
  profile: { lazy: async () => ({ Component: (await import('./ProfilePage')).ProfilePage }) },
})
