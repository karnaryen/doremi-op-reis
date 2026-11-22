import { defineScreens } from '@doremi/apps-doremi-utils-routes'

/** Screens of the public pages. */
export const homepageScreens = defineScreens({
  home: { lazy: async () => ({ Component: (await import('./HomePage')).HomePage }) },
  about: { lazy: async () => ({ Component: (await import('./AboutPage')).AboutPage }) },
  designSystem: {
    lazy: async () => ({ Component: (await import('./DesignSystemPage')).DesignSystemPage }),
  },
  signIn: { lazy: async () => ({ Component: (await import('./SignInPage')).SignInPage }) },
  signUp: { lazy: async () => ({ Component: (await import('./SignUpPage')).SignUpPage }) },
  setPassword: {
    lazy: async () => ({ Component: (await import('./SetPasswordPage')).SetPasswordPage }),
  },
})
