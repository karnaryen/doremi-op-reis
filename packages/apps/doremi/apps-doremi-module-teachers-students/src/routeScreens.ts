import { defineScreens } from '@doremi/apps-doremi-utils-routes'

/** Screens of the section "Students" of the teacher. */
export const teachersStudentsScreens = defineScreens({
  students: {
    lazy: async () => ({ Component: (await import('./StudentsSection')).StudentsSection }),
  },
  'students.list': {
    lazy: async () => ({ Component: (await import('./StudentsListScreen')).StudentsListScreen }),
  },
  'students.add': {
    lazy: async () => ({ Component: (await import('./AddParentScreen')).AddParentScreen }),
  },
  'students.student': {
    lazy: async () => ({ Component: (await import('./StudentScreen')).StudentScreen }),
  },
  'students.parent': {
    lazy: async () => ({ Component: (await import('./ParentScreen')).ParentScreen }),
  },
  'students.assign': {
    lazy: async () => ({ Component: (await import('./AssignScreen')).AssignScreen }),
  },
})
