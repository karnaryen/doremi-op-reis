import '@testing-library/jest-dom/vitest'
import { i18n } from '@lingui/core'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll } from 'vitest'

beforeAll(() => {
  // Source-language messages are inlined by the macro in non-production builds.
  i18n.loadAndActivate({ locale: 'en', messages: {} })
})

afterEach(() => {
  cleanup()
  // The locale is saved in localStorage: do not let one test change the language of the next.
  localStorage.clear()
})
