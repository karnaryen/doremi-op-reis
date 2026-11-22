import { describe, expect, it } from 'vitest'
import { checkLockfile, checkPackage, checkRootManifest, type PackageFacts } from './structure.ts'

/** A correct library in `packages/web`. Each test changes one thing. */
function webLibrary(change: Partial<PackageFacts> = {}, manifest: object = {}): PackageFacts {
  return {
    dir: 'packages/web/web-utils-router',
    manifest: {
      name: '@doremi/web-utils-router',
      private: true,
      exports: { '.': './src/index.ts' },
      scripts: { typecheck: 'tsc -p tsconfig.json', lint: 'eslint .' },
      dependencies: { '@doremi/common-utils-routes': 'workspace:*', react: 'catalog:' },
      nx: { projectType: 'library', tags: ['platform:web', 'layer:generic', 'type:utils'] },
      ...manifest,
    },
    hasReadme: true,
    hasIndex: true,
    hasTests: false,
    tsconfigLib: null,
    ...change,
  }
}

function appPackage(folder: string, nx: object, manifest: object = {}): PackageFacts {
  return webLibrary(
    { dir: `packages/apps/doremi/${folder}` },
    { name: `@doremi/${folder}`, nx, ...manifest },
  )
}

describe('checkPackage', () => {
  it('accepts a correct library', () => {
    expect(checkPackage(webLibrary())).toEqual([])
  })

  it('accepts the app and a module of the app', () => {
    const tags = ['platform:web', 'layer:app', 'app:doremi']
    const app = appPackage(
      'apps-doremi',
      { projectType: 'application', tags: [...tags, 'type:app'] },
      { exports: undefined },
    )
    const module = appPackage('apps-doremi-module-profile', {
      projectType: 'library',
      tags: [...tags, 'type:module'],
    })

    expect(checkPackage({ ...app, hasIndex: false })).toEqual([])
    expect(checkPackage(module)).toEqual([])
  })

  it('reports a package name that differs from the folder name', () => {
    expect(checkPackage(webLibrary({}, { name: '@doremi/router' }))).toEqual([
      'the package name must be @doremi/web-utils-router',
    ])
  })

  it('reports a folder name without a known type', () => {
    expect(checkPackage(webLibrary({ dir: 'packages/web/web-router' }))).toEqual([
      'the folder name must be web-<data|ui|utils>-<name>',
    ])
    // A module is a part of an app: it cannot be generic code.
    expect(checkPackage(webLibrary({ dir: 'packages/web/web-module-profile' }))).toEqual([
      'the folder name must be web-<data|ui|utils>-<name>',
    ])
  })

  it('reports a package outside the known folders', () => {
    expect(checkPackage(webLibrary({ dir: 'packages/shared/shared-utils-dates' }))).toEqual([
      'unknown folder packages/shared: use common, web, native, org, apps',
    ])
    expect(checkPackage(webLibrary({ dir: 'packages/apps/apps-doremi' }))).toEqual([
      'an app package must be in packages/apps/<app>/<package>',
    ])
  })

  it('reports tags that do not match the folder', () => {
    const nx = { projectType: 'library', tags: ['platform:common', 'layer:org', 'type:ui'] }

    expect(checkPackage(webLibrary({}, { nx }))).toEqual([
      'the platform tag must be platform:web, not platform:common',
      'nx.tags must have exactly one layer: tag, and it must be layer:generic',
      'nx.tags must have exactly one type: tag, and it must be type:utils',
      'a platform:common package must set "lib" in tsconfig.json, without DOM (the check reads plain JSON: no comments)',
    ])
  })

  it('reports an app tag on a package outside packages/apps, and an unknown tag', () => {
    const tags = ['platform:web', 'layer:generic', 'type:utils', 'app:doremi', 'scope:x']

    expect(checkPackage(webLibrary({}, { nx: { projectType: 'library', tags } }))).toEqual([
      'only app packages have an app: tag',
      'unknown tag scope:x',
    ])
  })

  it('reports an app package with the tag of another app', () => {
    const nx = {
      projectType: 'library',
      tags: ['platform:web', 'layer:app', 'app:other', 'type:ui'],
    }

    expect(checkPackage(appPackage('apps-doremi-ui-layout', nx))).toEqual([
      'nx.tags must have exactly one app: tag, and it must be app:doremi',
    ])
  })

  it('reports a library that exports more than src/index.ts', () => {
    const exports = { '.': './src/index.ts', './internal': './src/internal.ts' }

    expect(checkPackage(webLibrary({ hasIndex: false }, { exports }))).toEqual([
      '"exports" must be { ".": "./src/index.ts" }',
      'src/index.ts is missing',
    ])
  })

  it('reports test files that no script runs', () => {
    expect(checkPackage(webLibrary({ hasTests: true }))).toEqual([
      'the package has test files but no "test" script, so the tests never run',
    ])
  })

  it('reports a missing lint script, a public package and a missing README', () => {
    const scripts = { typecheck: 'tsc -p tsconfig.json' }

    expect(checkPackage(webLibrary({ hasReadme: false }, { scripts, private: false }))).toEqual([
      '"private" must be true',
      'the "lint" script must be "eslint ."',
      'README.md is missing',
    ])
  })

  it('reports a lint script that does not lint package.json', () => {
    const scripts = { typecheck: 'tsc -p tsconfig.json', lint: 'eslint src' }

    expect(checkPackage(webLibrary({}, { scripts }))).toEqual([
      'the "lint" script must be "eslint ."',
    ])
  })

  it('reports tags that are not a list, and an unknown platform', () => {
    const nx = (tags: unknown) => ({ nx: { projectType: 'library', tags } })
    const orgLibrary = (tags: unknown) =>
      webLibrary(
        { dir: 'packages/org/org-utils-i18n' },
        { name: '@doremi/org-utils-i18n', ...nx(tags) },
      )

    expect(checkPackage(webLibrary({}, nx('platform:web')))).toEqual([
      'nx.tags must be a list of strings',
    ])
    // In packages/org the folder does not decide the platform, but the value must exist.
    expect(checkPackage(orgLibrary(['platform:web', 'layer:org', 'type:utils']))).toEqual([])
    expect(checkPackage(orgLibrary(['platform:desktop', 'layer:org', 'type:utils']))).toEqual([
      'unknown tag platform:desktop',
    ])
  })

  it('reports an app folder name that cannot be a part of a package name', () => {
    const facts = webLibrary({ dir: 'packages/apps/My.App/apps-My.App' })

    expect(checkPackage(facts)).toEqual([
      'the app folder name "My.App" must be lower-case words with hyphens',
    ])
  })

  it('reports DOM types in a platform:common package', () => {
    const common = (tsconfigLib: string[] | null) =>
      webLibrary(
        { dir: 'packages/org/org-utils-auth', tsconfigLib },
        {
          name: '@doremi/org-utils-auth',
          nx: { projectType: 'library', tags: ['platform:common', 'layer:org', 'type:utils'] },
        },
      )

    expect(checkPackage(common(['ES2023']))).toEqual([])
    expect(checkPackage(common(['ES2023', 'DOM']))).toEqual([
      'a platform:common package must not have DOM in the "lib" of tsconfig.json',
    ])
  })

  it('reports a version that is not in the catalog', () => {
    const manifest = {
      dependencies: { '@doremi/common-utils-routes': '^1.0.0', react: '^19.3.1' },
      devDependencies: { vitest: 'catalog:', vite: 'catalog:tools' },
      peerDependencies: { 'react-dom': '>=19' },
    }

    expect(checkPackage(webLibrary({}, manifest))).toEqual([
      'dependencies: "@doremi/common-utils-routes" must be "workspace:*", not "^1.0.0"',
      'dependencies: "react" must be "catalog:", not "^19.3.1"',
      'devDependencies: "vite" must be "catalog:", not "catalog:tools"',
      'peerDependencies: "react-dom" must be "catalog:", not ">=19"',
    ])
  })

  it('reports a folder without a package.json', () => {
    expect(checkPackage(webLibrary({ manifest: null }))).toEqual([
      'package.json is missing or is not an object (a leftover folder of a deleted package? delete it)',
    ])
  })
})

