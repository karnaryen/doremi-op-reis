import { defineScreens } from '@doremi/apps-doremi-utils-routes'

const screens = () => import('./screens')

/** Screens of the section "Main" of the teacher. */
export const teachersMainScreens = defineScreens({
  teacher: { lazy: async () => ({ Component: (await screens()).TeacherMain }) },
  'teacher.toReview': { lazy: async () => ({ Component: (await screens()).ToReviewTab }) },
  'teacher.active': { lazy: async () => ({ Component: (await screens()).ActiveTab }) },
  'teacher.completed': { lazy: async () => ({ Component: (await screens()).CompletedTab }) },
})
