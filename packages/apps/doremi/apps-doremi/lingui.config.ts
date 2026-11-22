import { readdirSync } from 'node:fs'
import { defineConfig } from '@lingui/cli'

const root = new URL('../../../../', import.meta.url)

/** `src` folders of all packages in one group. Lingui does not expand `*` inside `include`. */
function sources(group: string) {
  return readdirSync(new URL(`packages/${group}/`, root), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `<rootDir>/packages/${group}/${entry.name}/src`)
}

export default defineConfig({
  // The workspace root, so the catalog can include messages of other packages.
  rootDir: '../../../..',
  sourceLocale: 'en',
  locales: ['en', 'nl'],
  catalogs: [
    {
      path: '<rootDir>/packages/apps/doremi/apps-doremi/src/locales/{locale}/messages',
      // Messages of the app and of every workspace package it can import.
      include: [...sources('apps/doremi'), ...sources('org'), ...sources('web')],
      exclude: ['**/*.test.*'],
    },
  ],
})
