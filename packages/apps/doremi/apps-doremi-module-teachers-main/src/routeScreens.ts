import { defineScreens } from '@doremi/apps-doremi-utils-routes'

const tabs = () => import('./tabs')

/** Screens of the section "Main" of the teacher. */
export const teachersMainScreens = defineScreens({
  teacher: { lazy: async () => ({ Component: (await import('./TeacherMain')).TeacherMain }) },
  'teacher.toReview': { lazy: async () => ({ Component: (await tabs()).ToReviewTab }) },
  'teacher.active': { lazy: async () => ({ Component: (await tabs()).ActiveTab }) },
  'teacher.completed': { lazy: async () => ({ Component: (await tabs()).CompletedTab }) },
  'teacher.assignment': {
    lazy: async () => ({ Component: (await import('./AssignmentScreen')).AssignmentScreen }),
  },
})
