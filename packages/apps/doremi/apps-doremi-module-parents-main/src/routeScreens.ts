import { defineScreens } from '@doremi/apps-doremi-utils-routes'

const tabs = () => import('./tabs')

/** Screens of the section "Main" of the parent. */
export const parentsMainScreens = defineScreens({
  parent: { lazy: async () => ({ Component: (await import('./ParentMain')).ParentMain }) },
  'parent.active': { lazy: async () => ({ Component: (await tabs()).ActiveTab }) },
  'parent.completed': { lazy: async () => ({ Component: (await tabs()).CompletedTab }) },
  'parent.assignment': {
    lazy: async () => ({ Component: (await import('./PieceCardScreen')).PieceCardScreen }),
  },
  'parent.upload': {
    lazy: async () => ({ Component: (await import('./UploadScreen')).UploadScreen }),
  },
})
