import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { factsOf, packageDirs } from './workspace.ts'

let root: string

function write(path: string, content = '') {
  mkdirSync(dirname(join(root, path)), { recursive: true })
  writeFileSync(join(root, path), content)
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'structure-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('packageDirs', () => {
  it('lists the folders of every group and of every app, but not packages/api', () => {
    write('packages/api/composer.json')
    write('packages/web/web-utils-router/package.json')
    write('packages/native/README.md')
    write('packages/apps/doremi/apps-doremi/package.json')
    write('packages/apps/doremi/apps-doremi-ui-layout/package.json')
    // A folder in a wrong place is listed too: the rules report it.
    write('packages/shared/shared-utils-dates/package.json')

    expect(packageDirs(root).sort()).toEqual([
      'packages/apps/doremi/apps-doremi',
      'packages/apps/doremi/apps-doremi-ui-layout',
      'packages/shared/shared-utils-dates',
      'packages/web/web-utils-router',
    ])
  })
})

describe('factsOf', () => {
  const dir = 'packages/common/common-utils-routes'

  it('reads the facts of a package', () => {
    write(`${dir}/package.json`, '{ "name": "@doremi/common-utils-routes" }')
    write(`${dir}/README.md`)
    write(`${dir}/src/index.ts`)
    write(`${dir}/tsconfig.json`, '{ "compilerOptions": { "lib": ["ES2023"] } }')

    expect(factsOf(root, dir)).toEqual({
      dir,
      manifest: { name: '@doremi/common-utils-routes' },
      hasReadme: true,
      hasIndex: true,
      hasTests: false,
      tsconfigLib: ['ES2023'],
    })
  })

  it('reports missing files as facts, without an error', () => {
    write(`${dir}/dist/index.js`)

    expect(factsOf(root, dir)).toEqual({
      dir,
      manifest: null,
      hasReadme: false,
      hasIndex: false,
      hasTests: false,
      tsconfigLib: null,
    })
  })

  it.each(['src/routes.test.ts', 'src/deep/View.test.tsx', 'src/routes.spec.ts', 'src/a.test.mjs'])(
    'finds the test file %s',
    (file) => {
      write(`${dir}/${file}`)

      expect(factsOf(root, dir).hasTests).toBe(true)
    },
  )

  it('does not count test files of installed libraries', () => {
    write(`${dir}/node_modules/some-library/index.test.ts`)
    write(`${dir}/src/testing.ts`)

    expect(factsOf(root, dir).hasTests).toBe(false)
  })
})