describe('checkRootManifest', () => {
  it('accepts tools from the catalog', () => {
    expect(checkRootManifest({ devDependencies: { nx: 'catalog:' } })).toEqual([])
  })

  it('reports runtime dependencies and versions in the root', () => {
    const manifest = { dependencies: { react: 'catalog:' }, devDependencies: { nx: '24.0.6' } }

    expect(checkRootManifest(manifest)).toEqual([
      'the root package.json must not have "dependencies": a library belongs to the package that imports it',
      'devDependencies: "nx" must be "catalog:", not "24.0.6"',
    ])
  })
})

describe('checkLockfile', () => {
  const lockfile = (layoutReact: string) => `lockfileVersion: '9.0'

importers:

  .:
    devDependencies:
      nx:
        specifier: 'catalog:'
        version: 24.0.6

  packages/apps/doremi/apps-doremi:
    dependencies:
      '@doremi/apps-doremi-ui-layout':
        specifier: workspace:*
        version: link:../apps-doremi-ui-layout
      react:
        specifier: 'catalog:'
        version: 19.3.1

  packages/apps/doremi/apps-doremi-ui-layout:
    dependencies:
      react:
        specifier: 'catalog:'
        version: ${layoutReact}

packages:

  react@19.3.1:
    resolution: {integrity: sha512-x}
`

  it('accepts one copy of every library', () => {
    expect(checkLockfile(lockfile('19.3.1'))).toEqual([])
  })

  it('accepts Windows line endings', () => {
    expect(checkLockfile(lockfile('19.3.1').replaceAll('\n', '\r\n'))).toEqual([])
    expect(checkLockfile(lockfile('19.2.0').replaceAll('\n', '\r\n'))).toHaveLength(1)
  })

  it('reports a lockfile it cannot read, and does not say "no problems"', () => {
    const unreadable = [
      'cannot read the "importers" section: has the format of pnpm-lock.yaml changed?',
    ]

    expect(checkLockfile('')).toEqual(unreadable)
    // The same content with another indentation: a sign that the format has changed.
    expect(checkLockfile(lockfile('19.2.0').replaceAll('  ', '    '))).toEqual(unreadable)
  })

  it('accepts two copies of a tool in devDependencies', () => {
    const withDevTools = lockfile('19.3.1')
      .replace(
        "      nx:\n        specifier: 'catalog:'\n        version: 24.0.6",
        "      vitest:\n        specifier: 'catalog:'\n        version: 5.1.1(jsdom@31.0.1)",
      )
      .concat('\n')
      .replace(
        '  packages/apps/doremi/apps-doremi-ui-layout:\n',
        "  packages/apps/doremi/apps-doremi-ui-layout:\n    devDependencies:\n      vitest:\n        specifier: 'catalog:'\n        version: 5.1.1\n",
      )

    expect(withDevTools).toContain('version: 5.1.1(jsdom@31.0.1)')
    expect(checkLockfile(withDevTools)).toEqual([])
  })

  it('reports a library that two packages resolve differently', () => {
    expect(checkLockfile(lockfile('19.2.0'))).toEqual([
      '"react" is resolved in 2 different ways:' +
        '\n    19.3.1\n      in packages/apps/doremi/apps-doremi' +
        '\n    19.2.0\n      in packages/apps/doremi/apps-doremi-ui-layout',
    ])
  })
})
