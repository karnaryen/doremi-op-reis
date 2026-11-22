import { defineScreens } from '@doremi/apps-doremi-utils-routes'

const screens = () => import('./screens')

/** Screens of the section "Main" of the parent. */
export const parentsMainScreens = defineScreens({
  parent: { lazy: async () => ({ Component: (await screens()).ParentMain }) },
  'parent.active': { lazy: async () => ({ Component: (await screens()).ActiveTab }) },
  'parent.completed': { lazy: async () => ({ Component: (await screens()).CompletedTab }) },
})
